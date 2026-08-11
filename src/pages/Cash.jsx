import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Wallet, Plus, Trash2, ArrowDownLeft, ArrowUpRight, Search, CalendarRange } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ExportButtons from '@/components/common/ExportButtons';
import { useGlobalDate } from '@/lib/GlobalDateContext';

const PANEL = {
  background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.80) 0%, rgba(var(--surf-2-rgb),0.92) 100%)',
  backdropFilter: 'blur(28px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.3)',
  border: '1px solid rgba(var(--panel-accent-rgb),0.12)',
  borderRadius: 22,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 16px 44px -14px rgba(0,0,0,0.1)',
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

const nowLocal = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const EXPORT_COLS = [
  { key: 'date', label: 'Date' },
  { key: 'recipient', label: 'Recipient' },
  { key: 'receipt_number', label: 'Receipt #' },
  { key: 'description', label: 'Description' },
  { key: 'inflow', label: 'Inflow', numeric: true },
  { key: 'outflow', label: 'Outflow', numeric: true },
  { key: 'running_balance', label: 'Running Balance', numeric: true },
];

function StatCell({ label, value, color, icon }) {
  return (
    <div className="flex flex-col justify-center px-5 py-3 flex-1 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold mb-0.5" style={{ color }}>
        {icon}{label}
      </div>
      <div className="text-xl font-bold text-white tabular-nums truncate">{value}</div>
    </div>
  );
}

