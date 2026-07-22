import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, CreditCard, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ExportButtons from '@/components/common/ExportButtons';
import ReportStatCard from '@/components/reports/ReportStatCard';

export default function Salary() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [driverMap, setDriverMap] = useState({});

  const load = () => { setLoading(true); base44.entities.SalaryRecord.list('-created_date', 100).then(setRecords).finally(() => setLoading(false)); };
  useEffect(() => { load(); base44.entities.Driver.list('-created_date', 200).then(d => setDriverMap(Object.fromEntries((d || []).map(x => [x.name, x.id])))).catch(() => {}); }, []);

  const filtered = records.filter(r => !r.payment_date || (r.payment_date >= dateFrom && r.payment_date <= dateTo));
  const totalPaid = filtered.filter(r => r.status === 'paid').reduce((s, r) => s + (r.net_salary || 0), 0);
  const totalPending = filtered.filter(r => r.status === 'pending').reduce((s, r) => s + (r.net_salary || 0), 0);

  return (
    <div>
      <PageHeader title={t('salary')} description={`${filtered.length} records`}
        action={<div className="flex items-center gap-2"><ExportButtons data={filtered} filename="salary_records" title="Salary Records" columns={[{ label: 'Driver', key: 'driver_name' }, { label: 'Month', key: 'month' }, { label: 'Year', key: 'year' }, { label: 'Base', key: 'base_salary' }, { label: 'Overtime', key: 'overtime' }, { label: 'Bonus', key: 'bonus' }, { label: 'Deductions', key: 'deductions' }, { label: 'Net', key: 'net_salary' }, { label: 'Status', key: 'status' }, { label: 'Method', key: 'payment_method' }, { label: 'Paid On', key: 'payment_date' }]} /><Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button></div>} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <ReportStatCard index={0} label={t('paid')} value={totalPaid} format={formatCurrency} icon={CheckCircle2} color="#22c55e" />
        <ReportStatCard index={1} label={t('pending')} value={totalPending} format={formatCurrency} icon={Clock} color="#f59e0b" />
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={CreditCard} title={t('no_data')} /> : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className="w-full text-left row-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg entity-avatar flex items-center justify-center flex-shrink-0"><CreditCard className="w-4 h-4 text-white/70" /></div>
              <div className="flex-1 min-w-0">
                {driverMap[r.driver_name]
                  ? <Link to={`/admin/drivers/${driverMap[r.driver_name]}?tab=salary`} className="text-sm font-medium text-foreground hover:text-[#38BDF8] transition-colors hover:underline">{r.driver_name}</Link>
                  : <p className="text-sm font-medium text-foreground">{r.driver_name}</p>}
                <p className="text-xs text-muted-foreground">{r.month} {r.year} · {r.payment_method}</p>
              </div>
              <button onClick={() => { setEditItem(r); setFormOpen(true); }} className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-foreground">{formatCurrency(r.net_salary)}</p>
                <StatusBadge status={r.status} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Salary</SheetTitle></SheetHeader>
          <SalaryForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.SalaryRecord.update(editItem.id, data); else await base44.entities.SalaryRecord.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SalaryForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [drivers, setDrivers] = useState([]);
  useEffect(() => { base44.entities.Driver.list('-created_date', 200).then(setDrivers).catch(() => {}); }, []);
  const [form, setForm] = useState({ driver_name: '', month: '', year: new Date().getFullYear(), base_salary: '', overtime: '', bonus: '', deductions: '', net_salary: '', status: 'pending', payment_method: 'bank_transfer', payment_date: '', notes: '' });
  useEffect(() => {
    if (editItem) setForm({ ...form, ...editItem, base_salary: editItem.base_salary || '', overtime: editItem.overtime || '', bonus: editItem.bonus || '', deductions: editItem.deductions || '', net_salary: editItem.net_salary || '' });
    else setForm({ driver_name: '', month: '', year: new Date().getFullYear(), base_salary: '', overtime: '', bonus: '', deductions: '', net_salary: '', status: 'pending', payment_method: 'bank_transfer', payment_date: '', notes: '' });
  }, [editItem]);
  const update = (f, v) => {
    const next = { ...form, [f]: v };
    if (['base_salary', 'overtime', 'bonus', 'deductions'].includes(f)) {
      next.net_salary = (Number(next.base_salary) || 0) + (Number(next.overtime) || 0) + (Number(next.bonus) || 0) - (Number(next.deductions) || 0);
    }
    setForm(next);
  };
  const handle = async () => { setSaving(true); await onSave({ ...form, year: Number(form.year), base_salary: Number(form.base_salary) || 0, overtime: Number(form.overtime) || 0, bonus: Number(form.bonus) || 0, deductions: Number(form.deductions) || 0, net_salary: Number(form.net_salary) || 0 }); setSaving(false); };

  return (
    <div className="space-y-4">
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('driver')}</Label><Input list="salary-drivers" value={form.driver_name} onChange={e => update('driver_name', e.target.value)} className="bg-background border-border" /><datalist id="salary-drivers">{drivers.map(d => <option key={d.id} value={d.name} />)}</datalist></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Month</Label><Input value={form.month} onChange={e => update('month', e.target.value)} placeholder="January" className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Year</Label><Input type="number" value={form.year} onChange={e => update('year', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Base Salary</Label><Input type="number" value={form.base_salary} onChange={e => update('base_salary', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Overtime</Label><Input type="number" value={form.overtime} onChange={e => update('overtime', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Bonus</Label><Input type="number" value={form.bonus} onChange={e => update('bonus', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Deductions</Label><Input type="number" value={form.deductions} onChange={e => update('deductions', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div className="glass-card p-3 flex justify-between items-center"><span className="text-sm text-muted-foreground">Net Salary</span><span className="text-lg font-display font-bold text-primary">{formatCurrency(Number(form.net_salary) || 0)}</span></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label><Select value={form.status} onValueChange={v => update('status', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['pending','paid','partial'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Method</Label><Select value={form.payment_method} onValueChange={v => update('payment_method', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['cash','bank_transfer','wps'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>
  );
}