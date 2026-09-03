import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import DatePicker from '@/components/common/DatePicker';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, CalendarClock, StickyNote, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import Section from './Section';
import IconInput from './IconInput';

export default function VendorPaymentFields({ p }) {
  const { form, update, t, inputCls, autoVendorRate, vendorRateOverridden } = p;
  return (
    <Section title="Service Provider Payment" icon={CreditCard} accent="239,68,68" delay={210}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-white/60 mb-1.5">Agreed Rate (AED)</Label>
          <IconInput
            icon={DollarSign}
            type="number"
            value={form.vendor_agreed_rate}
            onChange={(e) => { update('vendor_agreed_rate', e.target.value); p.setVendorRateOverride?.(true); }}
            placeholder="0"
            className={inputCls}
          />
          {vendorRateOverridden ? (
            <p className="text-[10px] text-red-400 font-semibold mt-1">⚠ Overwritten — auto value was {formatCurrency(autoVendorRate || 0)}</p>
          ) : (
            <p className="text-[10px] text-amber-400 mt-1">Auto-calculated from trip revenue (editable)</p>
          )}
        </div>
        <div>
          <Label className="text-xs text-white/60 mb-1.5">Payment Status</Label>
          <Select value={form.vendor_payment_status} onValueChange={(v) => update('vendor_payment_status', v)}>
            <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partially_paid">Partially Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs text-white/60 mb-1.5">Due Date (optional)</Label>
        <DatePicker value={form.vendor_due_date} onChange={(v) => update('vendor_due_date', v)} className={inputCls} />
      </div>
      <div>
        <Label className="text-xs text-white/60 mb-1.5">Notes / Reference</Label>
        <Textarea value={form.vendor_payment_notes} onChange={(e) => update('vendor_payment_notes', e.target.value)} rows={2} placeholder="Reference number, invoice notes, etc." className={inputCls} />
      </div>
      <p className="text-[9px] text-white/30 italic">Internal only — service provider payment data never appears on client-facing invoices or documents.</p>
    </Section>
  );
}