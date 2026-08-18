import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const parseLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {current += '"';i++;} else
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {current += ch;}
    }
    result.push(current.trim());
    return result;
  };
  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

function downloadSampleCsv(filename, columns) {
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
}

export default function CsvImportButton({ entityName, filename, columns, transform, enrichRows, onImported, label = 'Import CSV', className = '' }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { headers, rows: parsed } = parseCsv(text);
    if (!headers.length) {toast({ title: 'CSV is empty', variant: 'destructive' });return;}
    const mapped = parsed.map((row) => {
      const obj = {};
      headers.forEach((h, i) => {obj[h.trim()] = row[i] ?? '';});
      return transform ? transform(obj) : obj;
    }).filter((r) => Object.values(r).some((v) => v !== '' && v !== undefined && v !== null));
    setRows(mapped);
    setResults(null);
    setOpen(true);
    e.target.value = '';
  };

  const doImport = async () => {
    setImporting(true);
    try {
      let finalRows = rows;
      if (typeof enrichRows === 'function') {
        finalRows = await enrichRows(rows);
      }
      const created = await base44.entities[entityName].bulkCreate(finalRows);
      setResults({ success: created.length, failed: finalRows.length - created.length });
      toast({ title: `Imported ${created.length} ${entityName.toLowerCase()}s` });
      onImported?.();
    } catch (err) {
      setResults({ success: 0, failed: rows.length, error: err.message });
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {setOpen(false);setRows([]);setResults(null);};

  return (
    <>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      <Button variant="outline" onClick={() => fileRef.current?.click()} className={`h-10 border-border hidden ${className}`}>
        <Upload className="w-4 h-4 mr-1.5" />{label}
      </Button>
      <Dialog open={open} onOpenChange={(v) => !v && reset()}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-foreground">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Import {entityName}s — {rows.length} rows
            </DialogTitle>
          </DialogHeader>
          {!results ?
          <>
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-xs text-muted-foreground">Review the data below, then click Import to add {rows.length} records.</p>
                <button onClick={() => downloadSampleCsv(filename, columns)} className="text-xs text-primary hover:underline inline-flex items-center gap-1 flex-shrink-0">
                  <Download className="w-3.5 h-3.5" /> Sample CSV
                </button>
              </div>
              <div className="max-h-[400px] overflow-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>{columns.map((c) => <th key={c.key} className="text-left p-2 font-semibold text-muted-foreground whitespace-nowrap">{c.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 50).map((row, i) =>
                  <tr key={i} className="border-t border-border/50">
                        {columns.map((c) => <td key={c.key} className="p-2 whitespace-nowrap">{row[c.key] ?? '—'}</td>)}
                      </tr>
                  )}
                  </tbody>
                </table>
                {rows.length > 50 && <p className="p-2 text-xs text-muted-foreground text-center">… and {rows.length - 50} more rows</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={reset} className="border-border">Cancel</Button>
                <Button onClick={doImport} disabled={importing} className="bg-primary hover:bg-primary/90">
                  {importing ? 'Importing…' : `Import ${rows.length} rows`}
                </Button>
              </DialogFooter>
            </> :

          <div className="py-6 text-center">
              {results.success > 0 ? <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" /> : <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />}
              <p className="text-lg font-semibold text-foreground">{results.success} imported successfully</p>
              {results.failed > 0 && <p className="text-sm text-muted-foreground mt-1">{results.failed} rows failed</p>}
              <Button onClick={reset} className="mt-4 bg-primary hover:bg-primary/90">Done</Button>
            </div>
          }
        </DialogContent>
      </Dialog>
    </>);

}