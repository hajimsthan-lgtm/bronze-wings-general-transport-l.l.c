import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { useTransactionCreate, useTransactionUpdate } from '@/hooks/useEntityQueries';
import { formatCurrency } from '@/lib/formatters';
import TransactionStep1 from './TransactionStep1';
import TransactionStep2 from './TransactionStep2';
import TransactionStep3 from './TransactionStep3';

const STEPS = ['quick_entry', 'payment_expenses', 'review_submit'];
const DEFAULT_FORM = {
  reference_number: '', customer_name: '', emirates_id: '', category: '', sub_category: '',
  service_type: '', staff_name: '', service_date: new Date().toISOString().split('T')[0],
  service_mode: 'one_time', hours: 0, amount: 0, amount_received: 0,
  payment_status: 'pending', payment_mode: 'cash', transaction_status: 'pending',
  due_date: '', cash_received: 0, bank_received: 0, advance_amount: 0,
  advance_received_date: '', advance_reference: '', advance_applied_ref: '',
  refund_reason: '', refund_mode: '', refund_notes: '',
  government_fee: 0, govt_fee_status: 'pending', vendor_expenses: [], payment_breakdown: [],
  profit: 0, is_muted: false, is_draft: false, notes: '',
};

export default function TransactionFormSheet({ open, onOpenChange, editItem, onSaved, isDeduction, deductionData }) {
  const { t } = useI18n();
  const createTxn = useTransactionCreate();
  const updateTxn = useTransactionUpdate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [refLoading, setRefLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [form, setForm] = useState({ ...DEFAULT_FORM });

  useEffect(() => {
    if (open) {
      setForm(editItem ? { ...DEFAULT_FORM, ...editItem } : { ...DEFAULT_FORM });
      setStep(0);
      Promise.all([
        base44.entities.Customer.list('-created_date', 200).catch(() => []),
        base44.entities.Service.list('-created_date', 200).catch(() => []),
        base44.entities.Staff.list('-created_date', 200).catch(() => []),
        base44.entities.AdvancePayment.filter({ status: 'active' }).catch(() => []),
        base44.auth.me().catch(() => null),
      ]).then(([c, s, st, adv, user]) => {
        setCustomers(c || []);
        setServices(s || []);
        setStaff(st || []);
        setAdvances(adv || []);
        if (!editItem && user) {
          setForm(prev => ({ ...prev, staff_name: user.full_name || user.email || '' }));
        }
      });
      if (!editItem && !isDeduction) {
        setRefLoading(true);
        base44.entities.Transaction.list('-created_date', 200).then(existing => {
          const d = new Date();
          const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
          const prefix = `TXN-${ymd}-`;
          let maxSeq = 0;
          (existing || []).forEach(tr => {
            if (tr.reference_number?.startsWith(prefix)) {
              const seq = parseInt(tr.reference_number.slice(prefix.length), 10);
              if (seq > maxSeq) maxSeq = seq;
            }
          });
          setForm(prev => ({ ...prev, reference_number: `${prefix}${String(maxSeq + 1).padStart(4, '0')}` }));
          setRefLoading(false);
        }).catch(() => setRefLoading(false));
      }
    }
  }, [open, editItem, isDeduction]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updateArrayItem = (field, index, key, value) => setForm(prev => {
    const arr = [...(prev[field] || [])];
    arr[index] = { ...arr[index], [key]: value };
    return { ...prev, [field]: arr };
  });
  const addArrayItem = (field, template) => setForm(prev => ({ ...prev, [field]: [...(prev[field] || []), template] }));
  const removeArrayItem = (field, index) => setForm(prev => ({ ...prev, [field]: (prev[field] || []).filter((_, i) => i !== index) }));

  const handleAmountReceivedBlur = () => {
    const received = Number(form.amount_received) || 0;
    const total = Number(form.amount) || 0;
    if (total > 0) {
      if (received === 0) update('payment_status', 'pending');
      else if (received < total) update('payment_status', 'partial');
      else update('payment_status', 'paid');
    }
  };

  const vendorTotal = useMemo(() => (form.vendor_expenses || []).reduce((s, v) => s + (Number(v.amount) || 0), 0), [form.vendor_expenses]);
  const profit = useMemo(() => (Number(form.amount_received) || 0) - (Number(form.government_fee) || 0) - vendorTotal, [form.amount_received, form.government_fee, vendorTotal]);

  const buildData = (isDraft = false) => ({
    ...form,
    is_draft: isDraft,
    hours: Number(form.hours) || 0,
    amount: Number(form.amount) || 0,
    amount_received: Number(form.amount_received) || 0,
    cash_received: Number(form.cash_received) || 0,
    bank_received: Number(form.bank_received) || 0,
    advance_amount: Number(form.advance_amount) || 0,
    government_fee: Number(form.government_fee) || 0,
    profit,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = buildData(false);
      if (editItem) await updateTxn.mutateAsync({ id: editItem.id, data });
      else await createTxn.mutateAsync(data);
      onSaved?.();
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const data = buildData(true);
      if (editItem) await updateTxn.mutateAsync({ id: editItem.id, data });
      else await createTxn.mutateAsync(data);
      onSaved?.();
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  const canNext = step === 0 ? (form.customer_name && form.category) : true;

  if (isDeduction) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="bg-[#0a0a0a] border-l border-[#27272a] p-6 w-full sm:max-w-[480px]" side="right">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-white text-base font-semibold">Government Fee Deduction</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Deduction Amount</p>
              <p className="text-2xl font-bold text-red-400 tabular-nums">{formatCurrency(deductionData?.amount || 0)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">Linked Transaction</p>
              <p className="text-sm text-white">{deductionData?.linked_txn_ref || '—'}</p>
            </div>
          </div>
          <Button onClick={() => onOpenChange(false)} className="w-full mt-8 bg-transparent border border-[#27272a] text-gray-300 hover:bg-[#1a1a1a] rounded-lg h-10">Close</Button>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#0a0a0a] border-l border-[#27272a] p-0 w-full sm:max-w-[480px] flex flex-col" side="right">
        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#27272a] px-6 pt-6 pb-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-white text-base font-semibold">{t('new_transaction')}</h2>
              {refLoading ? (
                <p className="text-[11px] text-gray-500 mt-0.5">Generating TXN #...</p>
              ) : (
                <p className="text-[11px] text-gray-500 mt-0.5 font-mono">{form.reference_number}</p>
              )}
            </div>
            <button onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className={`h-1 rounded-full flex-1 transition-colors ${i <= step ? 'bg-blue-500' : 'bg-[#27272a]'}`} />
            ))}
          </div>
          <p className="text-[11px] text-gray-500 mt-1.5">Step {step + 1} of 3 — {t(STEPS[step])}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 0 && <TransactionStep1 form={form} update={update} customers={customers} services={services} staff={staff} />}
          {step === 1 && (
            <TransactionStep2
              form={form} update={update} updateArrayItem={updateArrayItem}
              addArrayItem={addArrayItem} removeArrayItem={removeArrayItem}
              handleAmountReceivedBlur={handleAmountReceivedBlur} advances={advances} vendorTotal={vendorTotal}
            />
          )}
          {step === 2 && <TransactionStep3 form={form} profit={profit} vendorTotal={vendorTotal} />}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0a0a0a] border-t border-[#27272a] px-6 py-4 flex items-center gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="bg-transparent border border-[#27272a] text-gray-300 hover:bg-[#1a1a1a] rounded-lg h-10">
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
          )}
          <button onClick={handleSaveDraft} disabled={saving} className="text-gray-400 hover:text-white text-xs font-medium transition-colors px-2">
            Save Draft
          </button>
          <div className="flex-1" />
          {step < 2 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg h-10 font-medium px-6">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg h-10 font-medium px-6">
              <Check className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Submit'}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}