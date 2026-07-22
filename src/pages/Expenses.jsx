import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/formatters';
import { Plus, Search, Receipt, Fuel, Wrench, Car, CreditCard, ShieldCheck, Building, Package, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ExportButtons from '@/components/common/ExportButtons';
import { useSheetUrlState } from '@/hooks/useSheetUrlState';
import PullToRefresh from '@/components/common/PullToRefresh';
import { useExpenses, useExpenseCreate, useExpenseUpdate, useExpenseDelete } from '@/hooks/useEntityQueries';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import ReportRowCard from '@/components/reports/ReportRowCard';
import ReportStatusBadge from '@/components/reports/ReportStatusBadge';
import DonutChart from '@/components/reports/DonutChart';
import TrendChart from '@/components/reports/TrendChart';

const CATEGORIES = ['all', 'fuel', 'maintenance', 'toll', 'salary', 'insurance', 'registration', 'office', 'other'];
const categoryIcons = { fuel: Fuel, maintenance: Wrench, toll: Car, salary: CreditCard, insurance: ShieldCheck, registration: Building, office: Building, other: Package };
const categoryColors = { fuel: '#f97316', maintenance: '#3b82f6', toll: '#a855f7', salary: '#22c55e', insurance: '#ec4899', registration: '#14b8a6', office: '#f59e0b', other: '#94a3b8' };

export default function Expenses() {
  const { t } = useI18n();
  const { data: expenses = [], isLoading: loading, refetch } = useExpenses();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useSheetUrlState('expense');
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const deleteExpense = useExpenseDelete();

  const filtered = expenses.filter(e => {
    if (filter !== 'all' && e.category !== filter) return false;
    if (e.date < dateFrom || e.date > dateTo) return false;
    if (search) { const q = search.toLowerCase(); return e.description?.toLowerCase().includes(q) || e.vendor_name?.toLowerCase().includes(q); }
    return true;
  });

  const totalAmount = filtered.reduce((s, e) => s + (e.amount || 0), 0);

  // Category donut
  const catMap = {};
  filtered.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + (e.amount || 0); });
  const donutData = Object.entries(catMap).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value, color: categoryColors[name] || '#94a3b8' })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  // Daily trend
  const days = [];
  { let d = new Date(dateFrom); const end = new Date(dateTo); while (d <= end) { days.push(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 1); } }
  const trendData = days.map((d) => ({ label: formatDateShort(d), amount: filtered.filter((e) => e.date === d).reduce((s, e) => s + (e.amount || 0), 0) }));

  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-24 -left-10 w-[420px] h-[420px] rounded-full blur-[130px] md:animate-[float_20s_ease-in-out_infinite]" style={{ background: 'rgba(249,115,22,0.05)' }} />
        <div className="absolute top-1/3 -right-24 w-[360px] h-[360px] rounded-full blur-[130px] md:animate-[float_20s_ease-in-out_infinite]" style={{ background: 'rgba(168,85,247,0.04)', animationDelay: '7s' }} />
      </div>

      <PullToRefresh onRefresh={() => refetch()}>
        <PageHeader title={t('expenses')} description={`${formatCurrency(totalAmount)} total`}
          action={<Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>} />

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <DateRangeFilter
            fromValue={dateFrom}
            onFromChange={setDateFrom}
            toValue={dateTo}
            onToChange={setDateTo}
            onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
          />
          <div className="flex-1" />
          <ExportButtons data={filtered} filename="expenses" title="Expenses" columns={[
            { label: 'Date', key: 'date' }, { label: 'Category', key: 'category' },
            { label: 'Description', key: 'description' }, { label: 'Amount', key: 'amount' },
            { label: 'Vehicle', key: 'vehicle_plate' }, { label: 'Driver', key: 'driver_name' },
            { label: 'Vendor', key: 'vendor_name' }, { label: 'Status', key: 'status' },
          ]} />
        </div>

        <div className="space-y-3 mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 bg-card border-border h-10" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setFilter(c)} className="px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-all duration-200"
                style={filter === c
                  ? { background: 'rgba(59,130,246,0.20)', border: '1px solid rgba(59,130,246,0.30)', color: '#fff', boxShadow: '0 0 12px rgba(59,130,246,0.15)' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.40)' }}>
                {c === 'all' ? 'All' : c.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {donutData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <ReportSectionCard index={0} color="#a855f7" title="Expense Categories">
              <div className="flex justify-center"><DonutChart data={donutData} total={formatCurrency(donutTotal)} height={200} /></div>
            </ReportSectionCard>
            <ReportSectionCard index={1} color="#f97316" title="Expense Trend">
              <TrendChart data={trendData} series={[{ key: 'amount', name: 'Amount', color: '#f97316' }]} type="line" height={220} />
            </ReportSectionCard>
          </div>
        )}

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState icon={Receipt} title={t('no_data')} description="Add your first expense" />
        ) : (
          <div>
            {filtered.map(exp => {
              const Icon = categoryIcons[exp.category] || Package;
              const color = categoryColors[exp.category] || '#94a3b8';
              return (
                <ReportRowCard
                  key={exp.id}
                  icon={Icon}
                  iconColor={color}
                  title={exp.description || exp.category}
                  subtitle={`${exp.vendor_name || '—'} · ${formatDate(exp.date)}`}
                  onClick={() => { setEditItem(exp); setFormOpen(true); }}
                  accent={color}
                  right={
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white/90 tabular-nums">{formatCurrency(exp.amount)}</p>
                        <div className="flex justify-end mt-0.5"><ReportStatusBadge status={exp.status} /></div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button onClick={e => e.stopPropagation()} className="text-white/40 hover:text-white p-1.5 flex-shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditItem(exp); setFormOpen(true); }} className="text-xs cursor-pointer">
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(exp)} className="text-xs cursor-pointer text-red-400">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  }
                />
              );
            })}
          </div>
        )}
      </PullToRefresh>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.description || deleteTarget?.category}" from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteTarget) { await deleteExpense.mutateAsync(deleteTarget.id); setDeleteTarget(null); } }} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ExpenseFormSheet open={formOpen} onOpenChange={setFormOpen} editItem={editItem} />
    </div>
  );
}