export default function Cash() {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState({
    date: nowLocal(),
    recipient: '',
    receipt_number: '',
    description: '',
    inflow: '',
    outflow: '',
  });
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('statement');
  const { dateFrom: filterFrom, dateTo: filterTo, setDateFrom: setFilterFrom, setDateTo: setFilterTo } = useGlobalDate();
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const data = await base44.entities.CashTransaction.list('-date', 500).catch(() => []);
    setRows(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  // sorted ascending by date then created_date for running balance
  const sorted = (rows || []).slice().sort((a, b) => {
    const d = (a.date || '').localeCompare(b.date || '');
    if (d !== 0) return d;
    return (a.created_date || '').localeCompare(b.created_date || '');
  });

  // map to statement rows: inflow → inflow column, outflow → outflow column
  let run = 0;
  const statementRows = sorted.map((r) => {
    const inflow = r.type === 'inflow' ? (Number(r.amount) || 0) : 0;
    const outflow = r.type === 'outflow' ? (Number(r.amount) || 0) : 0;
    run += inflow - outflow;
    return { ...r, inflow, outflow, running_balance: run };
  });

  // report view: apply filters then recompute running balance
  const filtered = statementRows.filter((r) => {
    const rDate = (r.date || '').slice(0, 10);
    if (filterFrom && rDate < filterFrom) return false;
    if (filterTo && rDate > filterTo) return false;
    if (q && !((r.description || '').toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });
  let rb = 0;
  const reportRows = filtered.map((r) => {
    rb += (Number(r.inflow) || 0) - (Number(r.outflow) || 0);
    return { ...r, date: fmtDate(r.date), recipient: r.type === 'inflow' ? (r.received_from || '') : (r.paid_to || ''), running_balance: rb };
  });

  const display = view === 'report' ? reportRows : statementRows;
  const totalInflow = display.reduce((s, r) => s + (Number(r.inflow) || 0), 0);
  const totalOutflow = display.reduce((s, r) => s + (Number(r.outflow) || 0), 0);
  const closingBalance = display.length ? display[display.length - 1].running_balance : 0;

  const dateRangeLabel = (filterFrom || filterTo)
    ? `${filterFrom || 'start'} → ${filterTo || 'today'}`
    : 'All dates';

  const addEntry = async (e) => {
    e.preventDefault();
    if (!form.date) return;
    const inflow = Number(form.inflow) || 0;
    const outflow = Number(form.outflow) || 0;
    if (!inflow && !outflow) return;
    const isOutflow = outflow > 0;
    setSaving(true);
    try {
      await base44.entities.CashTransaction.create({
        date: form.date,
        type: isOutflow ? 'outflow' : 'inflow',
        amount: isOutflow ? outflow : inflow,
        description: form.description || '',
        receipt_number: form.receipt_number || '',
        received_from: !isOutflow ? form.recipient : '',
        paid_to: isOutflow ? form.recipient : '',
      });
      setForm({ date: nowLocal(), recipient: '', receipt_number: '', description: '', inflow: '', outflow: '' });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await base44.entities.CashTransaction.delete(id);
    await load();
  };

  return (
    <div className="professional-page-bg min-h-screen pb-28 md:pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* header + toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="hud-icon-tile w-12 h-12">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Petty Cash Statement</h1>
              <p className="text-sm text-muted-foreground">Record cash inflows & outflows — running balance is calculated automatically.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10">
            <button onClick={() => setView('statement')} className={`sub-tab ${view === 'statement' ? 'sub-tab-active' : ''}`}>Statement</button>
            <button onClick={() => setView('report')} className={`sub-tab ${view === 'report' ? 'sub-tab-active' : ''}`}>Report</button>
          </div>
        </div>

        {/* single panel for all content */}
        <div style={PANEL} className="overflow-hidden">
          {/* summary row */}
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-white/5">
            <StatCell label="Total Inflows" value={fmt(totalInflow)} color="#34d399" icon={<ArrowDownLeft className="w-3.5 h-3.5" />} />
            <StatCell label="Total Outflows" value={fmt(totalOutflow)} color="#fb7185" icon={<ArrowUpRight className="w-3.5 h-3.5" />} />
            <StatCell label="Closing Balance" value={fmt(closingBalance)} color="rgb(var(--panel-accent-rgb))" icon={<Wallet className="w-3.5 h-3.5" />} />
          </div>

          <div className="h-px bg-white/5" />

          {/* STATEMENT VIEW — inline add form */}
          {view === 'statement' && (
            <>
              <form onSubmit={addEntry} className="p-5">
                <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-[rgb(var(--panel-accent-rgb))]" /> Add Entry</h2>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Date</label>
                    <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Recipient</label>
                    <input type="text" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder="Paid to / Received from" className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Receipt #</label>
                    <input type="text" value={form.receipt_number} onChange={(e) => setForm({ ...form, receipt_number: e.target.value })} placeholder="Receipt number" className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Description</label>
                    <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Transaction description" className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[11px] uppercase tracking-wider text-emerald-400 mb-1">Inflow</label>
                    <input type="number" step="0.01" min="0" value={form.inflow} onChange={(e) => setForm({ ...form, inflow: e.target.value })} placeholder="0.00" className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[11px] uppercase tracking-wider text-rose-400 mb-1">Outflow</label>
                    <input type="number" step="0.01" min="0" value={form.outflow} onChange={(e) => setForm({ ...form, outflow: e.target.value })} placeholder="0.00" className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
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
                <ExportButtons data={reportRows} filename="petty-cash" columns={EXPORT_COLS} title="Petty Cash Statement" options={{ dateRange: dateRangeLabel }} />
              </div>
              <div className="h-px bg-white/5" />
            </>
          )}

          {/* table */}
          <div className="overflow-x-auto thin-scroll">
            {rows === null ? (
              <div className="p-10"><LoadingSpinner /></div>
            ) : display.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-sm">{view === 'report' ? 'No entries match your filters.' : 'No entries yet — add your first transaction above.'}</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-semibold px-5 py-3 w-32">Date</th>
                    <th className="text-left font-semibold px-5 py-3">Recipient</th>
                    <th className="text-left font-semibold px-5 py-3 w-20">Receipt #</th>
                    <th className="text-left font-semibold px-5 py-3">Description</th>
                    <th className="text-right font-semibold px-5 py-3 text-emerald-400 w-44">Inflow</th>
                    <th className="text-right font-semibold px-5 py-3 text-rose-400 w-44">Outflow</th>
                    <th className="text-right font-semibold px-5 py-3 text-[rgb(var(--panel-accent-rgb))]">Running Balance</th>
                    {view === 'statement' && <th className="px-5 py-3 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {display.map((r) => (
                    <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-white/90 whitespace-nowrap tabular-nums text-xs">{fmtDate(r.date)}</td>
                      <td className="px-5 py-3 text-white/80">{r.type === 'inflow' ? (r.received_from || '—') : (r.paid_to || '—')}</td>
                      <td className="px-5 py-3 text-white/60 font-mono text-xs whitespace-nowrap">{r.receipt_number || '—'}</td>
                      <td className="px-5 py-3 text-white/80">{r.description || '—'}</td>
                      <td className="px-5 py-3 text-right text-emerald-400 tabular-nums text-base font-semibold">{r.inflow ? fmt(r.inflow) : '—'}</td>
                      <td className="px-5 py-3 text-right text-rose-400 tabular-nums text-base font-semibold">{r.outflow ? fmt(r.outflow) : '—'}</td>
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