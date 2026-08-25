import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, Link2, User, Fuel, Wrench, Truck, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CollapsibleSection from '@/components/common/CollapsibleSection';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/formatters';

const PETTY_COLOR = '#f59e0b'; // amber — distinct from cash (green) and card (blue)

const CATEGORY_ICONS = {
  fuel: Fuel,
  maintenance: Wrench,
  trip_fare: Truck,
  other: MoreHorizontal,
};

const fmt = (n) => new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);

export default function DriverPettyCashSection({ driver }) {
  const { toast } = useToast();
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpForm, setTopUpForm] = useState({ amount: '', date: new Date().toISOString().slice(0, 10), note: '' });
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.CashTransaction.list('-date', 5000).catch(() => []);
      const driverRows = (all || []).filter((r) => r.driver_id === driver.id);
      setRows(driverRows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [driver.id]);

  const sorted = useMemo(() => {
    return (rows || []).slice().sort((a, b) => {
      const d = (a.date || '').localeCompare(b.date || '');
      if (d !== 0) return d;
      return (a.created_date || '').localeCompare(b.created_date || '');
    });
  }, [rows]);

  const totalIn = sorted.filter((r) => r.type === 'inflow').reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalOut = sorted.filter((r) => r.type === 'outflow').reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const balance = totalIn - totalOut;

  // running balance per driver
  let run = 0;
  const historyRows = sorted.map((r) => {
    run += (r.type === 'inflow' ? 1 : -1) * (Number(r.amount) || 0);
    return { ...r, running_balance: run };
  }).reverse();

  const isAdmin = user?.role === 'admin';

  const submitTopUp = async (e) => {
    e.preventDefault();
    const amt = Number(topUpForm.amount) || 0;
    if (amt <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await base44.entities.CashTransaction.create({
        date: topUpForm.date,
        type: 'inflow',
        amount: amt,
        description: topUpForm.note || 'Petty Cash Top-Up',
        category: 'top_up',
        received_from: driver.name,
        paid_to: '',
        recipient_type: 'driver',
        driver_id: driver.id,
        receipt_number: '',
      });
      setTopUpForm({ amount: '', date: new Date().toISOString().slice(0, 10), note: '' });
      setTopUpOpen(false);
      await load();
      toast({ title: 'Top-up added' });
    } catch {
      toast({ title: 'Failed to add top-up', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <CollapsibleSection
      title="Petty Cash"
      icon={Wallet}
      accent={PETTY_COLOR}
      count={sorted.length}
      actions={
        isAdmin && (
          <button
            onClick={() => setTopUpOpen(true)}
            className="text-muted-foreground hover:text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
            title="Top-up petty cash"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )
      }
    >
      {/* Balance card */}
      <div
        className="rounded-xl p-4 mb-3 flex items-center gap-4"
        style={{
          background: `linear-gradient(135deg, ${PETTY_COLOR}22 0%, ${PETTY_COLOR}08 100%)`,
          border: `1px solid ${PETTY_COLOR}40`,
        }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${PETTY_COLOR}1a`, border: `1px solid ${PETTY_COLOR}40` }}
        >
          <Wallet className="w-5 h-5" style={{ color: PETTY_COLOR }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Current Petty Cash Balance</p>
          <p className="text-2xl font-bold tabular-nums text-foreground">{formatCurrency(balance)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            <span className="text-emerald-400">+{fmt(totalIn)}</span> top-ups ·
            <span className="text-rose-400"> −{fmt(totalOut)}</span> expenses
          </p>
        </div>
      </div>

      {/* Transaction history */}
      {loading ? (
        <LoadingSpinner />
      ) : historyRows.length === 0 ? (
        <EmptyState icon={Wallet} title="No petty cash transactions" description="Top-up this driver to start tracking." />
      ) : (
        <div className="space-y-2 max-h-[440px] overflow-y-auto thin-scroll pr-1">
          {historyRows.map((rec) => {
            const isIn = rec.type === 'inflow';
            const CatIcon = CATEGORY_ICONS[rec.category] || MoreHorizontal;
            return (
              <div key={rec.id} className="row-card flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0"
                  style={{ boxShadow: `0 0 18px -6px ${isIn ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.35)'}` }}
                >
                  {isIn ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> : <ArrowUpRight className="w-4 h-4 text-rose-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {isIn ? 'Top-Up' : (rec.description || rec.category || 'Expense')}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    <span>{formatDate(rec.date)}</span>
                    {rec.category && <span className="capitalize">· {rec.category.replace(/_/g, ' ')}</span>}
                    {rec.linked_trip_number && <span className="flex items-center gap-0.5">· <Truck className="w-3 h-3" /> {rec.linked_trip_number}</span>}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-semibold tabular-nums whitespace-nowrap ${isIn ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isIn ? '+' : '−'}{fmt(rec.amount)}
                  </p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">{fmt(rec.running_balance)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top-up sheet */}
      <Sheet open={topUpOpen} onOpenChange={setTopUpOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-display text-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" style={{ color: PETTY_COLOR }} />
              Petty Cash Top-Up
            </SheetTitle>
            <p className="text-xs text-muted-foreground">{driver.name}</p>
          </SheetHeader>
          <form onSubmit={submitTopUp} className="space-y-4 px-1">
            <div>
              <Label className="mb-1.5 block">Amount (AED)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={topUpForm.amount}
                onChange={(e) => setTopUpForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                required
                autoFocus
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Date</Label>
              <Input
                type="date"
                value={topUpForm.date}
                onChange={(e) => setTopUpForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Note</Label>
              <Input
                type="text"
                value={topUpForm.note}
                onChange={(e) => setTopUpForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Optional note"
              />
            </div>
            <SheetFooter className="pt-4">
              <Button type="submit" disabled={saving} className="w-full" style={{ background: PETTY_COLOR, borderColor: PETTY_COLOR }}>
                {saving ? 'Saving...' : 'Add Top-Up'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </CollapsibleSection>
  );
}