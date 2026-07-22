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
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, Search, Receipt, Fuel, Wrench, Car, CreditCard, ShieldCheck, Building, Package, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ExportButtons from '@/components/common/ExportButtons';
import { useSheetUrlState } from '@/hooks/useSheetUrlState';
import PullToRefresh from '@/components/common/PullToRefresh';
import { useExpenses, useExpenseCreate, useExpenseUpdate, useExpenseDelete } from '@/hooks/useEntityQueries';
import DateRangeFilter from '@/components/common/DateRangeFilter';

const CATEGORIES = ['all', 'fuel', 'maintenance', 'toll', 'salary', 'insurance', 'registration', 'office', 'other'];
const categoryIcons = { fuel: Fuel, maintenance: Wrench, toll: Car, salary: CreditCard, insurance: ShieldCheck, registration: Building, office: Building, other: Package };

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
            <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filter === c ? 'bg-primary/15 text-primary border border-primary/20' : 'bg-muted/50 text-muted-foreground border border-transparent'}`}>
              {c === 'all' ? 'All' : c.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title={t('no_data')} description="Add your first expense" />
      ) : (
        <div className="space-y-2">
          {filtered.map(exp => {
            const Icon = categoryIcons[exp.category] || Package;
            return (
              <div key={exp.id} className="w-full text-left glass-card-hover p-4 flex items-center gap-4">
                <div onClick={() => { setEditItem(exp); setFormOpen(true); }} className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{exp.description || exp.category}</p>
                    <p className="text-xs text-muted-foreground">{exp.vendor_name || '—'} · {formatDate(exp.date)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(exp.amount)}</p>
                    <StatusBadge status={exp.status} />
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-foreground p-1.5 flex-shrink-0">
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