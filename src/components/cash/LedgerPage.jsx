import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useProgressiveRender } from '@/hooks/useProgressiveRender';
import { Plus, Trash2, Pencil, ArrowDownLeft, ArrowUpRight, Search, CalendarRange } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ExportButtons from '@/components/common/ExportButtons';
import SmartCsvImporter from '@/components/common/SmartCsvImporter';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import LedgerAnalytics from '@/components/cash/LedgerAnalytics';
import DatePicker from '@/components/common/DatePicker';
import ReportStatCard from '@/components/reports/ReportStatCard';
import EmptyState from '@/components/common/EmptyState';
import ImportUndoBanner from '@/components/bank-rec/ImportUndoBanner';
import ImportHistoryPanel from '@/components/bank-rec/ImportHistoryPanel';
import UndoImportDialog from '@/components/bank-rec/UndoImportDialog';
import { useLedgerState, setLedgerMode, setLedgerView, initLedger } from '@/lib/ledgerStore';

const PANEL = {
  background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.80) 0%, rgba(var(--surf-2-rgb),0.92) 100%)',
  backdropFilter: 'blur(28px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.3)',
  border: '1px solid rgba(var(--panel-accent-rgb),0.12)',
  borderRadius: 22,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 16px 44px -14px rgba(0,0,0,0.1)'
};

const fmt = (n) => new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);

const fmtDate = (d) => {
  if (!d) return '—';
  if (d.includes('T')) {
    const [date, time] = d.split('T');
    return `${date} · ${time.slice(0, 5)}`;
  }
  return d;
};

