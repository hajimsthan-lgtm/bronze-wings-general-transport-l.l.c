import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DatePicker from '@/components/common/DatePicker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import EntityFormDialog from '@/components/common/EntityFormDialog';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Plus, Search, Receipt, MoreVertical, Pencil, Trash2, Wallet, Clock, CheckCircle2, LayoutGrid, List, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import '@/lib/expenseFormLight.css';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ExportButtons from '@/components/common/ExportButtons';
import { useSheetUrlState } from '@/hooks/useSheetUrlState';
import PullToRefresh from '@/components/common/PullToRefresh';
import { useExpenses, useExpenseCreate, useExpenseUpdate, useExpenseDelete } from '@/hooks/useEntityQueries';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportRowCard from '@/components/reports/ReportRowCard';
import ReportStatusBadge from '@/components/reports/ReportStatusBadge';
import DonutChart from '@/components/reports/DonutChart';
import TrendChart from '@/components/reports/TrendChart';
import { createPortal } from 'react-dom';
import MobileFAB from '@/components/mobile/MobileFAB';
import SegmentedToggle from '@/components/operations/SegmentedToggle';
import ExpenseCard from '@/components/expenses/ExpenseCard';
import { EXPENSE_CATEGORIES as CATEGORIES, categoryIcons, categoryColors, hexToRgba } from '@/components/expenses/expenseMeta';
import { useProgressiveRender } from '@/hooks/useProgressiveRender';
import { useExpensesMode, setExpensesMode, setExpensesData, setExpensesSelected, clearExpensesSelected } from '@/lib/expensesStore';
import ExpensesAnalytics from '@/components/expenses/ExpensesAnalytics';
import TaxPreview from '@/components/common/TaxPreview';

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
  const mode = useExpensesMode();
  const [selected, setSelected] = useState(new Set());

  const toggleOne = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(s => s.size === filtered.length ? new Set() : new Set(filtered.map(e => e.id)));
  const clearSelection = () => { setSelected(new Set()); clearExpensesSelected(); };

  useEffect(() => {
    const handler = () => { setEditItem(null); setFormOpen(true); };
    window.addEventListener('expenses:new', handler);
    return () => window.removeEventListener('expenses:new', handler);
  }, [setFormOpen]);

  const filtered = expenses.filter(e => {
    if (filter !== 'all' && e.category !== filter) return false;
    if ((dateFrom && e.date < dateFrom) || (dateTo && e.date > dateTo)) return false;
    if (search) { const q = search.toLowerCase(); return e.description?.toLowerCase().includes(q) || e.vendor_name?.toLowerCase().includes(q); }
    return true;
  });

  useEffect(() => { setExpensesData(filtered); }, [filtered]);
  useEffect(() => { setExpensesSelected(Array.from(selected)); }, [selected]);

  const { visible: visExp, sentinelProps: expSentinel, hasMore: hasMoreExp, visibleCount: visE, totalCount: totalE } = useProgressiveRender(filtered);
  const totalAmount = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const pendingCount = filtered.filter((e) => e.status === 'pending').length;
  const approvedCount = filtered.filter((e) => e.status === 'approved').length;
  const analytics = [
    { label: 'Total', value: totalAmount, format: formatCurrency, icon: Wallet, color: '#f97316' },
    { label: 'Expenses', value: filtered.length, icon: Receipt, color: '#00f2c3' },
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
  { const _cf = dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]; const _ct = dateTo || new Date().toISOString().split('T')[0]; let d = new Date(_cf); const end = new Date(_ct); while (d <= end) { days.push(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 1); } }
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
        <div className="flex-1" />
        <SegmentedToggle value={viewMode} onChange={setViewMode} options={[{ value: 'card', label: t('cards_view'), icon: LayoutGrid }, { value: 'list', label: t('list_view'), icon: List }]} />
        {selected.size > 0 && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-xs font-semibold text-primary">{selected.size} selected</span>
            <button onClick={clearSelection} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
          </div>
        )}
        <ExportButtons data={selected.size > 0 ? filtered.filter(e => selected.has(e.id)) : filtered} filename="expenses" title="Expenses" columns={EXPENSE_EXPORT_COLUMNS} />
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
        {mode === 'analytics' ? (
          <ExpensesAnalytics expenses={filtered} loading={loading} onBrowse={() => setExpensesMode('browse')} />
        ) : (
          <>
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 search-2026 h-10" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState icon={Receipt} title={t('no_data')} description="Add your first expense" />
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {visExp.map(exp => (
              <div key={exp.id} className="relative">
                <div className={cn('absolute top-2 left-2 z-10 rounded p-0.5 transition-opacity', selected.has(exp.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')} onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selected.has(exp.id)} onCheckedChange={() => toggleOne(exp.id)} className="border-border/60 bg-background/80 backdrop-blur-sm" />
                </div>
                <ExpenseCard exp={exp} onEdit={(e) => { setEditItem(e); setFormOpen(true); }} onDelete={setDeleteTarget} />
              </div>
            ))}
            {hasMoreExp && (
              <div {...expSentinel} className="col-span-full text-center text-xs text-muted-foreground py-4">
                Loading more… ({visE}/{totalE})
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-background/40">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary/5 text-left text-muted-foreground">
                    <th className="px-4 py-3 w-10"><Checkbox checked={filtered.length > 0 && selected.size === filtered.length} onCheckedChange={toggleAll} className="border-border/60" /></th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Description</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visExp.map((exp) => {
                    const Icon = categoryIcons[exp.category] || categoryIcons.other;
                    const color = categoryColors[exp.category] || '#94a3b8';
                    return (
                      <tr key={exp.id} className={cn('border-t border-border group hover:bg-primary/5 transition-colors', selected.has(exp.id) && 'bg-primary/[0.07]')}>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><Checkbox checked={selected.has(exp.id)} onCheckedChange={() => toggleOne(exp.id)} className="border-border/60" /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0" style={{ background: hexToRgba(color, 0.14), border: `1px solid ${hexToRgba(color, 0.3)}`, color }}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{exp.description || exp.category}</p>
                              {exp.vendor_name && <p className="text-xs text-muted-foreground truncate">{exp.vendor_name}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 capitalize text-muted-foreground">{exp.category?.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(exp.date)}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap" style={{ color: '#f97316' }}>- {formatCurrency(exp.amount).replace(/^AED\s*/, '')}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditItem(exp); setFormOpen(true); }} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg transition-colors" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteTarget(exp)} className="text-muted-foreground hover:text-red-400 p-1.5 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {hasMoreExp && (
                   <tr {...expSentinel}>
                     <td colSpan={5} className="text-center text-xs text-muted-foreground py-3">
                       Loading more… ({visE}/{totalE})
                     </td>
                   </tr>
                  )}
                  </tbody>
                  </table>
            </div>
          </div>
        )}
          </>
        )}
      </PullToRefresh>

      {mode === 'browse' && subBar}

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
      <MobileFAB icon={Plus} onClick={() => { setEditItem(null); setFormOpen(true); }} label="Add Expense" />
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
  const [form, setForm] = useState({ category: 'other', description: '', amount: '', vat_rate: 5, vat_amount: 0, total_with_vat: 0, date: new Date().toISOString().split('T')[0], vehicle_plate: '', driver_name: '', payment_method: 'cash', vendor_name: '', reference_number: '', notes: '', status: 'pending' });

  useEffect(() => {
    if (editItem) setForm({ ...form, ...editItem, amount: editItem.amount || '', vat_rate: editItem.vat_rate ?? 5, vat_amount: editItem.vat_amount || 0, total_with_vat: editItem.total_with_vat || 0 });
    else setForm({ category: 'other', description: '', amount: '', vat_rate: 5, vat_amount: 0, total_with_vat: 0, date: new Date().toISOString().split('T')[0], vehicle_plate: '', driver_name: '', payment_method: 'cash', vendor_name: '', reference_number: '', notes: '', status: 'pending' });
  }, [editItem, open]);

  useEffect(() => {
    if (open) {
      Promise.all([
        base44.entities.Driver.list('-created_date', 200).catch(() => []),
        base44.entities.Vehicle.list('-created_date', 200).catch(() => []),
      ]).then(([d, v]) => { setDrivers(d || []); setVehicles(v || []); });
    }
  }, [open]);

  const update = (f, v) => setForm(prev => {
    const next = { ...prev, [f]: v };
    const sub = Number(next.amount) || 0;
    const rate = Number(next.vat_rate) || 0;
    if (f === 'amount' || f === 'vat_rate') {
      next.vat_amount = Math.round(sub * (rate / 100) * 100) / 100;
      next.total_with_vat = Math.round((sub + next.vat_amount) * 100) / 100;
    } else if (f === 'vat_amount') {
      next.total_with_vat = Math.round((sub + (Number(v) || 0)) * 100) / 100;
    }
    return next;
  });

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, amount: Number(form.amount) || 0, vat_rate: Number(form.vat_rate) || 0, vat_amount: Number(form.vat_amount) || 0, total_with_vat: Number(form.total_with_vat) || 0 };
    if (editItem) await updateExpense.mutateAsync({ id: editItem.id, data });
    else await createExpense.mutateAsync(data);
    setSaving(false); onSaved?.(); onOpenChange(false);
  };

  return (
    <EntityFormDialog open={open} onOpenChange={onOpenChange} icon={Receipt} title={`${editItem ? t('edit') : t('add_new')} Expense`} subtitle="Record a new expense transaction">
        <div className="space-y-4 expense-form-fields">
          <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">Category</Label>
            <Select value={form.category} onValueChange={v => update('category', v)}>
              <SelectTrigger className="bg-background border-border expense-form-input"><SelectValue /></SelectTrigger>
              <SelectContent>{['toll','insurance','registration','office','other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select></div>
          <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">{t('description')}</Label><Input value={form.description} onChange={e => update('description', e.target.value)} className="bg-background border-border expense-form-input" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">{t('amount')}</Label><Input type="number" value={form.amount} onChange={e => update('amount', e.target.value)} className="bg-background border-border expense-form-input" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">{t('date')}</Label><DatePicker value={form.date} onChange={v => update('date', v)} className="bg-background border-border expense-form-input" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">VAT Rate</Label>
              <Select value={String(form.vat_rate ?? 5)} onValueChange={v => update('vat_rate', Number(v))}>
                <SelectTrigger className="bg-background border-border expense-form-input"><SelectValue /></SelectTrigger>
                <SelectContent>{[0, 5].map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">VAT Amount</Label><Input type="number" step="0.01" value={form.vat_amount} onChange={e => update('vat_amount', e.target.value)} className="bg-background border-border expense-form-input" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">Total (incl. VAT)</Label><Input type="number" step="0.01" value={form.total_with_vat} readOnly className="bg-background border-border font-semibold expense-form-input" /></div>
          </div>
          <TaxPreview subtotal={Number(form.amount) || 0} vatRate={form.vat_rate ?? 5} vatAmount={form.vat_amount || 0} total={form.total_with_vat || 0} />
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">{t('vehicle')}</Label><Input list="veh-suggestions" value={form.vehicle_plate} onChange={e => update('vehicle_plate', e.target.value)} className="bg-background border-border expense-form-input" /><datalist id="veh-suggestions">{vehicles.map(v => <option key={v.id} value={v.plate_number} />)}</datalist></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">{t('driver')}</Label><Input list="drv-suggestions" value={form.driver_name} onChange={e => update('driver_name', e.target.value)} className="bg-background border-border expense-form-input" /><datalist id="drv-suggestions">{drivers.map(d => <option key={d.id} value={d.name} />)}</datalist></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">Vendor</Label><Input value={form.vendor_name} onChange={e => update('vendor_name', e.target.value)} className="bg-background border-border expense-form-input" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">Payment Method</Label>
              <Select value={form.payment_method} onValueChange={v => update('payment_method', v)}>
                <SelectTrigger className="bg-background border-border expense-form-input"><SelectValue /></SelectTrigger>
                <SelectContent>{['cash','bank_transfer','credit_card','cheque'].map(m => <SelectItem key={m} value={m}>{m.replace('_',' ')}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">Reference #</Label><Input value={form.reference_number} onChange={e => update('reference_number', e.target.value)} placeholder="e.g. INV-2026-001" className="bg-background border-border expense-form-input" /></div>
          <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">{t('notes')}</Label><Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} className="bg-background border-border expense-form-input" /></div>
        </div>
        <div className="flex gap-3 mt-8">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-border">{t('cancel')}</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button>
        </div>
    </EntityFormDialog>
  );
}