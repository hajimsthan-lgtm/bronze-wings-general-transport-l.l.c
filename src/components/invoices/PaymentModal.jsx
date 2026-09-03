import { useState, useEffect, useRef } from 'react';
import { Loader2, Receipt, AlertTriangle, Upload, FileText, X, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DatePicker from '@/components/common/DatePicker';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { deriveStatus } from '@/lib/invoiceWorkflow';

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

export default function PaymentModal({ invoice, mode, open, onOpenChange, onConfirm }) {
  const total = Number(invoice?.total_amount || 0);
  const alreadyPaid = Number(invoice?.paid_amount || 0);
  const balance = Math.max(0, total - alreadyPaid);
  const defaultAmount = mode === 'paid' ? balance : '';
  const isUnsigned = invoice ? deriveStatus(invoice) === 'unsigned' : false;

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMode, setPayMode] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [slipUrl, setSlipUrl] = useState('');
  const [slipName, setSlipName] = useState('');
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [acknowledgedUnsigned, setAcknowledgedUnsigned] = useState(false);
  const [overRemark, setOverRemark] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      setAmount(String(defaultAmount));
      setDate(new Date().toISOString().split('T')[0]);
      setPayMode('bank_transfer');
      setReference('');
      setNotes('');
      setSlipUrl('');
      setSlipName('');
      setAcknowledgedUnsigned(false);
      setOverRemark('');
      generatePaymentReference().then(setReference).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const amt = Number(amount) || 0;
  const isOverBalance = amt > balance;
  const canConfirm = amt > 0 && !saving && (!isUnsigned || acknowledgedUnsigned) && (!isOverBalance || overRemark.trim().length > 0);

  const handleSlipUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlip(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setSlipUrl(file_url);
      setSlipName(file.name);
    } catch (err) {
      // ignore
    } finally {
      setUploadingSlip(false);
    }
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSaving(true);
    try {
      await onConfirm({
        amount: amt,
        date,
        mode: payMode,
        reference,
        notes: isOverBalance && overRemark.trim() ? `${notes ? notes + ' | ' : ''}[Overpayment: ${overRemark.trim()}]` : notes,
        slipUrl,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Record Payment — {invoice?.invoice_number}
          </DialogTitle>
          <DialogDescription>
            Enter the received payment amount. Status will change to{' '}
            <span className="font-semibold text-foreground">
              {mode === 'paid' ? 'Paid' : 'Partially Paid'}
            </span>{' '}
            only after saving.
          </DialogDescription>
        </DialogHeader>

        {/* Soft warning for unsigned invoices */}
        {isUnsigned && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-amber-600 mb-1.5">
                This invoice hasn't been signed yet — record payment anyway?
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledgedUnsigned}
                  onChange={e => setAcknowledgedUnsigned(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer"
                />
                <span className="text-xs text-amber-600 font-medium">Yes, record payment on unsigned invoice</span>
              </label>
            </div>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-muted/40 p-2.5 text-center">
              <div className="text-muted-foreground">Total</div>
              <div className="font-bold font-mono text-foreground mt-0.5">AED {total.toFixed(2)}</div>
            </div>
            <div className="rounded-lg bg-muted/40 p-2.5 text-center">
              <div className="text-muted-foreground">Already Paid</div>
              <div className="font-bold font-mono text-green-400 mt-0.5">AED {alreadyPaid.toFixed(2)}</div>
            </div>
            <div className="rounded-lg bg-primary/10 p-2.5 text-center border border-primary/20">
              <div className="text-primary">Balance</div>
              <div className="font-bold font-mono text-primary mt-0.5">AED {balance.toFixed(2)}</div>
            </div>
          </div>

          <div>
            <Label className="text-xs">Amount Received (AED) *</Label>
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
            {mode === 'paid' && amt < balance && amt > 0 && (
              <p className="text-[11px] text-orange-400 mt-1">
                Amount is less than balance — status will be set to Partially Paid instead.
              </p>
            )}
            {amt <= 0 && (
              <p className="text-[11px] text-red-400 mt-1">Amount is required to change status.</p>
            )}
            {isOverBalance && (
              <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-[11px] text-red-500 font-medium">
                      Amount exceeds balance by AED {(amt - balance).toFixed(2)}. A remark is required to proceed.
                    </p>
                  </div>
                </div>
                <Input
                  value={overRemark}
                  onChange={e => setOverRemark(e.target.value)}
                  placeholder="Enter remark (required) — e.g. customer overpaid, advance for next invoice..."
                  className="mt-2 text-xs h-8 border-red-500/30 focus-visible:border-red-500/50"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Payment Date</Label>
              <DatePicker
                value={date}
                onChange={v => setDate(v)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Payment Mode</Label>
              <Select value={payMode} onValueChange={setPayMode}>
                <SelectTrigger className="mt-1 h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
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
            <Input
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="Auto-generated"
              className="mt-1 font-mono text-xs"
            />
          </div>

          {/* Payment slip / receipt upload */}
          <div>
            <Label className="text-xs">Payment Slip / Receipt (optional)</Label>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleSlipUpload} />
            {slipUrl ? (
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">{slipName}</span>
                <button onClick={() => { setSlipUrl(''); setSlipName(''); }} className="text-muted-foreground hover:text-red-500 flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingSlip}
                className="mt-1 w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border/50 p-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
              >
                {uploadingSlip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploadingSlip ? 'Uploading...' : 'Upload slip/receipt'}
              </button>
            )}
          </div>

          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes..."
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm} className="lightning-btn">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Receipt className="w-4 h-4 mr-2" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}