import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { inputClass, labelClass, selectTriggerClass, selectContentClass, selectItemClass } from './styles';
import DatePicker from '@/components/common/DatePicker';

const STATUSES = ['paid', 'pending', 'partial', 'advance', 'reversal'];
const MODES = ['cash', 'bank_transfer', 'card', 'split'];
const REFUND_MODES = ['cash', 'bank_transfer', 'card'];

export default function TransactionStep2({ form, update, updateArrayItem, addArrayItem, removeArrayItem, handleAmountReceivedBlur, advances, vendorTotal }) {
  const { t } = useI18n();
  const isAdvanceApplied = !!form.advance_applied_ref;
  const breakdownTotal = (form.payment_breakdown || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const splitSum = (Number(form.cash_received) || 0) + (Number(form.bank_received) || 0);
  const splitMismatch = form.payment_mode === 'split' && form.payment_status === 'paid' && Math.abs(splitSum - (Number(form.amount) || 0)) > 0.01;
  const today = new Date().toISOString().split('T')[0];
  const isOverdue = form.due_date && form.due_date < today;
  const amount = Number(form.amount) || 0;
  const received = Number(form.amount_received) || 0;

  return (
    <div className="space-y-5">
      <div className={`grid gap-3 ${form.service_mode === 'hourly' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <div>
          <Label className={labelClass}>{t('amount')} (Revenue)</Label>
          <Input type="number" value={form.amount} onChange={e => update('amount', e.target.value)} className={inputClass} />
        </div>
        {form.service_mode === 'hourly' && (
          <div>
            <Label className={labelClass}>{t('hours')}</Label>
            <Input type="number" value={form.hours} onChange={e => update('hours', e.target.value)} className={inputClass} />
          </div>
        )}
      </div>

      <div>
        <Label className={labelClass}>{t('amount_received')}</Label>
        <Input type="number" value={form.amount_received} onChange={e => update('amount_received', e.target.value)} onBlur={handleAmountReceivedBlur} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className={labelClass}>{t('payment_status')}</Label>
          <Select value={form.payment_status} onValueChange={v => update('payment_status', v)}>
            <SelectTrigger className={selectTriggerClass}><SelectValue /></SelectTrigger>
            <SelectContent className={selectContentClass}>
              {STATUSES.map(s => <SelectItem key={s} value={s} className={selectItemClass}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className={labelClass}>{t('payment_mode')}</Label>
          <Select value={form.payment_mode} onValueChange={v => update('payment_mode', v)} disabled={form.payment_status === 'pending'}>
            <SelectTrigger className={`${selectTriggerClass} ${form.payment_status === 'pending' ? 'opacity-40' : ''}`}><SelectValue /></SelectTrigger>
            <SelectContent className={selectContentClass}>
              {MODES.map(m => <SelectItem key={m} value={m} className={selectItemClass}>{m.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className={labelClass}>Transaction Status</Label>
        <Select value={form.transaction_status} onValueChange={v => update('transaction_status', v)}>
          <SelectTrigger className={selectTriggerClass}><SelectValue /></SelectTrigger>
          <SelectContent className={selectContentClass}>
            <SelectItem value="done" className={selectItemClass}>Done</SelectItem>
            <SelectItem value="pending" className={selectItemClass}>Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditional: Pending */}
      {form.payment_status === 'pending' && (
        <div className="space-y-3 pt-4 border-t border-[#27272a]">
          <div>
            <Label className={labelClass}>{t('due_date')}</Label>
            <DatePicker value={form.due_date} onChange={v => update('due_date', v)} className={inputClass} />
            {isOverdue && <p className="text-amber-400 text-[10px] mt-1">Warning: Due date has passed</p>}
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex justify-between items-center">
            <span className="text-xs text-amber-400">Customer Due</span>
            <span className="text-sm font-medium text-amber-400 tabular-nums">{formatCurrency(amount - received)}</span>
          </div>
        </div>
      )}

      {/* Conditional: Partial */}
      {form.payment_status === 'partial' && (
        <div className="space-y-3 pt-4 border-t border-[#27272a]">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Payment Breakdown</span>
            <Button variant="ghost" size="sm" onClick={() => addArrayItem('payment_breakdown', { mode: 'cash', amount: 0, reference: '', notes: '' })} className="text-blue-400 hover:text-blue-300 h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Add Row
            </Button>
          </div>
          {(form.payment_breakdown || []).map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <Select value={row.mode} onValueChange={v => updateArrayItem('payment_breakdown', i, 'mode', v)}>
                <SelectTrigger className={`${selectTriggerClass} col-span-3 h-9 text-xs`}><SelectValue /></SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {['cash', 'bank_transfer', 'card'].map(m => <SelectItem key={m} value={m} className={selectItemClass}>{m.replace(/_/g, ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Amt" value={row.amount} onChange={e => updateArrayItem('payment_breakdown', i, 'amount', e.target.value)} className={`${inputClass} col-span-3 h-9 text-xs`} />
              <Input placeholder="Ref" value={row.reference} onChange={e => updateArrayItem('payment_breakdown', i, 'reference', e.target.value)} className={`${inputClass} col-span-3 h-9 text-xs`} />
              <Input placeholder="Notes" value={row.notes} onChange={e => updateArrayItem('payment_breakdown', i, 'notes', e.target.value)} className={`${inputClass} col-span-2 h-9 text-xs`} />
              <Button variant="ghost" size="sm" onClick={() => removeArrayItem('payment_breakdown', i)} className="col-span-1 h-9 text-gray-500 hover:text-red-400 p-0">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          <div className="flex justify-between text-xs">
            <span className="text-emerald-400">Paid: <span className="tabular-nums">{formatCurrency(breakdownTotal)}</span></span>
            <span className="text-amber-400">Remaining: <span className="tabular-nums">{formatCurrency(amount - breakdownTotal)}</span></span>
          </div>
        </div>
      )}

      {/* Conditional: Paid + Split */}
      {form.payment_status === 'paid' && form.payment_mode === 'split' && (
        <div className="space-y-3 pt-4 border-t border-[#27272a]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={labelClass}>Cash Received</Label>
              <Input type="number" value={form.cash_received} onChange={e => update('cash_received', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label className={labelClass}>Bank Received</Label>
              <Input type="number" value={form.bank_received} onChange={e => update('bank_received', e.target.value)} className={inputClass} />
            </div>
          </div>
          {splitMismatch && <p className="text-red-400 text-[10px]">Warning: Cash + Bank does not equal Total Amount</p>}
        </div>
      )}

      {/* Conditional: Advance */}
      {form.payment_status === 'advance' && (
        <div className="space-y-3 pt-4 border-t border-[#27272a]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={labelClass}>Advance Amount</Label>
              <Input type="number" value={form.advance_amount} onChange={e => update('advance_amount', e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label className={labelClass}>Received Date</Label>
              <DatePicker value={form.advance_received_date} onChange={v => update('advance_received_date', v)} className={inputClass} />
            </div>
          </div>
          <div>
            <Label className={labelClass}>Reference Number</Label>
            <Input value={form.advance_reference} onChange={e => update('advance_reference', e.target.value)} className={inputClass} />
          </div>
        </div>
      )}

      {/* Conditional: Reversal */}
      {form.payment_status === 'reversal' && (
        <div className="space-y-3 pt-4 border-t border-[#27272a]">
          <div>
            <Label className={labelClass}>Refund Reason</Label>
            <Input value={form.refund_reason} onChange={e => update('refund_reason', e.target.value)} className={inputClass} />
          </div>
          <div>
            <Label className={labelClass}>Refund Mode</Label>
            <Select value={form.refund_mode} onValueChange={v => update('refund_mode', v)}>
              <SelectTrigger className={selectTriggerClass}><SelectValue /></SelectTrigger>
              <SelectContent className={selectContentClass}>
                {REFUND_MODES.map(m => <SelectItem key={m} value={m} className={selectItemClass}>{m.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={labelClass}>Refund Notes</Label>
            <Textarea value={form.refund_notes} onChange={e => update('refund_notes', e.target.value)} className={`${inputClass} min-h-[80px] resize-none h-auto`} />
          </div>
        </div>
      )}

      {/* Advance Usage */}
      {form.payment_status !== 'advance' && (advances || []).length > 0 && (
        <div className="pt-4 border-t border-[#27272a]">
          <Label className={labelClass}>Apply Advance</Label>
          <Select value={form.advance_applied_ref || 'none'} onValueChange={v => update('advance_applied_ref', v === 'none' ? '' : v)}>
            <SelectTrigger className={selectTriggerClass}><SelectValue /></SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem value="none" className={selectItemClass}>None</SelectItem>
              {advances.map(a => <SelectItem key={a.id} value={a.reference_number} className={selectItemClass}>{a.reference_number} — {formatCurrency(a.remaining_amount)}</SelectItem>)}
            </SelectContent>
          </Select>
          {isAdvanceApplied && (
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 mt-2 text-xs text-blue-400">
              Advance applied: {form.advance_applied_ref}. Service expenses locked.
            </div>
          )}
        </div>
      )}

      {/* Service Expenses */}
      <div className={`space-y-3 pt-4 border-t border-[#27272a] ${isAdvanceApplied ? 'opacity-50 pointer-events-none' : ''}`}>
        <span className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Service Expenses</span>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className={labelClass}>{t('govt_fee')}</Label>
            <Input type="number" value={form.government_fee} onChange={e => update('government_fee', e.target.value)} className={inputClass} />
          </div>
          <div>
            <Label className={labelClass}>Govt Fee Status</Label>
            <div className="flex items-center gap-2 h-10 px-3 bg-[#111111] border border-[#27272a] rounded-lg">
              <Switch checked={form.govt_fee_status === 'paid'} onCheckedChange={v => update('govt_fee_status', v ? 'paid' : 'pending')} className="data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-[#27272a]" />
              <span className="text-sm text-white">{form.govt_fee_status === 'paid' ? 'Paid' : 'Pending'}</span>
            </div>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className={labelClass}>{t('vendor_expenses')}</Label>
            <Button variant="ghost" size="sm" onClick={() => addArrayItem('vendor_expenses', { vendor_name: '', amount: 0, source: 'cash' })} className="text-blue-400 hover:text-blue-300 h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Add Vendor
            </Button>
          </div>
          {(form.vendor_expenses || []).map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center mb-2">
              <Input placeholder="Vendor" value={row.vendor_name} onChange={e => updateArrayItem('vendor_expenses', i, 'vendor_name', e.target.value)} className={`${inputClass} col-span-5 h-9 text-xs`} />
              <Input type="number" placeholder="Amt" value={row.amount} onChange={e => updateArrayItem('vendor_expenses', i, 'amount', e.target.value)} className={`${inputClass} col-span-3 h-9 text-xs`} />
              <Select value={row.source} onValueChange={v => updateArrayItem('vendor_expenses', i, 'source', v)}>
                <SelectTrigger className={`${selectTriggerClass} col-span-3 h-9 text-xs`}><SelectValue /></SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value="cash" className={selectItemClass}>Cash</SelectItem>
                  <SelectItem value="bank" className={selectItemClass}>Bank</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" onClick={() => removeArrayItem('vendor_expenses', i)} className="col-span-1 h-9 text-gray-500 hover:text-red-400 p-0">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          {vendorTotal > 0 && (
            <p className="text-xs text-gray-400">Vendor Total: <span className="text-white tabular-nums">{formatCurrency(vendorTotal)}</span></p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="pt-4 border-t border-[#27272a]">
        <Label className={labelClass}>{t('notes')}</Label>
        <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Remarks or additional notes..." className={`${inputClass} min-h-[80px] resize-none h-auto`} />
      </div>

      {/* Mute Profit */}
      <div className={`flex items-center justify-between rounded-lg p-3 border ${form.is_muted ? 'border-amber-500/30 bg-amber-500/5' : 'border-[#27272a]'}`}>
        <span className="text-sm text-gray-300">Mute Profit</span>
        <Switch checked={form.is_muted} onCheckedChange={v => update('is_muted', v)} className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-[#27272a]" />
      </div>
    </div>
  );
}