const nowDate = () => new Date().toISOString().slice(0, 10);
const nowLocal = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function LedgerPage({
  entityName,
  inflowKey, outflowKey, inflowLabel, outflowLabel,
  refKey, refLabel, hasRecipient,
  summaryLabels, BalanceIcon,
  modeOptions, defaultMode, modeFilter,
  rowToAmounts, buildCreate, dateHasTime,
  exportFilename, exportTitle, exportColumns,
  importConfig,
  enableImportUndo
}) {
  const [rows, setRows] = useState(null);
  const ledgerState = useLedgerState();
  const view = ledgerState.view;
  const mode = ledgerState.mode;
  const setView = setLedgerView;
  const setMode = setLedgerMode;
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const { dateFrom: filterFrom, dateTo: filterTo, setDateFrom: setFilterFrom, setDateTo: setFilterTo } = useGlobalDate();
  const [q, setQ] = useState('');
  const [lastBatch, setLastBatch] = useState(null);
  const [undoBatchId, setUndoBatchId] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const viewOptions = useMemo(() => enableImportUndo
    ? [{ value: 'statement', label: 'Statement' }, { value: 'report', label: 'Report' }, { value: 'history', label: 'Import History' }]
    : [{ value: 'statement', label: 'Statement' }, { value: 'report', label: 'Report' }], [enableImportUndo]);

  useEffect(() => { initLedger(entityName, defaultMode, modeOptions, viewOptions); }, [entityName, defaultMode, modeOptions, viewOptions]);

  const makeForm = useCallback(() => {
    const f = { date: dateHasTime ? nowLocal() : nowDate(), recipient: '', description: '' };
    f[refKey] = '';
    f[inflowKey] = '';
    f[outflowKey] = '';
    return f;
  }, [dateHasTime, refKey, inflowKey, outflowKey]);

  const [form, setForm] = useState(makeForm());

  const load = useCallback(async () => {
    const data = await base44.entities[entityName].list('-date', 5000).catch(() => []);
    setRows(data || []);
  }, [entityName]);

  useEffect(() => { load(); }, [load]);

  // mode filter (e.g. cash/card, or all/deposits/withdrawals)
  const modeRows = modeOptions ? (rows || []).filter((r) => modeFilter(r, mode)) : (rows || []);

  const sorted = modeRows.slice().sort((a, b) => {
    const d = (a.date || '').localeCompare(b.date || '');
    if (d !== 0) return d;
    return (a.created_date || '').localeCompare(b.created_date || '');
  });

  // statement rows — running balance over full sorted set
  let run = 0;
  const allStatementRows = sorted.map((r) => {
    const a = rowToAmounts(r);
    run += a.in - a.out;
    return { id: r.id, date: r.date, recipient: a.recipient, ref: a.ref, description: r.description, in: a.in, out: a.out, running_balance: run };
  });

  // apply date + search filter to both views
  const filtered = allStatementRows.filter((r) => {
    const rDate = (r.date || '').slice(0, 10);
    if (filterFrom && rDate < filterFrom) return false;
    if (filterTo && rDate > filterTo) return false;
    if (q && !((r.description || '').toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  // recompute running balance over filtered set (for report view)
  let rb = 0;
  const reportRows = filtered.map((r) => {
    rb += (Number(r.in) || 0) - (Number(r.out) || 0);
    return { ...r, date: fmtDate(r.date), running_balance: rb };
  });

  // statement view — same filtered set, keep raw date for editing
  let sb = 0;
  const statementRows = filtered.map((r) => {
    sb += (Number(r.in) || 0) - (Number(r.out) || 0);
    return { ...r, running_balance: sb };
  });

  // latest transactions first
  const chronologicalDisplay = view === 'report' ? reportRows : statementRows;
  const display = chronologicalDisplay.slice().reverse();
  const { visible: visibleRows, sentinelProps, hasMore: hasMoreRows, visibleCount: visR, totalCount: totalR } = useProgressiveRender(display, 50, null, [view, entityName, filterFrom, filterTo, q]);
  const totalIn = chronologicalDisplay.reduce((s, r) => s + (Number(r.in) || 0), 0);
  const totalOut = chronologicalDisplay.reduce((s, r) => s + (Number(r.out) || 0), 0);
  const closingBalance = chronologicalDisplay.length ? chronologicalDisplay[chronologicalDisplay.length - 1].running_balance : 0;

  const dateRangeLabel = (filterFrom || filterTo) ? `${filterFrom || 'start'} → ${filterTo || 'today'}` : 'All dates';

  const startEdit = (r) => {
    const f = {
      date: dateHasTime ? (r.date || '').slice(0, 16) : (r.date || '').slice(0, 10),
      recipient: r.recipient || '',
      description: r.description || '',
    };
    f[refKey] = r.ref || '';
    f[inflowKey] = r.in ? String(r.in) : '';
    f[outflowKey] = r.out ? String(r.out) : '';
    setForm(f);
    setEditId(r.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setForm(makeForm());
    setEditId(null);
  };

  const addEntry = async (e) => {
    e.preventDefault();
    if (!form.date) return;
    const inAmt = Number(form[inflowKey]) || 0;
    const outAmt = Number(form[outflowKey]) || 0;
    if (!inAmt && !outAmt) return;
    setSaving(true);
    try {
      const payload = buildCreate(form, mode, { inAmt, outAmt });
      if (editId) {
        await base44.entities[entityName].update(editId, payload);
        setEditId(null);
      } else {
        await base44.entities[entityName].create(payload);
      }
      setForm(makeForm());
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (editId === id) cancelEdit();
    await base44.entities[entityName].delete(id);
    await load();
  };

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // grid spans: with recipient → 2/2/2/3/1/1/1 ; without → 2/2/3/2/2/1
  const descSpan = hasRecipient ? 'md:col-span-3' : 'md:col-span-3';
  const inSpan = hasRecipient ? 'md:col-span-1' : 'md:col-span-2';
  const outSpan = hasRecipient ? 'md:col-span-1' : 'md:col-span-2';

  return (
  <div className="professional-page-bg min-h-screen pb-28 md:pb-20">
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      {/* Mobile analytics dashboard */}
      <LedgerAnalytics
        rows={rows || []}
        inflowKey={inflowKey}
        outflowKey={outflowKey}
        inflowLabel={inflowLabel}
        outflowLabel={outflowLabel}
        title={exportTitle}
      />

      {enableImportUndo && lastBatch && (
        <ImportUndoBanner
          batch={lastBatch}
          onUndo={() => setUndoBatchId(lastBatch.batchId)}
          onDismiss={() => setLastBatch(null)}
        />
      )}

        {/* summary stat cards — always visible */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5">
          <ReportStatCard index={0} label={summaryLabels.inflow} value={totalIn} format={(v) => fmt(v)} icon={ArrowDownLeft} color="#34d399" />
          <ReportStatCard index={1} label={summaryLabels.outflow} value={totalOut} format={(v) => fmt(v)} icon={ArrowUpRight} color="#fb7185" />
          <ReportStatCard index={2} label={summaryLabels.balance} value={closingBalance} format={(v) => fmt(v)} icon={BalanceIcon} color="#3b82f6" />
        </div>

        {/* date filter bar — always visible */}
        <div className="p-5 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><CalendarRange className="w-3 h-3" /> From</label>
            <DatePicker value={filterFrom || ''} onChange={(v) => setFilterFrom(v)} />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">To</label>
            <DatePicker value={filterTo || ''} onChange={(v) => setFilterTo(v)} />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Search className="w-3 h-3" /> Search</label>
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search description..." className="clay-input w-full" style={{ padding: '9px 12px', fontSize: 13 }} />
          </div>
          {(filterFrom || filterTo || q) && (
            <button
              onClick={() => { setFilterFrom(''); setFilterTo(''); setQ(''); }}
              className="text-xs px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
        <div className="h-px bg-white/5" />

        {view === 'history' && enableImportUndo ? (
          <ImportHistoryPanel key={historyRefreshKey} entityName={entityName} onUndo={(bid) => setUndoBatchId(bid)} onDeleted={() => setHistoryRefreshKey(k => k + 1)} />
        ) : (
        <>

          {/* STATEMENT VIEW — inline add form */}
          {view === 'statement' && (
            <>
              <form onSubmit={addEntry} className="p-5">
                <div className="flex items-center justify-between mb-3">
                 <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                   <Plus className="w-4 h-4" style={{ color: 'rgb(var(--panel-accent-rgb))' }} /> {editId ? 'Edit Entry' : 'Add Entry'}
                 </h2>
                 <div className="flex items-center gap-2">
                 {editId && (
                   <button type="button" onClick={cancelEdit} className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">Cancel Edit</button>
                 )}
                 {importConfig && (
                   <SmartCsvImporter
                     entityName={entityName}
                     filename={exportFilename}
                     columns={importConfig.columns}
                     transform={importConfig.transform}
                     onImported={load}
                     label="Import CSV"
                     batchTracking={enableImportUndo}
                     onBatchImported={enableImportUndo ? (info) => { setLastBatch(info); setView('statement'); } : undefined}
                   />
                 )}
                 </div>
                </div>
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Date</label>
                    {dateHasTime ? (
                      <input
                        type="datetime-local"
                        value={form.date}
                        onChange={(e) => setField('date', e.target.value)}
                        required
                        className="clay-input w-full date-input-clean"
                        style={{ padding: '10px 14px', fontSize: 13, height: 40 }}
                      />
                    ) : (
                      <DatePicker value={form.date} onChange={(v) => setField('date', v)} />
                    )}
                  </div>
                  {hasRecipient && (
                    <div className="md:col-span-2">
                      <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Recipient</label>
                      <input type="text" value={form.recipient} onChange={(e) => setField('recipient', e.target.value)} placeholder="Paid to / Received from" className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{refLabel}</label>
                    <input type="text" value={form[refKey]} onChange={(e) => setField(refKey, e.target.value)} placeholder={refLabel} className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
                  </div>
                  <div className={descSpan}>
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Description</label>
                    <input type="text" value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Transaction description" className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
                  </div>
                  <div className={inSpan}>
                    <label className="block text-[11px] uppercase tracking-wider text-emerald-400 mb-1">{inflowLabel}</label>
                    <input type="number" step="0.01" min="0" value={form[inflowKey]} onChange={(e) => setField(inflowKey, e.target.value)} placeholder="0.00" className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
                  </div>
                  <div className={outSpan}>
                    <label className="block text-[11px] uppercase tracking-wider text-rose-400 mb-1">{outflowLabel}</label>
                    <input type="number" step="0.01" min="0" value={form[outflowKey]} onChange={(e) => setField(outflowKey, e.target.value)} placeholder="0.00" className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
                  </div>
                  <div className="md:col-span-1">
                    <button type="submit" disabled={saving} className="clay-btn w-full flex items-center justify-center gap-2" style={{ padding: '11px 14px' }}>
                      <Plus className="w-4 h-4" /> {saving ? '...' : 'Add'}
                    </button>
                  </div>
                </div>
                </div>
              </form>
              <div className="h-px bg-white/5" />
            </>
          )}

          {/* REPORT VIEW — export */}
          {view === 'report' && (
            <div className="p-5 flex flex-wrap items-end gap-3">
              <ExportButtons data={reportRows} filename={exportFilename} columns={exportColumns} title={exportTitle} options={{ dateRange: dateRangeLabel }} />
            </div>
          )}

          {/* table — scrollable with sticky header */}
          <div className="overflow-auto thin-scroll" style={{ maxHeight: 'calc(100vh - 440px)' }}>
            {rows === null ? (
              <div className="p-10"><LoadingSpinner /></div>
            ) : display.length === 0 ? (
              <EmptyState
                icon={view === 'report' ? Search : Plus}
                title={view === 'report' ? 'No entries match your filters' : 'No entries yet'}
                description={view === 'report' ? 'Try adjusting your date range or search query.' : 'Add your first transaction using the form above.'}
              />
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground bg-background/95 backdrop-blur-sm border-b border-white/10">
                    <th className="text-left font-semibold px-5 py-3 w-32 whitespace-nowrap">Date</th>
                    {hasRecipient && <th className="text-left font-semibold px-5 py-3">Recipient</th>}
                    <th className="text-left font-semibold px-5 py-3 w-36 whitespace-nowrap">{refLabel}</th>
                    <th className="text-left font-semibold px-5 py-3">Description</th>
                    <th className="text-right font-semibold px-5 py-3 text-emerald-400 w-40 whitespace-nowrap">{inflowLabel}</th>
                    <th className="text-right font-semibold px-5 py-3 text-rose-400 w-40 whitespace-nowrap">{outflowLabel}</th>
                    <th className="text-right font-semibold px-5 py-3 whitespace-nowrap" style={{ color: 'rgb(var(--panel-accent-rgb))' }}>Running Balance</th>
                    {view === 'statement' && <th className="px-5 py-3 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r) => (
                    <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-white/90 whitespace-nowrap tabular-nums text-xs">{fmtDate(r.date)}</td>
                      {hasRecipient && <td className="px-5 py-3 text-white/80">{r.recipient || '—'}</td>}
                      <td className="px-5 py-3 text-white/60 font-mono text-xs whitespace-nowrap">{r.ref || '—'}</td>
                      <td className="px-5 py-3 text-white/80">{r.description || '—'}</td>
                      <td className="px-5 py-3 text-right text-emerald-400 tabular-nums text-base font-semibold">{r.in ? fmt(r.in) : '—'}</td>
                      <td className="px-5 py-3 text-right text-rose-400 tabular-nums text-base font-semibold">{r.out ? fmt(r.out) : '—'}</td>
                      <td className="px-5 py-3 text-right font-semibold text-white tabular-nums">{fmt(r.running_balance)}</td>
                      {view === 'statement' && (
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => startEdit(r)} className="text-white/30 hover:text-amber-400 transition-colors" aria-label="Edit entry">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => remove(r.id)} className="text-white/30 hover:text-rose-400 transition-colors" aria-label="Delete entry">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {hasMoreRows && (
                    <tr {...sentinelProps}>
                      <td colSpan={hasRecipient ? 8 : 7} className="text-center text-xs text-muted-foreground py-3">
                        Loading more… ({visR}/{totalR})
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
        )}

        {enableImportUndo && undoBatchId && (
          <UndoImportDialog
            batchId={undoBatchId}
            entityName={entityName}
            onClose={() => setUndoBatchId(null)}
            onUndone={() => { setUndoBatchId(null); setLastBatch(null); setHistoryRefreshKey(k => k + 1); load(); }}
          />
        )}
      </div>
    </div>
  );
}