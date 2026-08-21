import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, AlertTriangle,
  Download, ChevronRight, Loader2, X, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import {
  parseCsvToObject, detectDelimiter, normalizeDate, normalizeNumber,
  autoMapColumns, validateRow,
} from '@/lib/csvUtils';

const CHUNK_SIZE = 50; // rows per bulkCreate call — safe under API limits
const SUB_CHUNK_SIZE = 10; // fallback sub-chunk if full chunk fails
const RETRY_DELAY = 800; // ms between retries for transient failures

export default function SmartCsvImporter({
  entityName,
  filename,
  columns,          // [{ key, label, type: 'date'|'number'|'text', required?, sample? }]
  transform,        // optional: (mappedRow) => finalRow  — applied AFTER normalization
  enrichRows,        // optional: async (rows) => rows
  onImported,
  label = 'Import CSV',
  className = '',
  batchTracking,
  onBatchImported,
}) {
  const { toast } = useToast();
  const fileRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1); // 1=upload, 2=map, 3=review, 4=importing, 5=done
  const [csvFilename, setCsvFilename] = useState('');
  const [rawHeaders, setRawHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);      // array of {header: value}
  const [mapping, setMapping] = useState({});       // {fieldKey: headerIndex}
  const [validation, setValidation] = useState(null);
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0, errors: [] });
  const [results, setResults] = useState(null);

  // ── Step 1: File upload + parse ──
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFilename(file.name);
    try {
      const text = await file.text();
      const { headers, rows } = parseCsvToObject(text);
      if (!headers.length || !rows.length) {
        toast({ title: 'CSV is empty or invalid', variant: 'destructive' });
        e.target.value = '';
        return;
      }
      setRawHeaders(headers);
      setRawRows(rows);
      // Auto-map columns
      const auto = autoMapColumns(headers, columns.map((c) => c.key));
      setMapping(auto);
      setStep(2);
      setOpen(true);
    } catch (err) {
      toast({ title: 'Failed to read CSV', description: err.message, variant: 'destructive' });
    }
    e.target.value = '';
  };

  // ── Step 2→3: Apply mapping + normalize + validate ──
  const goToReview = useCallback(() => {
    const mapped = rawRows.map((row) => {
      const obj = {};
      columns.forEach((col) => {
        const idx = mapping[col.key];
        const rawVal = idx != null && idx !== '' ? row[rawHeaders[idx]] : '';
        // Normalize by type
        if (col.type === 'date') obj[col.key] = normalizeDate(rawVal);
        else if (col.type === 'number') obj[col.key] = normalizeNumber(rawVal);
        else obj[col.key] = String(rawVal ?? '').trim();
      });
      return transform ? transform(obj) : obj;
    }).filter((r) => Object.values(r).some((v) => v !== '' && v != null && v !== 0));

    // Validate
    const fieldDefs = columns.map((c) => ({
      key: c.key, label: c.label, type: c.type, required: c.required,
    }));
    const validated = mapped.map((row, i) => {
      const { valid, errors } = validateRow(row, fieldDefs);
      return { row, valid, errors, lineNo: i + 2 }; // +2 for header + 1-indexed
    });
    const validRows = validated.filter((v) => v.valid).map((v) => v.row);
    const invalidRows = validated.filter((v) => !v.valid);
    setValidation({ validRows, invalidRows, total: mapped.length });
    setStep(3);
  }, [rawRows, mapping, rawHeaders, columns, transform]);

  // ── Step 4: Chunked import with progress ──
  const doImport = async () => {
    setStep(4);
    const rowsToImport = validation.validRows;
    let finalRows = rowsToImport;
    if (typeof enrichRows === 'function') {
      try { finalRows = await enrichRows(rowsToImport); } catch { /* keep original */ }
    }

    let batchId = null;
    let importedBy = 'Unknown';
    let importedDatetime = new Date().toISOString();

    if (batchTracking) {
      batchId = `IMP-${Date.now()}-${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`;
      try {
        const me = await base44.auth.me().catch(() => null);
        importedBy = me?.full_name || me?.email || 'Unknown';
      } catch { /* ignore */ }
      finalRows = finalRows.map((r) => ({ ...r, import_batch_id: batchId }));
    }

    const total = finalRows.length;
    let done = 0;
    let failed = 0;
    const errors = [];
    const chunks = [];
    for (let i = 0; i < total; i += CHUNK_SIZE) {
      chunks.push(finalRows.slice(i, i + CHUNK_SIZE));
    }

    setProgress({ done: 0, total, failed: 0, errors: [] });

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const createWithRetry = async (rows, label) => {
      // Try bulkCreate with up to 2 retries for transient failures
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await base44.entities[entityName].bulkCreate(rows);
        } catch (err) {
          if (attempt === 2) throw err;
          await sleep(RETRY_DELAY * (attempt + 1));
        }
      }
    };

    for (let ci = 0; ci < chunks.length; ci++) {
      const chunk = chunks[ci];
      try {
        await createWithRetry(chunk, `chunk-${ci + 1}`);
        done += chunk.length;
      } catch (err) {
        // Chunk failed — fall back to sub-chunks of SUB_CHUNK_SIZE
        for (let si = 0; si < chunk.length; si += SUB_CHUNK_SIZE) {
          const sub = chunk.slice(si, si + SUB_CHUNK_SIZE);
          try {
            await createWithRetry(sub, `sub-${ci + 1}-${si}`);
            done += sub.length;
          } catch (subErr) {
            // Sub-chunk failed — fall back to individual row creation
            for (const row of sub) {
              try {
                await base44.entities[entityName].create(row);
                done += 1;
              } catch (rowErr) {
                failed += 1;
                errors.push({ chunk: `row-${ci + 1}`, message: rowErr.message || 'Unknown error' });
              }
            }
          }
          setProgress({ done, total, failed, errors });
        }
      }
      setProgress({ done, total, failed, errors });
    }

    // Record batch
    if (batchTracking && done > 0) {
      try {
        await base44.entities.ImportBatch.create({
          batch_id: batchId,
          entity_type: entityName,
          filename: csvFilename || 'unknown.csv',
          row_count: done,
          imported_by: importedBy,
          imported_datetime: importedDatetime,
          status: 'active',
        });
      } catch { /* best-effort */ }
    }

    setResults({ success: done, failed, total, errors });
    setStep(5);
    if (done > 0) {
      toast({ title: `Imported ${done} ${entityName.toLowerCase()}s` });
      onImported?.();
      if (batchTracking && onBatchImported) {
        onBatchImported({ batchId, filename: csvFilename || 'unknown.csv', rowCount: done, importedBy, importedDatetime });
      }
    }
  };

  const reset = () => {
    setOpen(false);
    setStep(1);
    setRawHeaders([]);
    setRawRows([]);
    setMapping({});
    setValidation(null);
    setProgress({ done: 0, total: 0, failed: 0, errors: [] });
    setResults(null);
    setCsvFilename('');
  };

  const downloadSample = () => {
    const header = columns.map((c) => c.key).join(',');
    const sample = columns.map((c) => c.sample ?? '').join(',');
    const csv = `${header}\n${sample}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className={className || 'inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-muted/40 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors'}
      >
        <Upload className="w-4 h-4" />
        {label}
      </button>

      <Dialog open={open} onOpenChange={(v) => !v && reset()}>
        <DialogContent className="bg-card border-border max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-foreground">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Smart Import — {entityName}
              {csvFilename && <span className="text-xs text-muted-foreground font-normal ml-2">{csvFilename}</span>}
            </DialogTitle>
          </DialogHeader>

          {/* ── Step indicator ── */}
          <div className="flex items-center gap-2 mb-4">
            {['Upload', 'Map Columns', 'Review', 'Import'].map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${step >= i + 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step >= i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {step > i + 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  {label}
                </div>
                {i < 3 && <div className={`flex-1 h-px ${step > i + 1 ? 'bg-primary' : 'bg-border'}`} />}
              </div>
            ))}
          </div>

          {/* ── Step 2: Column mapping ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Map your CSV columns to {entityName} fields. Auto-detected — adjust if needed.
                </p>
                <button onClick={downloadSample} className="text-xs text-primary hover:underline inline-flex items-center gap-1 flex-shrink-0">
                  <Download className="w-3.5 h-3.5" /> Sample CSV
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {columns.map((col) => (
                  <div key={col.key} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{col.label}</p>
                      <p className="text-[10px] text-muted-foreground">{col.type || 'text'}{col.required ? ' · required' : ''}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <select
                      value={mapping[col.key] ?? ''}
                      onChange={(e) => setMapping((m) => ({ ...m, [col.key]: e.target.value === '' ? '' : Number(e.target.value) }))}
                      className="flex-1 min-w-0 bg-input border border-border rounded-md px-2 py-1.5 text-xs text-foreground"
                    >
                      <option value="">— Not mapped —</option>
                      {rawHeaders.map((h, i) => (
                        <option key={i} value={i}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              {/* Preview */}
              <div className="max-h-[200px] overflow-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      {columns.map((c) => (
                        <th key={c.key} className="text-left p-2 font-semibold text-muted-foreground whitespace-nowrap">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t border-border/50">
                        {columns.map((c) => {
                          const idx = mapping[c.key];
                          const val = idx != null && idx !== '' ? row[rawHeaders[idx]] : '';
                          return <td key={c.key} className="p-2 whitespace-nowrap text-foreground/80">{val || '—'}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={reset} className="border-border">Cancel</Button>
                <Button onClick={goToReview} className="bg-primary hover:bg-primary/90">
                  Review {rawRows.length} rows <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Validation review ── */}
          {step === 3 && validation && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{validation.validRows.length}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Valid</p>
                </div>
                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{validation.invalidRows.length}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Invalid</p>
                </div>
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
                  <FileSpreadsheet className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-2xl font-bold text-foreground">{validation.total}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
                </div>
              </div>

              {validation.invalidRows.length > 0 && (
                <div className="max-h-[200px] overflow-auto rounded-lg border border-amber-500/20">
                  <table className="w-full text-xs">
                    <thead className="bg-amber-500/10 sticky top-0">
                      <tr>
                        <th className="text-left p-2 font-semibold text-amber-400 w-16">Line</th>
                        <th className="text-left p-2 font-semibold text-amber-400">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validation.invalidRows.slice(0, 50).map((v, i) => (
                        <tr key={i} className="border-t border-amber-500/10">
                          <td className="p-2 text-muted-foreground font-mono">{v.lineNo}</td>
                          <td className="p-2 text-foreground/70">{v.errors.join('; ')}</td>
                        </tr>
                      ))}
                      {validation.invalidRows.length > 50 && (
                        <tr><td colSpan={2} className="p-2 text-center text-muted-foreground">… and {validation.invalidRows.length - 50} more</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                {validation.validRows.length > 0
                  ? `${validation.validRows.length} rows will be imported. ${validation.invalidRows.length > 0 ? `${validation.invalidRows.length} invalid rows will be skipped.` : ''}`
                  : 'No valid rows to import. Please fix your CSV or adjust column mapping.'}
              </p>

              <div className="flex justify-between gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="border-border">Back</Button>
                <Button
                  onClick={doImport}
                  disabled={validation.validRows.length === 0}
                  className="bg-primary hover:bg-primary/90"
                >
                  Import {validation.validRows.length} rows
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Importing with progress ── */}
          {step === 4 && (
            <div className="py-8 space-y-4">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
                <p className="text-lg font-semibold text-foreground">Importing…</p>
                <p className="text-sm text-muted-foreground">{progress.done} of {progress.total} rows</p>
              </div>
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{pct}% complete</span>
                {progress.failed > 0 && <span className="text-rose-400">{progress.failed} failed</span>}
              </div>
              <p className="text-center text-[10px] text-muted-foreground">
                Uploading in chunks of {CHUNK_SIZE} rows with auto-retry and fallback…
              </p>
            </div>
          )}

          {/* ── Step 5: Results ── */}
          {step === 5 && results && (
            <div className="py-6 text-center space-y-3">
              {results.success > 0 ? (
                <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
              ) : (
                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              )}
              <p className="text-lg font-semibold text-foreground">{results.success} imported successfully</p>
              {results.failed > 0 && (
                <p className="text-sm text-rose-400">{results.failed} rows failed</p>
              )}
              {results.errors.length > 0 && (
                <div className="max-h-[120px] overflow-auto rounded-lg border border-rose-500/20 bg-rose-500/5 p-2 text-left">
                  {results.errors.slice(0, 10).map((e, i) => (
                    <p key={i} className="text-xs text-rose-400/80">
                      Chunk {e.chunk}: {e.message}
                    </p>
                  ))}
                  {results.errors.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center mt-1">… and {results.errors.length - 10} more errors</p>
                  )}
                </div>
              )}
              <Button onClick={reset} className="mt-4 bg-primary hover:bg-primary/90">Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}