function ExpenseFormSheet({ open, onOpenChange, editItem, onSaved }) {
  const { t } = useI18n();
  const createExpense = useExpenseCreate();
  const updateExpense = useExpenseUpdate();
  const [saving, setSaving] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ category: 'other', description: '', amount: '', date: new Date().toISOString().split('T')[0], vehicle_plate: '', driver_name: '', payment_method: 'cash', vendor_name: '', reference_number: '', notes: '', status: 'pending' });

  useEffect(() => {
    if (editItem) setForm({ ...form, ...editItem, amount: editItem.amount || '' });
    else setForm({ category: 'other', description: '', amount: '', date: new Date().toISOString().split('T')[0], vehicle_plate: '', driver_name: '', payment_method: 'cash', vendor_name: '', reference_number: '', notes: '', status: 'pending' });
  }, [editItem, open]);

  useEffect(() => {
    if (open) {
      Promise.all([
        base44.entities.Driver.list('-created_date', 200).catch(() => []),
        base44.entities.Vehicle.list('-created_date', 200).catch(() => []),
      ]).then(([d, v]) => { setDrivers(d || []); setVehicles(v || []); });
    }
  }, [open]);

  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, amount: Number(form.amount) || 0 };
    if (editItem) await updateExpense.mutateAsync({ id: editItem.id, data });
    else await createExpense.mutateAsync(data);
    setSaving(false); onSaved?.(); onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Expense</SheetTitle></SheetHeader>
        <div className="space-y-4">
          <div><Label className="text-xs text-muted-foreground mb-1.5">Category</Label>
            <Select value={form.category} onValueChange={v => update('category', v)}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>{['fuel','maintenance','toll','salary','insurance','registration','office','other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label className="text-xs text-muted-foreground mb-1.5">{t('description')}</Label><Input value={form.description} onChange={e => update('description', e.target.value)} className="bg-background border-border" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground mb-1.5">{t('amount')}</Label><Input type="number" value={form.amount} onChange={e => update('amount', e.target.value)} className="bg-background border-border" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">{t('date')}</Label><Input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="bg-background border-border" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground mb-1.5">{t('vehicle')}</Label><Input list="veh-suggestions" value={form.vehicle_plate} onChange={e => update('vehicle_plate', e.target.value)} className="bg-background border-border" /><datalist id="veh-suggestions">{vehicles.map(v => <option key={v.id} value={v.plate_number} />)}</datalist></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">{t('driver')}</Label><Input list="drv-suggestions" value={form.driver_name} onChange={e => update('driver_name', e.target.value)} className="bg-background border-border" /><datalist id="drv-suggestions">{drivers.map(d => <option key={d.id} value={d.name} />)}</datalist></div>
          </div>
          <div><Label className="text-xs text-muted-foreground mb-1.5">Vendor</Label><Input value={form.vendor_name} onChange={e => update('vendor_name', e.target.value)} className="bg-background border-border" /></div>
          <div><Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label>
            <Select value={form.status} onValueChange={v => update('status', v)}>
              <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
              <SelectContent>{['pending','approved','rejected'].map(s => <SelectItem key={s} value={s}>{t(s)}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label className="text-xs text-muted-foreground mb-1.5">{t('notes')}</Label><Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} className="bg-background border-border" /></div>
        </div>
        <div className="flex gap-3 mt-8">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-border">{t('cancel')}</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}