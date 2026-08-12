import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Landmark, Plus, Trash2, ArrowDownLeft, ArrowUpRight, Search, CalendarRange } from 'lucide-react';
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

const EXPORT_COLS = [
  { key: 'date', label: 'Date' },
  { key: 'description', label: 'Description' },
  { key: 'deposit', label: 'Deposit', numeric: true },
  { key: 'withdrawal', label: 'Withdrawal', numeric: true },
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

export default function BankReconciliation() {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), deposit: '', withdrawal: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('statement');
  const { dateFrom: filterFrom, dateTo: filterTo, setDateFrom: setFilterFrom, setDateTo: setFilterTo } = useGlobalDate();
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const data = await base44.entities.BankReconciliation.list('-date', 500).catch(() => []);
    setRows(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  // sorted ascending by date then created_date for running balance
  const sorted = (rows || []).slice().sort((a, b) => {
    const d = (a.date || '').localeCompare(b.date || '');
    if (d !== 0) return d;
    return (a.created_date || '').localeCompare(b.created_date || '');
  });

  // full running balance (statement view)
  let run = 0;
  const statementRows = sorted.map((r) => {
    run += (Number(r.deposit) || 0) - (Number(r.withdrawal) || 0);
    return { ...r, running_balance: run };
  });

  // report view: apply filters then recompute running balance over the filtered set
  const filtered = statementRows.filter((r) => {
    if (filterFrom && (r.date || '') < filterFrom) return false;
    if (filterTo && (r.date || '') > filterTo) return false;
    if (q && !((r.description || '').toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });
  let rb = 0;
  const reportRows = filtered.map((r) => {
    rb += (Number(r.deposit) || 0) - (Number(r.withdrawal) || 0);
    return { ...r, running_balance: rb };
  });

  const display = view === 'report' ? reportRows : statementRows;
  const totalDeposit = display.reduce((s, r) => s + (Number(r.deposit) || 0), 0);
  const totalWithdrawal = display.reduce((s, r) => s + (Number(r.withdrawal) || 0), 0);
  const closingBalance = display.length ? display[display.length - 1].running_balance : 0;

  const dateRangeLabel = (filterFrom || filterTo)
    ? `${filterFrom || 'start'} → ${filterTo || 'today'}`
    : 'All dates';

  const addEntry = async (e) => {
    e.preventDefault();
    if (!form.date) return;
    setSaving(true);
    try {
      await base44.entities.BankReconciliation.create({
        date: form.date,
        deposit: Number(form.deposit) || 0,
        withdrawal: Number(form.withdrawal) || 0,
        description: form.description || '',
      });
      setForm({ date: new Date().toISOString().slice(0, 10), deposit: '', withdrawal: '', description: '' });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    await base44.entities.BankReconciliation.delete(id);
    await load();
  };

  return (
    <div className="professional-page-bg min-h-screen pb-28 md:pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* header + toggle */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10">
            <button onClick={() => setView('statement')} className={`sub-tab ${view === 'statement' ? 'sub-tab-active' : ''}`}>Statement</button>
            <button onClick={() => setView('report')} className={`sub-tab ${view === 'report' ? 'sub-tab-active' : ''}`}>Report</button>
          </div>
        </div>

        {/* single panel for all content */}
        <div style={PANEL} className="overflow-hidden">
          {/* summary row */}
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-white/5">
            <StatCell label="Total Deposits" value={fmt(totalDeposit)} color="#34d399" icon={<ArrowDownLeft className="w-3.5 h-3.5" />} />
            <StatCell label="Total Withdrawals" value={fmt(totalWithdrawal)} color="#fb7185" icon={<ArrowUpRight className="w-3.5 h-3.5" />} />
            <StatCell label="Closing Balance" value={fmt(closingBalance)} color="rgb(var(--panel-accent-rgb))" icon={<Landmark className="w-3.5 h-3.5" />} />
          </div>

          <div className="h-px bg-white/5" />

          {/* STATEMENT VIEW */}
          {view === 'statement' && (
            <>
              <form onSubmit={addEntry} className="p-5">
                <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-[rgb(var(--panel-accent-rgb))]" /> Add Entry</h2>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Date</label>
                    <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Description</label>
                    <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Transaction description" className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-emerald-400 mb-1">Deposit</label>
                    <input type="number" step="0.01" min="0" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} placeholder="0.00" className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-rose-400 mb-1">Withdrawal</label>
                    <input type="number" step="0.01" min="0" value={form.withdrawal} onChange={(e) => setForm({ ...form, withdrawal: e.target.value })} placeholder="0.00" className="clay-input w-full" style={{ padding: '10px 14px', fontSize: 13 }} />
                  </div>
                  <div className="md:col-span-3">
                    <button type="submit" disabled={saving} className="clay-btn w-full flex items-center justify-center gap-2" style={{ padding: '11px 20px' }}>
                      <Plus className="w-4 h-4" /> {saving ? 'Saving...' : 'Add Entry'}
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
                <ExportButtons data={reportRows} filename="bank-reconciliation" columns={EXPORT_COLS} title="Bank Reconciliation Statement" options={{ dateRange: dateRangeLabel }} />
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
                    <th className="text-left font-semibold px-5 py-3">Date</th>
                    <th className="text-left font-semibold px-5 py-3">Description</th>
                    <th className="text-right font-semibold px-5 py-3 text-emerald-400">Deposit</th>
                    <th className="text-right font-semibold px-5 py-3 text-rose-400">Withdrawal</th>
                    <th className="text-right font-semibold px-5 py-3 text-[rgb(var(--panel-accent-rgb))]">Running Balance</th>
                    {view === 'statement' && <th className="px-5 py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {display.map((r) => (
                    <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-white/90 whitespace-nowrap tabular-nums">{r.date}</td>
                      <td className="px-5 py-3 text-white/80">{r.description || '—'}</td>
                      <td className="px-5 py-3 text-right text-emerald-400 tabular-nums">{r.deposit ? fmt(r.deposit) : '—'}</td>
                      <td className="px-5 py-3 text-right text-rose-400 tabular-nums">{r.withdrawal ? fmt(r.withdrawal) : '—'}</td>
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