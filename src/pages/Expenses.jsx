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
import { Plus, Search, Receipt, MoreVertical, Pencil, Trash2, Wallet, Clock, CheckCircle2, LayoutGrid, List, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ExportButtons from '@/components/common/ExportButtons';
import { useSheetUrlState } from '@/hooks/useSheetUrlState';
import PullToRefresh from '@/components/common/PullToRefresh';
import { useExpenses, useExpenseCreate, useExpenseUpdate, useExpenseDelete } from '@/hooks/useEntityQueries';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import ReportRowCard from '@/components/reports/ReportRowCard';
import ReportStatusBadge from '@/components/reports/ReportStatusBadge';
import DonutChart from '@/components/reports/DonutChart';
import TrendChart from '@/components/reports/TrendChart';
import { createPortal } from 'react-dom';
import SegmentedToggle from '@/components/operations/SegmentedToggle';
import ExpenseCard from '@/components/expenses/ExpenseCard';
import { EXPENSE_CATEGORIES as CATEGORIES, categoryIcons, categoryColors, hexToRgba } from '@/components/expenses/expenseMeta';

// Category metadata imported from @/components/expenses/expenseMeta
const EXPENSE_EXPORT_COLUMNS = [
  { label: 'Date', key: 'date' }, { label: 'Category', key: 'category' },
  { label: 'Description', key: 'description' }, { label: 'Amount', key: 'amount' },
  { label: 'Vehicle', key: 'vehicle_plate' }, { label: 'Driver', key: 'driver_name' },
  { label: 'Vendor', key: 'vendor_name' }, { label: 'Status', key: 'status' },
];

export default function Expenses() {
  const { t } = useI18n();
  const { data: expenses = [], isLoading: loading, refetch } = useExpenses();
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useSheetUrlState('expense');
  const { dateFrom, dateTo, setDateFrom, setDateTo } = useGlobalDate();
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const deleteExpense = useExpenseDelete();

  useEffect(() => {
    const handler = () => { setEditItem(null); setFormOpen(true); };
    window.addEventListener('expenses:new', handler);
    return () => window.removeEventListener('expenses:new', handler);
  }, [setFormOpen]);

  const filtered = expenses.filter(e => {
    if (filter !== 'all' && e.category !== filter) return false;
    if (e.date < dateFrom || e.date > dateTo) return false;
    if (search) { const q = search.toLowerCase(); return e.description?.toLowerCase().includes(q) || e.vendor_name?.toLowerCase().includes(q); }
    return true;
  });

  const totalAmount = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const pendingCount = filtered.filter((e) => e.status === 'pending').length;
  const approvedCount = filtered.filter((e) => e.status === 'approved').length;
  const analytics = [
    { label: 'Total', value: formatCurrency(totalAmount), icon: Wallet, color: '#f97316' },
    { label: 'Expenses', value: filtered.length, icon: Receipt, color: '#3b82f6' },
    { label: 'Pending', value: pendingCount, icon: Clock, color: '#f59e0b' },
    { label: 'Approved', value: approvedCount, icon: CheckCircle2, color: '#22c55e' },
  ];

  // Category donut
  const catMap = {};
  filtered.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + (e.amount || 0); });
  const donutData = Object.entries(catMap).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value, color: categoryColors[name] || '#94a3b8' })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  // Daily trend
  const days = [];
  { let d = new Date(dateFrom); const end = new Date(dateTo); while (d <= end) { days.push(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 1); } }
  const trendData = days.map((d) => ({ label: formatDateShort(d), amount: filtered.filter((e) => e.date === d).reduce((s, e) => s + (e.amount || 0), 0) }));

  // Portal the expense controls into the sticky sub-head bar slot in TopBar
  const [subBarTarget, setSubBarTarget] = useState(null);
  useEffect(() => { setSubBarTarget(document.getElementById('ops-subbar')); }, []);
  const subBar = subBarTarget && createPortal(
    <div className="border-t border-border/50 pt-2 mt-1 space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="w-full h-11 rounded-xl pl-9 pr-9 text-sm bg-muted/50 border border-border focus-visible:border-primary/40" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
        <div className="flex-1" />
        <SegmentedToggle value={viewMode} onChange={setViewMode} options={[{ value: 'card', label: t('cards_view'), icon: LayoutGrid }, { value: 'list', label: t('list_view'), icon: List }]} />
        <ExportButtons data={filtered} filename="expenses" title="Expenses" columns={EXPENSE_EXPORT_COLUMNS} />
        <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 h-11 px-4"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>
      </div>
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`filter-chip ${filter === c ? 'filter-chip-active' : ''}`}>
            {c !== 'all' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: categoryColors[c] }} />}
            {c === 'all' ? t('all') : c.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
    </div>,
    subBarTarget
  );

  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-24 -left-10 w-[420px] h-[420px] rounded-full blur-[130px] md:animate-[float_20s_ease-in-out_infinite]" style={{ background: 'rgba(249,115,22,0.05)' }} />
        <div className="absolute top-1/3 -right-24 w-[360px] h-[360px] rounded-full blur-[130px] md:animate-[float_20s_ease-in-out_infinite]" style={{ background: 'rgba(168,85,247,0.04)', animationDelay: '7s' }} />
      </div>

      <PullToRefresh onRefresh={() => refetch()}>
        <PageHeader title={t('expenses')} description={`${formatCurrency(totalAmount)} total`} />
        <div className="flex justify-end md:hidden mb-4">
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 h-11 px-4">
            <Plus className="w-4 h-4 mr-1.5" />{t('add_new')}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {analytics.map((a, i) => {
            const Icon = a.icon;
            return (
              <div key={a.label} className="stat-tile p-3.5 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{a.label}</p>
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(a.color, 0.14), border: `1px solid ${hexToRgba(a.color, 0.3)}` }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: a.color }} />
                  </span>
                </div>
                <p className="text-base md:text-lg font-semibold text-foreground mt-1.5 tabular-nums truncate">{a.value}</p>
              </div>
            );
          })}
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
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(exp => (
              <ExpenseCard key={exp.id} exp={exp} onEdit={(e) => { setEditItem(e); setFormOpen(true); }} onDelete={setDeleteTarget} />
            ))}
          </div>
        ) : (
          <div>
            {filtered.map(exp => {
              const Icon = categoryIcons[exp.category] || categoryIcons.other;
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

      {subBar}

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