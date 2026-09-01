import { useState, useEffect, useMemo } from 'react';
import { Loader2, Receipt, Layers, RefreshCw, PencilLine } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DatePicker from '@/components/common/DatePicker';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/formatters';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
];

async function generatePaymentReference() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const prefix = `PAY-${ymd}-`;
  const existing = await base44.entities.ClientPayment.list('-created_date', 200).catch(() => []);
  let maxSeq = 0;
  (existing || []).forEach(p => {
    if (p.reference_number?.startsWith(prefix)) {
      const seq = parseInt(p.reference_number.slice(prefix.length), 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  });
  return `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
}

export default function BulkPaymentModal({ invoices, open, onOpenChange, onConfirm }) {
  // FIFO sort: oldest issue_date first
  const sortedInvoices = useMemo(() => {
    return [...invoices].sort((a, b) =>
      (a.issue_date || '').localeCompare(b.issue_date || '') ||
      String(a.invoice_number || '').localeCompare(String(b.invoice_number || ''))
    );
  }, [invoices]);

  const totalBalance = useMemo(() =>
    sortedInvoices.reduce((s, inv) =>
      s + Math.max(0, (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0)), 0
    ), [sortedInvoices]);

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMode, setPayMode] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [manualOverrides, setManualOverrides] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(String(totalBalance.toFixed(2)));
      setDate(new Date().toISOString().split('T')[0]);
      setPayMode('bank_transfer');
      setReference('');
      setNotes('');
      setSelectedIndices(sortedInvoices.map((_, i) => i));
      setManualOverrides({});
      generatePaymentReference().then(setReference).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, totalBalance]);

  // FIFO allocation with manual overrides: a locked amount takes its FIFO slot,
  // the remaining budget auto-fills the rest in oldest-first order.
  const allocations = useMemo(() => {
    let remaining = Number(amount) || 0;
    return sortedInvoices.map((inv, idx) => {
      const isSelected = selectedIndices.includes(idx);
      const balance = Math.max(0, (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0));
      const base = {
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        invoice_total: Number(inv.total_amount) || 0,
        already_paid: Number(inv.paid_amount) || 0,
        is_selected: isSelected,
      };
      if (!isSelected) {
        return { ...base, allocated_amount: 0, is_manual: false };
      }
      const override = manualOverrides[inv.id];
      const hasManual = override !== undefined && override !== '';
      let allocation;
      if (hasManual) {
        allocation = Math.min(Math.max(0, Number(override) || 0), balance);
      } else if (remaining <= 0) {
        allocation = 0;
      } else {
        allocation = Math.min(remaining, balance);
      }
      remaining -= allocation;
      return { ...base, allocated_amount: allocation, is_manual: hasManual };
    });
  }, [sortedInvoices, amount, selectedIndices, manualOverrides]);

  const totalAllocated = useMemo(() =>
    allocations.reduce((s, a) => s + (a.allocated_amount || 0), 0), [allocations]);

  const unapplied = (Number(amount) || 0) - totalAllocated;

  const toggleInvoice = (idx) => {
    setSelectedIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleManualEdit = (inv, value) => {
    setManualOverrides(prev => ({ ...prev, [inv.id]: value }));
  };

  const handleAutoRearrange = () => setManualOverrides({});

  const amt = Number(amount) || 0;
  const canConfirm = amt > 0 && totalAllocated > 0 && !saving;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSaving(true);
    try {
      const selectedAllocations = allocations.filter(a => a.is_selected && a.allocated_amount > 0);
      await onConfirm({
        amount: amt,
        date,
        mode: payMode,
        reference,
        notes,
        allocations: selectedAllocations,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Bulk Payment — {sortedInvoices.length} Invoices
          </DialogTitle>
          <DialogDescription>
            Enter the total received amount. Payment is auto-allocated across selected invoices in FIFO order (oldest first). Edit any allocated amount to override manually, then use Auto Rearrange to reset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-muted/40 p-2.5 text-center">
              <div className="text-muted-foreground">Total Balance</div>
              <div className="font-bold font-mono text-foreground mt-0.5">AED {totalBalance.toFixed(2)}</div>
            </div>
            <div className="rounded-lg bg-primary/10 p-2.5 text-center border border-primary/20">
              <div className="text-primary">Allocated</div>
              <div className="font-bold font-mono text-primary mt-0.5">AED {totalAllocated.toFixed(2)}</div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Total Amount Received (AED) *</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1 font-mono text-base"
              autoFocus
            />
            {unapplied > 0.01 && (
              <p className="text-[11px] text-orange-400 mt-1">
                AED {unapplied.toFixed(2)} excess — will sit on account as unapplied balance.
              </p>
            )}
            {unapplied < -0.01 && (
              <p className="text-[11px] text-red-400 mt-1">
                AED {Math.abs(unapplied).toFixed(2)} shortfall — some invoices won't be fully covered.
              </p>
            )}
          </div>

          {/* FIFO Invoice List */}
          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/20">
                  <Layers className="w-3 h-3" /> FIFO
                </span>
                <span className="text-[10px] text-muted-foreground">Oldest invoice paid first</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAutoRearrange}
                disabled={Object.keys(manualOverrides).length === 0}
                className="h-6 text-[10px] px-2 gap-1 text-violet-300 hover:text-violet-200 hover:bg-violet-500/10 disabled:opacity-40"
                title="Reset all manual overrides and re-allocate FIFO"
              >
                <RefreshCw className="w-3 h-3" /> Auto Rearrange
              </Button>
            </div>
            {sortedInvoices.map((inv, idx) => {
              const alloc = allocations[idx];
              const balance = Math.max(0, (alloc.invoice_total || 0) - (alloc.already_paid || 0));
              const isFull = alloc.allocated_amount >= balance && alloc.allocated_amount > 0;
              const isPartial = alloc.allocated_amount > 0 && alloc.allocated_amount < balance;
              return (
                <div
                  key={inv.id || idx}
                  className={`glass-card-hover p-2.5 transition-all ${alloc.is_selected ? '' : 'opacity-40'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full glass-panel flex items-center justify-center text-[9px] font-mono text-muted-foreground flex-shrink-0">
                      {idx + 1}
                    </span>
                    <Checkbox checked={alloc.is_selected} onCheckedChange={() => toggleInvoice(idx)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{inv.invoice_number || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Out: {formatCurrency(balance)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0 min-w-[96px]">
                      {alloc.is_selected ? (
                        <>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={manualOverrides[inv.id] !== undefined ? manualOverrides[inv.id] : (alloc.allocated_amount || '')}
                            onChange={e => handleManualEdit(inv, e.target.value)}
                            className={`w-24 h-7 text-xs font-mono tabular-nums text-right px-2 ${alloc.is_manual ? 'border-violet-500/40' : ''}`}
                            title={alloc.is_manual ? 'Manually overwritten — Auto Rearrange to reset' : 'Auto-allocated (FIFO)'}
                          />
                          <div className="flex items-center gap-1 mt-0.5 h-3">
                            {alloc.is_manual ? (
                              <span className="text-[8px] font-semibold text-violet-300 flex items-center gap-0.5">
                                <PencilLine className="w-2.5 h-2.5" /> Manual
                              </span>
                            ) : alloc.allocated_amount > 0 ? (
                              <span className={`text-[8px] ${isFull ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {isFull ? 'Full' : 'Partial'}
                              </span>
                            ) : null}
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">—</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Payment Date</Label>
              <DatePicker value={date} onChange={v => setDate(v)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Payment Mode</Label>
              <Select value={payMode} onValueChange={setPayMode}>
                <SelectTrigger className="mt-1 h-10 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_MODES.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Reference Number</Label>
            <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Auto-generated" className="mt-1 font-mono text-xs" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!canConfirm} className="lightning-btn">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Receipt className="w-4 h-4 mr-2" />}
            Record Bulk Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}