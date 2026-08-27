import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, ArrowDownLeft, ArrowUpRight, Search, CalendarRange, Link2, User } from 'lucide-react';
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
import ExcelLedgerTable from '@/components/cash/ExcelLedgerTable';
import MobileLedgerList from '@/components/cash/MobileLedgerList';
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
  enableImportUndo,
  autoRef = false,
  refPrefix = 'REF',
  enableDriverLink = false
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
  const [driverFilter, setDriverFilter] = useState('');
  const [recipientTypeFilter, setRecipientTypeFilter] = useState('all');
  const [drivers, setDrivers] = useState([]);
  const [balanceError, setBalanceError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (enableDriverLink) {
      base44.entities.Driver.list('-created_date', 500).catch(() => []).then((d) => setDrivers(d || []));
    }
  }, [enableDriverLink]);
  const viewOptions = useMemo(() => enableImportUndo
    ? [{ value: 'statement', label: 'Statement' }, { value: 'report', label: 'Report' }, { value: 'history', label: 'Import History' }]
    : [{ value: 'statement', label: 'Statement' }, { value: 'report', label: 'Report' }], [enableImportUndo]);

  useEffect(() => { initLedger(entityName, defaultMode, modeOptions, viewOptions); }, [entityName, defaultMode, modeOptions, viewOptions]);

  const load = useCallback(async () => {
    const data = await base44.entities[entityName].list('-date', 5000).catch(() => []);
    setRows(data || []);
  }, [entityName]);

  useEffect(() => { load(); }, [load]);

  // Auto-generate sequential reference numbers (REF-0001, REF-0002, …) in chronological order
  const didInitRef = useRef(false);
  const ensureReferenceSequence = useCallback(async () => {
    if (!autoRef) return;
    const data = rows || [];
    if (data.length === 0) return;
    const sorted = data.slice().sort((a, b) => {
      const d = (a.date || '').localeCompare(b.date || '');
      if (d !== 0) return d;
      return (a.created_date || '').localeCompare(b.created_date || '');
    });
    const updates = [];
    sorted.forEach((r, idx) => {
      const expected = `${refPrefix}-${String(idx + 1).padStart(4, '0')}`;
      if ((r[refKey] || '') !== expected) updates.push({ id: r.id, [refKey]: expected });
    });
    if (updates.length === 0) return;
    try {
      for (let i = 0; i < updates.length; i += 500) {
        await base44.entities[entityName].bulkUpdate(updates.slice(i, i + 500));
      }
      await load();
    } catch {}
  }, [autoRef, refPrefix, rows, refKey, entityName, load]);

  useEffect(() => {
    if (autoRef && rows && rows.length > 0 && !didInitRef.current) {
      didInitRef.current = true;
      ensureReferenceSequence();
    }
  }, [autoRef, rows, ensureReferenceSequence]);

  // Next reference number for new entries
  const nextRef = useMemo(() => {
    if (!autoRef) return '';
    const refRegex = new RegExp(`^${refPrefix}-(\\d+)$`);
    let maxSeq = 0;
    for (const r of (rows || [])) {
      const match = (r[refKey] || '').match(refRegex);
      if (match) maxSeq = Math.max(maxSeq, parseInt(match[1], 10));
    }
    return `${refPrefix}-${String(maxSeq + 1).padStart(4, '0')}`;
  }, [autoRef, refPrefix, rows, refKey]);

  // Pre-fill reference field when autoRef is enabled
  useEffect(() => {
    if (autoRef && nextRef && !editId) {
      setForm((f) => (f[refKey] !== nextRef ? { ...f, [refKey]: nextRef } : f));
    }
  }, [autoRef, nextRef, editId, refKey]);

  const makeForm = useCallback(() => {
    const f = { date: dateHasTime ? nowLocal() : nowDate(), recipient: '', description: '', recipient_mode: 'manual', driver_id: '' };
    f[refKey] = autoRef ? nextRef : '';
    f[inflowKey] = '';
    f[outflowKey] = '';
    return f;
  }, [dateHasTime, refKey, inflowKey, outflowKey, autoRef, nextRef]);

  const [form, setForm] = useState(() => {
    const f = { date: dateHasTime ? nowLocal() : nowDate(), recipient: '', description: '', recipient_mode: 'manual', driver_id: '' };
    f[refKey] = '';
    f[inflowKey] = '';
    f[outflowKey] = '';
    return f;
  });

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
    return { id: r.id, date: r.date, recipient: a.recipient, ref: a.ref, description: r.description, in: a.in, out: a.out, running_balance: run, driver_id: r.driver_id, recipient_type: r.recipient_type };
  });

  // apply date + search + driver filters — only hides rows, does NOT recompute running balance
  const filtered = allStatementRows.filter((r) => {
    const rDate = (r.date || '').slice(0, 10);
    if (filterFrom && rDate < filterFrom) return false;
    if (filterTo && rDate > filterTo) return false;
    if (q && !((r.description || '').toLowerCase().includes(q.toLowerCase()) || (r.recipient || '').toLowerCase().includes(q.toLowerCase()))) return false;
    if (enableDriverLink) {
      if (recipientTypeFilter === 'driver' && r.recipient_type !== 'driver') return false;
      if (recipientTypeFilter === 'manual' && r.recipient_type === 'driver') return false;
      if (driverFilter && r.driver_id !== driverFilter) return false;
    }
    return true;
  });

  // report view formats date for display; statement view keeps raw date for editing.
  // running_balance is preserved from the full chronological set — never recomputed by filters.
  const reportRows = filtered.map((r) => ({ ...r, date: fmtDate(r.date) }));
  const statementRows = filtered;

  // latest transactions first
  const chronologicalDisplay = view === 'report' ? reportRows : statementRows;
  const display = chronologicalDisplay.slice().reverse();

  // summary stats always reflect the FULL dataset — filters never change calculations
  const totalIn = allStatementRows.reduce((s, r) => s + (Number(r.in) || 0), 0);
  const totalOut = allStatementRows.reduce((s, r) => s + (Number(r.out) || 0), 0);
  const closingBalance = allStatementRows.length ? allStatementRows[allStatementRows.length - 1].running_balance : 0;

  const dateRangeLabel = (filterFrom || filterTo) ? `${filterFrom || 'start'} → ${filterTo || 'today'}` : 'All dates';

  const startEdit = (r) => {
    const rawRow = (rows || []).find((row) => row.id === r.id);
    const f = {
      date: dateHasTime ? (r.date || '').slice(0, 16) : (r.date || '').slice(0, 10),
      recipient: r.recipient || '',
      description: r.description || '',
      recipient_mode: enableDriverLink ? (rawRow?.recipient_type === 'driver' ? 'driver' : 'manual') : 'manual',
      driver_id: enableDriverLink ? (rawRow?.driver_id || '') : '',
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
    setBalanceError('');

    // Petty cash pool validation: block outflows that exceed the pool's running balance
    if (outAmt > 0) {
      const poolBalance = allStatementRows.length ? allStatementRows[allStatementRows.length - 1].running_balance : 0;
      const adjustedBalance = editId ? poolBalance + (Number(rows?.find((r) => r.id === editId)?.type === 'outflow' ? Number(rows.find((r) => r.id === editId)?.amount) || 0 : 0)) : poolBalance;
      if (outAmt > adjustedBalance) {
        setBalanceError(`Insufficient petty cash pool balance (available: ${fmt(adjustedBalance)})`);
        return;
      }
    }

    setSaving(true);
    try {
      // Ensure auto-generated reference is set
      if (autoRef && !form[refKey]) {
        form[refKey] = nextRef;
      }
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

  // Unique recipient suggestions from existing records (previously written)
  const recipientSuggestions = useMemo(() => {
    const names = new Set();
    for (const r of (rows || [])) {
      if (r.received_from) names.add(r.received_from);
      if (r.paid_to) names.add(r.paid_to);
    }
    return Array.from(names).sort();
  }, [rows]);

  // grid spans: with recipient → 2/2/3/1/1/1 ; without → 2/2/3/2/2/1
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 px-3 py-3 sm:p-5">
          <ReportStatCard index={0} label={summaryLabels.inflow} value={totalIn} format={(v) => fmt(v)} icon={ArrowDownLeft} color="#34d399" />
          <ReportStatCard index={1} label={summaryLabels.outflow} value={totalOut} format={(v) => fmt(v)} icon={ArrowUpRight} color="#fb7185" />
          <ReportStatCard index={2} label={summaryLabels.balance} value={closingBalance} format={(v) => fmt(v)} icon={BalanceIcon} color="#3b82f6" />
        </div>

        {/* date filter bar — desktop only (mobile uses TopBar search) */}
        <div className="hidden md:flex p-5 flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><CalendarRange className="w-3 h-3" /> From</label>
            <DatePicker value={filterFrom || ''} onChange={(v) => setFilterFrom(v)} />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">To</label>
            <DatePicker value={filterTo || ''} onChange={(v) => setFilterTo(v)} />
          </div>
          {enableDriverLink && (
            <>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Type</label>
                <select
                  value={recipientTypeFilter}
                  onChange={(e) => setRecipientTypeFilter(e.target.value)}
                  className="clay-input"
                  style={{ padding: '9px 12px', fontSize: 13, height: 38 }}
                >
                  <option value="all">All Recipients</option>
                  <option value="driver">Driver-Linked</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Driver</label>
                <select
                  value={driverFilter}
                  onChange={(e) => setDriverFilter(e.target.value)}
                  className="clay-input"
                  style={{ padding: '9px 12px', fontSize: 13, height: 38, minWidth: 160 }}
                >
                  <option value="">All Drivers</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Search className="w-3 h-3" /> Search</label>
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search description or recipient..." className="clay-input w-full" style={{ padding: '9px 12px', fontSize: 13 }} />
          </div>
          {(filterFrom || filterTo || q || driverFilter || recipientTypeFilter !== 'all') && (
            <button
              onClick={() => { setFilterFrom(''); setFilterTo(''); setQ(''); setDriverFilter(''); setRecipientTypeFilter('all'); }}
              className="text-xs px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              Clear Filters
            </button>
          )}
          <div className="ml-auto">
            <ExportButtons
              data={chronologicalDisplay}
              filename={exportFilename}
              columns={exportColumns}
              title={exportTitle}
              options={{ dateRange: dateRangeLabel, landscape: true }}
            />
          </div>
        </div>
        <div className="h-px bg-white/5" />

        {view === 'history' && enableImportUndo ? (
          <ImportHistoryPanel key={historyRefreshKey} entityName={entityName} onUndo={(bid) => setUndoBatchId(bid)} onDeleted={() => setHistoryRefreshKey(k => k + 1)} />
        ) : (
        <>

          {/* STATEMENT VIEW — inline add form */}
          {view === 'statement' && (
            <>
              <form onSubmit={addEntry} className="px-3 py-3 sm:p-5">
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
                      <input
                        type="text"
                        value={form.recipient}
                        onChange={(e) => setField('recipient', e.target.value)}
                        placeholder="Paid to / Received from"
                        list="recipient-suggestions"
                        className="clay-input w-full"
                        style={{ padding: '10px 14px', fontSize: 13 }}
                        autoComplete="off"
                      />
                      <datalist id="recipient-suggestions">
                        {recipientSuggestions.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{refLabel}{autoRef && <span className="text-primary/70 ml-1 normal-case">(auto)</span>}</label>
                    <input type="text" value={form[refKey]} onChange={(e) => setField(refKey, e.target.value)} placeholder={refLabel} className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} readOnly={autoRef} />
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
                  {balanceError && (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                    {balanceError}
                  </div>
                  )}
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

          {/* Mobile card list — clean transaction cards on page background */}
          <div className="md:hidden">
            {rows === null ? (
              <div className="p-10"><LoadingSpinner /></div>
            ) : (
              <MobileLedgerList
                rows={display}
                refKey="ref"
                refLabel={refLabel}
                hasRecipient={hasRecipient}
                inflowLabel={inflowLabel}
                outflowLabel={outflowLabel}
                onEdit={view === 'statement' ? startEdit : undefined}
                onDelete={view === 'statement' ? remove : undefined}
                showActions={view === 'statement'}
                emptyIcon={view === 'report' ? Search : Plus}
                emptyTitle={view === 'report' ? 'No entries match your filters' : 'No entries yet'}
                emptyDescription={view === 'report' ? 'Try adjusting your date range or search query.' : 'Add your first transaction using the form above.'}
              />
            )}
          </div>

          {/* Desktop Excel-like table with smart filters */}
          <div className="hidden md:block" style={PANEL}>
            {rows === null ? (
              <div className="p-10"><LoadingSpinner /></div>
            ) : (
              <ExcelLedgerTable
                rows={display}
                refKey="ref"
                columns={[
                  { key: 'date', label: 'Date', align: 'left', width: '140px', mono: true, sortable: true, filterable: true },
                  ...(hasRecipient ? [{
                    key: 'recipient',
                    label: 'Recipient',
                    align: 'left',
                    sortable: true,
                    filterable: true,
                    ...(enableDriverLink ? {
                      render: (row, val) => {
                        if (row.recipient_type === 'driver' && row.driver_id) {
                          return (
                            <button
                              onClick={() => navigate(`/admin/drivers/${row.driver_id}`)}
                              className="inline-flex items-center gap-1.5 text-primary hover:text-primary-light hover:underline text-sm font-medium transition-colors"
                              title="View driver profile"
                            >
                              <Link2 className="w-3 h-3 flex-shrink-0" />
                              {val || '—'}
                            </button>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1.5 text-foreground/80 text-sm font-medium">
                            <User className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                            {val || '—'}
                          </span>
                        );
                      }
                    } : {}),
                  }] : []),
                  ...(enableDriverLink ? [{ key: 'recipient_type', label: 'Type', align: 'left', width: '90px', sortable: true, filterable: true, render: (row) => (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      row.recipient_type === 'driver'
                        ? 'bg-primary/15 text-primary border border-primary/25'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {row.recipient_type === 'driver' ? <Link2 className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                      {row.recipient_type === 'driver' ? 'Driver' : 'Manual'}
                    </span>
                  ) }] : []),
                  { key: 'ref', label: refLabel, align: 'left', width: '150px', mono: true, sortable: true, filterable: true },
                  { key: 'description', label: 'Description', align: 'left', sortable: true, filterable: true },
                  { key: 'in', label: inflowLabel, align: 'right', width: '140px', numeric: true, sortable: true, filterable: true },
                  { key: 'out', label: outflowLabel, align: 'right', width: '140px', numeric: true, sortable: true, filterable: true },
                  { key: 'running_balance', label: 'Running Balance', align: 'right', width: '150px', numeric: true, sortable: true },
                ]}
                onEdit={view === 'statement' ? startEdit : undefined}
                onDelete={view === 'statement' ? remove : undefined}
                onFixMissingRef={async (row, generatedRef) => {
                  await base44.entities[entityName].update(row.id, { [refKey]: generatedRef });
                }}
                showActions={view === 'statement'}
                emptyIcon={view === 'report' ? Search : Plus}
                emptyTitle={view === 'report' ? 'No entries match your filters' : 'No entries yet'}
                emptyDescription={view === 'report' ? 'Try adjusting your date range or search query.' : 'Add your first transaction using the form above.'}
              />
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