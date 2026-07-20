import { useState, useEffect, useMemo, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Check, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useClientPaymentCreate, useClientPaymentUpdate } from '@/hooks/useEntityQueries';
import InvoiceAllocationList from './InvoiceAllocationList';

const DEFAULT_FORM = {
  reference_number: '',
  client_name: '',
  amount: 0,
  payment_date: new Date().toISOString().split('T')[0],
  payment_mode: 'cash',
  notes: '',
};

export default function PaymentFormSheet({ open, onOpenChange, editItem }) {
  const createPayment = useClientPaymentCreate();
  const updatePayment = useClientPaymentUpdate();
  const [saving, setSaving] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [clients, setClients] = useState([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState([]);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    if (open) {
      setForm(editItem ? { ...DEFAULT_FORM, ...editItem } : { ...DEFAULT_FORM });
      setAllocations(editItem?.allocated_invoices || []);
      setOutstandingInvoices([]);
      base44.entities.Client.list('-created_date', 200).catch(() => []).then(setClients);
      if (!editItem) {
        base44.entities.ClientPayment.list('-created_date', 200).then(existing => {
          const d = new Date();
          const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
          const prefix = `PAY-${ymd}-`;
          let maxSeq = 0;
          (existing || []).forEach(p => {
            if (p.reference_number?.startsWith(prefix)) {
              const seq = parseInt(p.reference_number.slice(prefix.length), 10);
              if (seq > maxSeq) maxSeq = seq;
            }
          });
          setForm(prev => ({ ...prev, reference_number: `${prefix}${String(maxSeq + 1).padStart(4, '0')}` }));
        }).catch(() => {});
      }
    }
  }, [open, editItem]);

  // Fetch outstanding invoices when client is selected (new payments only)
  useEffect(() => {
    if (form.client_name && !editItem) {
      setLoadingInvoices(true);
      base44.entities.Invoice.filter({ client_name: form.client_name })
        .then(all => {
          const outstanding = (all || [])
            .filter(inv => ['sent', 'partially_paid', 'overdue'].includes(inv.status))
            .sort((a, b) => (a.issue_date || '').localeCompare(b.issue_date || ''));
          setOutstandingInvoices(outstanding);
        })
        .catch(() => setOutstandingInvoices([]))
        .finally(() => setLoadingInvoices(false));
    } else {
      setOutstandingInvoices([]);
    }
  }, [form.client_name, editItem]);

  // Bulk allocation engine: sequentially deduct from payment amount, oldest invoice first
  const computeAllocations = useCallback((paymentAmount, invoices, selectedIndices = null) => {
    let remaining = Number(paymentAmount) || 0;
    return invoices.map((inv, idx) => {
      const isSelected = selectedIndices ? selectedIndices.includes(idx) : true;
      if (!isSelected || remaining <= 0) {
        return {
          invoice_id: inv.id,
          invoice_number: inv.invoice_number,
          invoice_total: Number(inv.total_amount) || 0,
          already_paid: Number(inv.paid_amount) || 0,
          allocated_amount: 0,
          is_selected: isSelected,
        };
      }
      const balance = Math.max(0, (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0));
      const allocation = Math.min(remaining, balance);
      remaining -= allocation;
      return {
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        invoice_total: Number(inv.total_amount) || 0,
        already_paid: Number(inv.paid_amount) || 0,
        allocated_amount: allocation,
        is_selected: true,
      };
    });
  }, []);

  // Auto-allocate when amount or invoices change
  useEffect(() => {
    if (outstandingInvoices.length > 0 && !editItem) {
      setAllocations(computeAllocations(form.amount, outstandingInvoices));
    }
  }, [form.amount, outstandingInvoices, editItem, computeAllocations]);

  const totalAllocated = useMemo(() =>
    allocations.filter(a => a.is_selected).reduce((s, a) => s + (a.allocated_amount || 0), 0), [allocations]);

  const unappliedBalance = useMemo(() =>
    (Number(form.amount) || 0) - totalAllocated, [form.amount, totalAllocated]);

  const totalSelectedBalances = useMemo(() =>
    allocations.filter(a => a.is_selected).reduce((s, a) => {
      const balance = Math.max(0, (a.invoice_total || 0) - (a.already_paid || 0));
      return s + balance;
    }, 0), [allocations]);

  const displayUnapplied = (Number(form.amount) || 0) - totalSelectedBalances;

  // Manual override: toggle invoice selection, recompute allocations for remaining selected invoices
  const toggleInvoice = (idx) => {
    const currentSelected = allocations
      .map((a, i) => ({ a, i }))
      .filter(({ a, i }) => a.is_selected)
      .map(({ i }) => i);
    const newSelected = currentSelected.includes(idx)
      ? currentSelected.filter(i => i !== idx)
      : [...currentSelected, idx];
    setAllocations(computeAllocations(form.amount, outstandingInvoices, newSelected));
  };

  const handleSelectAll = (indices) => {
    setAllocations(computeAllocations(form.amount, outstandingInvoices, indices));
  };

  const handleDeselectAll = (indices) => {
    const currentSelected = allocations
      .map((a, i) => ({ a, i }))
      .filter(({ a }) => a.is_selected)
      .map(({ i }) => i);
    const newSelected = currentSelected.filter(i => !indices.includes(i));
    setAllocations(computeAllocations(form.amount, outstandingInvoices, newSelected));
  };

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const selectedAllocations = allocations.filter(a => a.is_selected && a.allocated_amount > 0);
      const paymentData = {
        ...form,
        amount: Number(form.amount) || 0,
        allocated_invoices: selectedAllocations.map(a => ({
          invoice_id: a.invoice_id,
          invoice_number: a.invoice_number,
          invoice_total: a.invoice_total,
          allocated_amount: a.allocated_amount,
          is_selected: true,
        })),
        unapplied_balance: unappliedBalance,
        status: 'completed',
      };

      if (editItem) {
        await updatePayment.mutateAsync({ id: editItem.id, data: paymentData });
      } else {
        await createPayment.mutateAsync(paymentData);
      }

      // Update each affected invoice: set paid_amount + status (paid / partially_paid)
      await Promise.all(selectedAllocations.map(async (alloc) => {
        const inv = outstandingInvoices.find(i => i.id === alloc.invoice_id);
        const newPaidAmount = (Number(inv?.paid_amount) || 0) + alloc.allocated_amount;
        const newStatus = newPaidAmount >= alloc.invoice_total ? 'paid' : 'partially_paid';
        await base44.entities.Invoice.update(alloc.invoice_id, {
          paid_amount: newPaidAmount,
          status: newStatus,
        });
      }));

      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const canSave = form.client_name && Number(form.amount) > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-l border-border p-0 w-full sm:max-w-[520px] flex flex-col" side="right">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 pt-6 pb-4 z-10">
          <div className="flex items-center justify-between mb-2">
            <div>
              <SheetTitle className="text-base font-semibold text-foreground">Client Payment</SheetTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{form.reference_number}</p>
            </div>
            <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Client</Label>
            <Select value={form.client_name} onValueChange={v => update('client_name', v)} disabled={!!editItem}>
              <SelectTrigger className="bg-background border-border mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {clients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Payment Amount</Label>
              <Input type="number" value={form.amount} onChange={e => update('amount', e.target.value)} className="bg-background border-border mt-1" placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Payment Date</Label>
              <Input type="date" value={form.payment_date} onChange={e => update('payment_date', e.target.value)} className="bg-background border-border mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Payment Mode</Label>
            <Select value={form.payment_mode} onValueChange={v => update('payment_mode', v)}>
              <SelectTrigger className="bg-background border-border mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Notes</Label>
            <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="bg-background border-border mt-1 resize-none" rows={2} placeholder="Payment notes..." />
          </div>

          {/* Invoice Allocation Engine */}
          {form.client_name && !editItem && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Invoice Allocation — FIFO</Label>
                {outstandingInvoices.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{outstandingInvoices.length} outstanding</span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground -mt-1 mb-2">Oldest invoice paid first. Toggle invoices to include — amounts auto-allocate in order.</p>
              <InvoiceAllocationList
                allocations={allocations}
                outstandingInvoices={outstandingInvoices}
                onToggle={toggleInvoice}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                loading={loadingInvoices}
              />
            </div>
          )}

          {/* Live Calculation Matrix */}
          {allocations.length > 0 && (
            <div className="glass-card p-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Payment Entered</span>
                <span className="text-foreground font-medium tabular-nums">{formatCurrency(form.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount Selected</span>
                <span className="text-sky-400 font-medium tabular-nums">{formatCurrency(totalSelectedBalances)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2.5">
                <span className="text-muted-foreground">
                  {displayUnapplied > 0 ? 'Excess (sits on account)' : displayUnapplied < 0 ? 'Shortfall (partial coverage)' : 'Fully Applied'}
                </span>
                <span className={`font-bold tabular-nums ${
                  displayUnapplied > 0 ? 'text-amber-400' :
                  displayUnapplied < 0 ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {formatCurrency(Math.abs(displayUnapplied))}
                </span>
              </div>
            </div>
          )}

          {/* Edit mode: show stored allocations as read-only */}
          {editItem && (editItem.allocated_invoices || []).length > 0 && (
            <div className="pt-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Allocated Invoices</Label>
              <div className="space-y-2">
                {(editItem.allocated_invoices || []).map(alloc => (
                  <div key={alloc.invoice_id} className="glass-card p-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{alloc.invoice_number}</p>
                    <p className="text-sm font-semibold text-emerald-400 tabular-nums">{formatCurrency(alloc.allocated_amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 flex items-center gap-3">
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave || saving} className="min-w-[120px]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Save Payment</>}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}