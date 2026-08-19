import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, ArrowDownLeft, ArrowUpRight, Search, CalendarRange } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ExportButtons from '@/components/common/ExportButtons';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import LedgerAnalytics from '@/components/cash/LedgerAnalytics';
import DatePicker from '@/components/common/DatePicker';

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

function StatCell({ label, value, color, icon: Icon }) {
  return (
    <div className="flex flex-col justify-center px-5 py-3 flex-1 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color }}>
        <Icon className="w-3.5 h-3.5" />{label}
      </div>
      <div className="text-xl font-bold text-white tabular-nums truncate">{value}</div>
    </div>
  );
}

function Toggle({ options, value, onChange }) {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={`sub-tab ${value === o.value ? 'sub-tab-active' : ''}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function LedgerPage({
  entityName,
  inflowKey, outflowKey, inflowLabel, outflowLabel,
  refKey, refLabel, hasRecipient,
  summaryLabels, BalanceIcon,
  modeOptions, defaultMode, modeFilter,
  rowToAmounts, buildCreate, dateHasTime,
  exportFilename, exportTitle, exportColumns
}) {
  const [rows, setRows] = useState(null);
  const [view, setView] = useState('statement');
  const [mode, setMode] = useState(defaultMode);
  const [saving, setSaving] = useState(false);
  const { dateFrom: filterFrom, dateTo: filterTo, setDateFrom: setFilterFrom, setDateTo: setFilterTo } = useGlobalDate();
  const [q, setQ] = useState('');

  const makeForm = useCallback(() => {
    const f = { date: dateHasTime ? nowLocal() : nowDate(), recipient: '', description: '' };
    f[refKey] = '';
    f[inflowKey] = '';
    f[outflowKey] = '';
    return f;
  }, [dateHasTime, refKey, inflowKey, outflowKey]);

  const [form, setForm] = useState(makeForm());

  const load = useCallback(async () => {
    const data = await base44.entities[entityName].list('-date', 500).catch(() => []);
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
  const statementRows = sorted.map((r) => {
    const a = rowToAmounts(r);
    run += a.in - a.out;
    return { id: r.id, date: r.date, recipient: a.recipient, ref: a.ref, description: r.description, in: a.in, out: a.out, running_balance: run };
  });

  // report view — apply filters, recompute running balance over filtered set
  const filtered = statementRows.filter((r) => {
    const rDate = (r.date || '').slice(0, 10);
    if (filterFrom && rDate < filterFrom) return false;
    if (filterTo && rDate > filterTo) return false;
    if (q && !((r.description || '').toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });
  let rb = 0;
  const reportRows = filtered.map((r) => {
    rb += (Number(r.in) || 0) - (Number(r.out) || 0);
    return { ...r, date: fmtDate(r.date), running_balance: rb };
  });

  const display = view === 'report' ? reportRows : statementRows;
  const totalIn = display.reduce((s, r) => s + (Number(r.in) || 0), 0);
  const totalOut = display.reduce((s, r) => s + (Number(r.out) || 0), 0);
  const closingBalance = display.length ? display[display.length - 1].running_balance : 0;

  const dateRangeLabel = (filterFrom || filterTo) ? `${filterFrom || 'start'} → ${filterTo || 'today'}` : 'All dates';

  const addEntry = async (e) => {
    e.preventDefault();
    if (!form.date) return;
    const inAmt = Number(form[inflowKey]) || 0;
    const outAmt = Number(form[outflowKey]) || 0;
    if (!inAmt && !outAmt) return;
    setSaving(true);
    try {
      await base44.entities[entityName].create(buildCreate(form, mode, { inAmt, outAmt }));
      setForm(makeForm());
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
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

      {/* sub-header toggle row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {modeOptions && <Toggle options={modeOptions} value={mode} onChange={setMode} />}
          <Toggle options={[{ value: 'statement', label: 'Statement' }, { value: 'report', label: 'Report' }]} value={view} onChange={setView} />
        </div>

        {/* single panel */}
        <div style={PANEL} className="overflow-hidden">
          {/* summary row */}
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-white/5">
            <StatCell label={summaryLabels.inflow} value={fmt(totalIn)} color="#34d399" icon={ArrowDownLeft} />
            <StatCell label={summaryLabels.outflow} value={fmt(totalOut)} color="#fb7185" icon={ArrowUpRight} />
            <StatCell label={summaryLabels.balance} value={fmt(closingBalance)} color="rgb(var(--panel-accent-rgb))" icon={BalanceIcon} />
          </div>

          <div className="h-px bg-white/5" />

          {/* STATEMENT VIEW — inline add form */}
          {view === 'statement' && (
            <>
              <form onSubmit={addEntry} className="p-5">
                <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" style={{ color: 'rgb(var(--panel-accent-rgb))' }} /> Add Entry
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Date</label>
                    {dateHasTime ? (
                      <input
                        type="datetime-local"
                        value={form.date}
                        onChange={(e) => setField('date', e.target.value)}
                        required
                        className="clay-input w-full"
                        style={{ padding: '10px 14px', fontSize: 13 }}
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
              </form>
              <div className="h-px bg-white/5" />
            </>
          )}

          {/* REPORT VIEW — filters + export */}
          {view === 'report' && (
            <>
              <div className="p-5 flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><CalendarRange className="w-3 h-3" /> From</label>
                  <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="clay-input" style={{ padding: '9px 12px', fontSize: 13 }} />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">To</label>
                  <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="clay-input" style={{ padding: '9px 12px', fontSize: 13 }} />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Search className="w-3 h-3" /> Item</label>
                  <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search description..." className="clay-input w-full" style={{ padding: '9px 12px', fontSize: 13 }} />
                </div>
                <ExportButtons data={reportRows} filename={exportFilename} columns={exportColumns} title={exportTitle} options={{ dateRange: dateRangeLabel }} />
              </div>
              <div className="h-px bg-white/5" />
            </>
          )}

          {/* table */}
          <div className="overflow-x-auto thin-scroll">
            {rows === null ? (
              <div className="p-10"><LoadingSpinner /></div>
            ) : display.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">
                {view === 'report' ? 'No entries match your filters.' : 'No entries yet — add your first transaction above.'}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-semibold px-5 py-3 w-32">Date</th>
                    {hasRecipient && <th className="text-left font-semibold px-5 py-3">Recipient</th>}
                    <th className="text-left font-semibold px-5 py-3 w-24">{refLabel}</th>
                    <th className="text-left font-semibold px-5 py-3">Description</th>
                    <th className="text-right font-semibold px-5 py-3 text-emerald-400 w-40">{inflowLabel}</th>
                    <th className="text-right font-semibold px-5 py-3 text-rose-400 w-40">{outflowLabel}</th>
                    <th className="text-right font-semibold px-5 py-3" style={{ color: 'rgb(var(--panel-accent-rgb))' }}>Running Balance</th>
                    {view === 'statement' && <th className="px-5 py-3 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {display.map((r) => (
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
                          <button onClick={() => remove(r.id)} className="text-white/30 hover:text-rose-400 transition-colors" aria-label="Delete entry">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}