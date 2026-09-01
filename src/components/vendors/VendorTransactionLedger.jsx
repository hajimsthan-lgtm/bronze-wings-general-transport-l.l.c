import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DatePicker from '@/components/common/DatePicker';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ExportButtons from '@/components/common/ExportButtons';
import QuickViewModal from '@/components/drivers/QuickViewModal';
import { Plus, Receipt, CheckCircle2, Clock, AlertCircle, DollarSign, Eye, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  unpaid: { label: 'Unpaid', color: '#ef4444', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  paid: { label: 'Paid', color: '#22c55e', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
  partially_paid: { label: 'Partial', color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' },
};

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </span>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export default function VendorTransactionLedger({ vendorName }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const load = () => {
    setLoading(true);
    base44.entities.VendorTransaction.filter({ vendor_name: vendorName })
      .then((rows) => { setTransactions((rows || []).sort((a, b) => (b.date || '').localeCompare(a.date || ''))); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [vendorName]);

  const stats = useMemo(() => {
    const totalBilled = transactions.reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const totalPaid = transactions.reduce((s, t) => s + (Number(t.paid_amount) || 0), 0);
    const totalOutstanding = totalBilled - totalPaid;
    return { totalBilled, totalPaid, totalOutstanding, count: transactions.length };
  }, [transactions]);

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((t) => t.payment_status === filter);
  }, [transactions, filter]);

  // Running balance: cumulative (amount - paid_amount) in chronological order
  const withBalance = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    let running = 0;
    return sorted.map((t) => {
      running += (Number(t.amount) || 0) - (Number(t.paid_amount) || 0);
      return { ...t, running_balance: running };
    }).reverse();
  }, [filtered]);

  const handleMarkPaid = async (tx, payAmount, payDate, payMethod) => {
    const amount = Number(tx.amount) || 0;
    const paid = Number(payAmount) || 0;
    const totalPaid = (Number(tx.paid_amount) || 0) + paid;
    const status = totalPaid >= amount ? 'paid' : totalPaid > 0 ? 'partially_paid' : 'unpaid';
    await base44.entities.VendorTransaction.update(tx.id, {
      paid_amount: totalPaid,
      payment_status: status,
      paid_date: payDate,
      payment_method: payMethod,
    }).catch(() => {});
    toast({ title: status === 'paid' ? 'Marked as paid' : 'Partial payment recorded' });
    setPayTarget(null);
    load();
  };

  const handleAddManual = async (formData) => {
    await base44.entities.VendorTransaction.create({
      ...formData,
      vendor_name: vendorName,
      source: 'manual',
      paid_amount: 0,
      payment_status: formData.payment_status || 'unpaid',
    }).catch(() => {});
    toast({ title: 'Transaction added' });
    setAddOpen(false);
    load();
  };

  // Build export columns — only include Paid Date if at least one row has a paid_date
  const hasPaidDate = transactions.some(t => t.paid_date);
  const exportColumns = [
    { label: 'Date', key: 'date' },
    { label: 'Trip Ref', key: 'trip_number' },
    { label: 'Notes', key: 'description', transform: (item) => {
        // Strip redundant "Trip TR-XXXX — " prefix, keep only the route/description part
        const desc = item.description || '';
        const stripped = desc.replace(/^Trip\s+[A-Z0-9-]+\s*[—\-]+\s*/i, '').trim();
        return stripped || desc;
      }
    },
    { label: 'Amount (AED)', key: 'amount', numeric: true },
    { label: 'Status', key: 'payment_status' },
    ...(hasPaidDate ? [{ label: 'Paid Date', key: 'paid_date' }] : []),
  ];

  return (
    <div className="space-y-4">
      {/* Summary stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Receipt} label="Total Billed" value={formatCurrency(stats.totalBilled)} accent="#3b82f6" />
        <StatCard icon={CheckCircle2} label="Total Paid" value={formatCurrency(stats.totalPaid)} accent="#22c55e" />
        <StatCard icon={AlertCircle} label="Outstanding" value={formatCurrency(stats.totalOutstanding)} accent="#ef4444" />
        <StatCard icon={Clock} label="Total Records" value={String(stats.count)} accent="#f59e0b" />
      </div>

      {/* Toolbar: filter + add + quick view + export */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
          {['all', 'unpaid', 'partially_paid', 'paid'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('inline-flex items-center h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors',
                filter === f ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
              {f === 'all' ? 'All' : f === 'partially_paid' ? 'Partial' : STATUS_CONFIG[f]?.label || f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setQuickViewOpen(true)} className="border-border gap-1.5 h-8">
            <Eye className="w-3.5 h-3.5" /> Quick View
          </Button>
          <ExportButtons data={withBalance} filename={`vendor-${vendorName}-transactions`} title={`${vendorName} — Transactions`} columns={exportColumns} />
          <Button size="sm" onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/90 gap-1.5 h-8">
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>
      </div>

      {/* Transaction table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Trip Ref</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Paid Date</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Balance</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
              ) : withBalance.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No transactions found</td></tr>
              ) : withBalance.map((tx) => {
                const cfg = STATUS_CONFIG[tx.payment_status] || STATUS_CONFIG.unpaid;
                return (
                  <tr key={tx.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-4 py-2.5">
                      {tx.trip_id ? (
                        <button onClick={() => navigate(`/trips`)} className="text-primary hover:text-primary-light text-xs font-mono">
                          {tx.trip_number || '—'}
                        </button>
                      ) : <span className="text-muted-foreground/40 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-foreground truncate max-w-[200px]" title={tx.description}>{tx.description || '—'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-foreground tabular-nums">{formatCurrency(Number(tx.amount) || 0)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider border', cfg.bg, cfg.border, cfg.text)}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted-foreground whitespace-nowrap">{tx.paid_date ? formatDate(tx.paid_date) : '—'}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums" style={{ color: tx.running_balance > 0 ? '#ef4444' : '#22c55e' }}>
                      {formatCurrency(tx.running_balance)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {tx.payment_status !== 'paid' && (
                        <button onClick={() => setPayTarget(tx)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                          <Check className="w-3 h-3" /> Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add manual transaction sheet */}
      <AddTransactionSheet open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAddManual} />

      {/* Mark as paid modal */}
      {payTarget && <PayModal tx={payTarget} onClose={() => setPayTarget(null)} onConfirm={handleMarkPaid} />}

      {/* Quick View modal */}
      <QuickViewModal
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        title={`${vendorName} — Transaction Ledger`}
        data={withBalance}
        columns={exportColumns}
        dateField="date"
      />
    </div>
  );
}

function AddTransactionSheet({ open, onOpenChange, onSubmit }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ description: '', amount: '', date: today, due_date: '', payment_status: 'unpaid', notes: '', payment_method: 'cash' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ description: '', amount: '', date: today, due_date: '', payment_status: 'unpaid', notes: '', payment_method: 'cash' });
  }, [open]);

  const handle = async () => {
    setSaving(true);
    await onSubmit({ ...form, amount: Number(form.amount) || 0 });
    setSaving(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">Add Vendor Transaction</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div><Label className="text-xs text-muted-foreground mb-1.5">Description</Label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Lump-sum settlement, adjustment, etc." className="bg-background border-border" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground mb-1.5">Amount (AED)</Label><Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="bg-background border-border" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">Date</Label><DatePicker value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} className="bg-background border-border" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground mb-1.5">Payment Status</Label>
              <Select value={form.payment_status} onValueChange={(v) => setForm((f) => ({ ...f, payment_status: v }))}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="unpaid">Unpaid</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="partially_paid">Partially Paid</SelectItem>
              </SelectContent></Select>
            </div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">Due Date</Label><DatePicker value={form.due_date} onChange={(v) => setForm((f) => ({ ...f, due_date: v }))} className="bg-background border-border" /></div>
          </div>
          <div><Label className="text-xs text-muted-foreground mb-1.5">Notes</Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="bg-background border-border" /></div>
          <div className="flex gap-3 mt-6"><Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-border">Cancel</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? 'Saving...' : 'Save'}</Button></div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function PayModal({ tx, onClose, onConfirm }) {
  const today = new Date().toISOString().split('T')[0];
  const [amount, setAmount] = useState(String(tx.amount || ''));
  const [date, setDate] = useState(today);
  const [method, setMethod] = useState('cash');

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader><DialogTitle className="font-display text-foreground">Record Payment</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="glass-card p-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Transaction</span><span className="text-foreground font-medium truncate ml-2">{tx.description || '—'}</span></div>
            <div className="flex justify-between mt-1"><span className="text-muted-foreground">Amount</span><span className="text-foreground font-semibold tabular-nums">{formatCurrency(Number(tx.amount) || 0)}</span></div>
            {Number(tx.paid_amount) > 0 && <div className="flex justify-between mt-1"><span className="text-muted-foreground">Already Paid</span><span className="text-emerald-400 font-semibold tabular-nums">{formatCurrency(Number(tx.paid_amount))}</span></div>}
          </div>
          <div><Label className="text-xs text-muted-foreground mb-1.5">Payment Amount (AED)</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-background border-border" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground mb-1.5">Payment Date</Label><DatePicker value={date} onChange={(v) => setDate(v)} className="bg-background border-border" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">Method</Label>
              <Select value={method} onValueChange={setMethod}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="cash">Cash</SelectItem><SelectItem value="bank_transfer">Bank Transfer</SelectItem><SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent></Select>
            </div>
          </div>
          <div className="flex gap-3 pt-2"><Button variant="outline" onClick={onClose} className="flex-1 border-border">Cancel</Button><Button onClick={() => onConfirm(tx, amount, date, method)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-1.5"><Check className="w-4 h-4" /> Confirm</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}