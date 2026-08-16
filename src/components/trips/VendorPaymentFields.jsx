import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, CalendarClock, StickyNote, CreditCard } from 'lucide-react';
import Section from './Section';
import IconInput from './IconInput';

export default function VendorPaymentFields({ p }) {
  const { form, update, t, inputCls } = p;
  return (
    <Section title="Vendor Payment" icon={CreditCard} accent="239,68,68" delay={210}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-white/60 mb-1.5">Agreed Rate (AED)</Label>
          <IconInput icon={DollarSign} type="number" value={form.vendor_agreed_rate} onChange={(e) => update('vendor_agreed_rate', e.target.value)} placeholder="0" className={inputCls} />
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
        <IconInput icon={CalendarClock} type="date" value={form.vendor_due_date} onChange={(e) => update('vendor_due_date', e.target.value)} className={inputCls} />
      </div>
      <div>
        <Label className="text-xs text-white/60 mb-1.5">Notes / Reference</Label>
        <Textarea value={form.vendor_payment_notes} onChange={(e) => update('vendor_payment_notes', e.target.value)} rows={2} placeholder="Reference number, invoice notes, etc." className={inputCls} />
      </div>
    </Section>
  );
}