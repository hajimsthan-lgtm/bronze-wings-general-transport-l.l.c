import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/formatters';
import SalaryDeductionsPicker from './SalaryDeductionsPicker';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const blank = () => ({
  driver_name: '',
  month: MONTHS[new Date().getMonth()],
  year: new Date().getFullYear(),
  base_salary: '',
  overtime: '',
  bonus: '',
  deductions: '',
  net_salary: '',
  status: 'pending',
  payment_method: 'bank_transfer',
  payment_date: '',
  notes: '',
});

export default function SalaryFormSheet({ editItem, prefillDriver, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState(blank);
  const [driverDeductions, setDriverDeductions] = useState([]);
  const [selectedDeductionIds, setSelectedDeductionIds] = useState([]);
  const [deductionAmounts, setDeductionAmounts] = useState({});

  useEffect(() => { base44.entities.Driver.list('-created_date', 200).then(setDrivers).catch(() => {}); }, []);

  useEffect(() => {
    if (editItem) {
      setForm({
        ...blank(),
        ...editItem,
        base_salary: editItem.base_salary ?? '',
        overtime: editItem.overtime ?? '',
        bonus: editItem.bonus ?? '',
        deductions: editItem.deductions ?? '',
        net_salary: editItem.net_salary ?? '',
      });
      setSelectedDeductionIds([]);
      setDeductionAmounts({});
    } else {
      setForm({ ...blank(), driver_name: prefillDriver || '' });
      setSelectedDeductionIds([]);
      setDeductionAmounts({});
    }
  }, [editItem, prefillDriver]);

  // Fetch active installment deductions for the selected driver (FIFO by issue_date)
  useEffect(() => {
    if (!form.driver_name) { setDriverDeductions([]); return; }
    base44.entities.DriverDeduction.filter({ driver_name: form.driver_name, status: 'active' })
      .then((res) => {
        const sorted = (res || [])
          .filter((d) => Number(d.remaining_balance) > 0)
          .sort((a, b) => (a.issue_date || '').localeCompare(b.issue_date || ''));
        setDriverDeductions(sorted);
      })
      .catch(() => setDriverDeductions([]));
  }, [form.driver_name]);

  const recalcNet = (f) => ({
    ...f,
    net_salary: (Number(f.base_salary) || 0) + (Number(f.overtime) || 0) + (Number(f.bonus) || 0) - (Number(f.deductions) || 0),
  });

  const update = (f, v) => setForm((prev) => recalcNet({ ...prev, [f]: v }));

  const pickDriver = (name) => {
    const drv = drivers.find((d) => d.name === name);
    setForm((prev) => recalcNet({ ...prev, driver_name: name, base_salary: drv?.base_salary ?? prev.base_salary }));
    setSelectedDeductionIds([]);
    setDeductionAmounts({});
  };

  const toggleDeduction = (id) => {
    setSelectedDeductionIds((prev) => {
      const willSelect = !prev.includes(id);
      const next = willSelect ? [...prev, id] : prev.filter((x) => x !== id);
      setDeductionAmounts((am) => {
        const am2 = { ...am };
        if (willSelect && am2[id] == null) {
          am2[id] = '';
        }
        const sum = next.reduce((s, did) => {
          return s + (Number(am2[did]) || 0);
        }, 0);
        setForm((f) => recalcNet({ ...f, deductions: sum }));
        return am2;
      });
      return next;
    });
  };

  const setDeductionAmount = (id, value) => {
    setDeductionAmounts((am) => {
      const next = { ...am, [id]: value };
      const sum = selectedDeductionIds.reduce((s, did) => {
        return s + (Number(next[did]) || 0);
      }, 0);
      setForm((f) => recalcNet({ ...f, deductions: sum }));
      return next;
    });
  };

  const handle = async () => {
    setSaving(true);
    try {
      const applied = selectedDeductionIds.map((id) => {
        const d = driverDeductions.find((x) => x.id === id);
        const amount = Number(deductionAmounts[id]) || 0;
        return { id, amount, description: d?.description || d?.type || '', type: d?.type || 'other' };
      }).filter((x) => x.amount > 0);
      await onSave({
        ...form,
        year: Number(form.year),
        base_salary: Number(form.base_salary) || 0,
        overtime: Number(form.overtime) || 0,
        bonus: Number(form.bonus) || 0,
        deductions: Number(form.deductions) || 0,
        net_salary: Number(form.net_salary) || 0,
        applied_deductions: applied,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5">{t('driver')}</Label>
        <Input
          list="salary-drivers"
          value={form.driver_name}
          onChange={(e) => pickDriver(e.target.value)}
          className="bg-background border-border"
          placeholder="Select or type driver name"
        />
        <datalist id="salary-drivers">
          {drivers.map((d) => <option key={d.id} value={d.name} />)}
        </datalist>
      </div>

      <SalaryDeductionsPicker
        deductions={driverDeductions}
        selectedIds={selectedDeductionIds}
        onToggle={toggleDeduction}
        amounts={deductionAmounts}
        onAmountChange={setDeductionAmount}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Month</Label>
          <Select value={form.month} onValueChange={(v) => update('month', v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Year</Label>
          <Input type="number" value={form.year} onChange={(e) => update('year', e.target.value)} className="bg-background border-border" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Base Salary</Label>
          <Input type="number" value={form.base_salary} onChange={(e) => update('base_salary', e.target.value)} className="bg-background border-border" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Overtime</Label>
          <Input type="number" value={form.overtime} onChange={(e) => update('overtime', e.target.value)} className="bg-background border-border" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Bonus</Label>
          <Input type="number" value={form.bonus} onChange={(e) => update('bonus', e.target.value)} className="bg-background border-border" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Deductions</Label>
          <Input type="number" value={form.deductions} onChange={(e) => update('deductions', e.target.value)} className="bg-background border-border" />
        </div>
      </div>

      <div className="glass-card p-3 flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Net Salary</span>
        <span className="text-lg font-display font-bold text-primary">{formatCurrency(Number(form.net_salary) || 0)}</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label>
          <Select value={form.status} onValueChange={(v) => update('status', v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['pending', 'paid', 'partial'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Method</Label>
          <Select value={form.payment_method} onValueChange={(v) => update('payment_method', v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['cash', 'bank_transfer', 'wps'].map((m) => <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5">Payment Date</Label>
        <Input type="date" value={form.payment_date} onChange={(e) => update('payment_date', e.target.value)} className="bg-background border-border" />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5">Notes</Label>
        <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className="bg-background border-border min-h-[70px]" />
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button>
        <Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">
          {saving ? t('loading') : t('save')}
        </Button>
      </div>
    </div>
  );
}