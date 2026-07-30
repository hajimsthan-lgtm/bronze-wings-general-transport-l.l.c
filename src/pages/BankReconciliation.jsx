import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Landmark, Plus, Trash2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const CARD = {
  background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.80) 0%, rgba(var(--surf-2-rgb),0.92) 100%)',
  backdropFilter: 'blur(28px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.3)',
  border: '1px solid rgba(var(--panel-accent-rgb),0.12)',
  borderRadius: 20,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 16px 44px -14px rgba(0,0,0,0.6)',
};

const fmt = (n) => new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);

export default function BankReconciliation() {
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), deposit: '', withdrawal: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await base44.entities.BankReconciliation.list('-date', 500).catch(() => []);
    setRows(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  // compute running balance: sort by date asc, then created_date asc
  const sorted = (rows || []).slice().sort((a, b) => {
    const d = (a.date || '').localeCompare(b.date || '');
    if (d !== 0) return d;
    return (a.created_date || '').localeCompare(b.created_date || '');
  });
  let running = 0;
  const withBalance = sorted.map((r) => {
    running += (Number(r.deposit) || 0) - (Number(r.withdrawal) || 0);
    return { ...r, running_balance: running };
  });

  const totalDeposit = withBalance.reduce((s, r) => s + (Number(r.deposit) || 0), 0);
  const totalWithdrawal = withBalance.reduce((s, r) => s + (Number(r.withdrawal) || 0), 0);
  const closingBalance = running;

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
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* header */}
        <div className="flex items-center gap-3">
          <div className="hud-icon-tile w-12 h-12">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Bank Reconciliation Statement</h1>
            <p className="text-sm text-muted-foreground">Record deposits and withdrawals — running balance is calculated automatically.</p>
          </div>
        </div>

        {/* summary tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div style={CARD} className="p-5">
            <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-wider font-semibold mb-1"><ArrowDownLeft className="w-4 h-4" /> Total Deposits</div>
            <div className="text-2xl font-bold text-white tabular-nums">{fmt(totalDeposit)}</div>
          </div>
          <div style={CARD} className="p-5">
            <div className="flex items-center gap-2 text-rose-400 text-xs uppercase tracking-wider font-semibold mb-1"><ArrowUpRight className="w-4 h-4" /> Total Withdrawals</div>
            <div className="text-2xl font-bold text-white tabular-nums">{fmt(totalWithdrawal)}</div>
          </div>
          <div style={CARD} className="p-5">
            <div className="flex items-center gap-2 text-[rgb(var(--panel-accent-rgb))] text-xs uppercase tracking-wider font-semibold mb-1"><Landmark className="w-4 h-4" /> Closing Balance</div>
            <div className="text-2xl font-bold text-white tabular-nums">{fmt(closingBalance)}</div>
          </div>
        </div>

        {/* add entry form */}
        <form onSubmit={addEntry} style={CARD} className="p-5">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-[rgb(var(--panel-accent-rgb))]" /> Add Entry</h2>
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

        {/* table */}
        <div style={CARD} className="overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-base font-semibold text-white">Statement</h2>
          </div>
          {rows === null ? (
            <div className="p-10"><LoadingSpinner /></div>
          ) : withBalance.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">No entries yet — add your first transaction above.</div>
          ) : (
            <div className="overflow-x-auto thin-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-semibold px-5 py-3">Date</th>
                    <th className="text-left font-semibold px-5 py-3">Description</th>
                    <th className="text-right font-semibold px-5 py-3 text-emerald-400">Deposit</th>
                    <th className="text-right font-semibold px-5 py-3 text-rose-400">Withdrawal</th>
                    <th className="text-right font-semibold px-5 py-3 text-[rgb(var(--panel-accent-rgb))]">Running Balance</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {withBalance.map((r) => (
                    <tr key={r.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3 text-white/90 whitespace-nowrap tabular-nums">{r.date}</td>
                      <td className="px-5 py-3 text-white/80">{r.description || '—'}</td>
                      <td className="px-5 py-3 text-right text-emerald-400 tabular-nums">{r.deposit ? fmt(r.deposit) : '—'}</td>
                      <td className="px-5 py-3 text-right text-rose-400 tabular-nums">{r.withdrawal ? fmt(r.withdrawal) : '—'}</td>
                      <td className="px-5 py-3 text-right font-semibold text-white tabular-nums">{fmt(r.running_balance)}</td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => remove(r.id)} className="text-white/30 hover:text-rose-400 transition-colors" aria-label="Delete entry">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}