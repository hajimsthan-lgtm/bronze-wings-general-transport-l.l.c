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
import { Textarea } from '@/components/ui/textarea';
import EntityFormDialog from '@/components/common/EntityFormDialog';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/formatters';
import { Plus, Search, Receipt, MoreVertical, Pencil, Trash2, Wallet, Clock, CheckCircle2, LayoutGrid, List, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
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
import { useExpensesMode, setExpensesMode } from '@/lib/expensesStore';
import ExpensesAnalytics from '@/components/expenses/ExpensesAnalytics';
import TaxPreview from '@/components/common/TaxPreview';
import VatModeToggle from '@/components/common/VatModeToggle';
import { calcVat } from '@/lib/vatCalc';

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
        {mode === 'analytics' ? (
          <ExpensesAnalytics expenses={filtered} loading={loading} onBrowse={() => setExpensesMode('browse')} />
        ) : (
          <>
        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <EmptyState icon={Receipt} title={t('no_data')} description="Add your first expense" />
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {visExp.map(exp => (
              <ExpenseCard key={exp.id} exp={exp} onEdit={(e) => { setEditItem(e); setFormOpen(true); }} onDelete={setDeleteTarget} />
            ))}
            {hasMoreExp && (
              <div {...expSentinel} className="col-span-full text-center text-xs text-muted-foreground py-4">
                Loading more… ({visE}/{totalE})
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {visExp.map((exp) => {
              const Icon = categoryIcons[exp.category] || categoryIcons.other;
              const color = categoryColors[exp.category] || '#94a3b8';
              return (
                <div key={exp.id} className="row-card row-edge-glow flex items-center gap-3 cursor-pointer group" onClick={() => { setEditItem(exp); setFormOpen(true); }} style={{ ['--row-accent']: color }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(color, 0.14), border: `1px solid ${hexToRgba(color, 0.3)}`, color }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{exp.description || exp.category?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {exp.category?.replace(/_/g, ' ')} · {formatDate(exp.date)}
                      {exp.vendor_name && ` · ${exp.vendor_name}`}
                      {exp.vat_included && <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-[9px] font-semibold uppercase">Incl. VAT</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(exp.total_with_vat || exp.amount)}</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">{exp.vat_included ? 'gross' : 'net'} {formatCurrency(exp.amount).replace(/^AED\s*/, '')}</p>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => { setEditItem(exp); setFormOpen(true); }} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(exp)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {hasMoreExp && (
              <div {...expSentinel} className="text-center text-xs text-muted-foreground py-4">
                Loading more… ({visE}/{totalE})
              </div>
            )}
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
  const [form, setForm] = useState({ category: 'other', description: '', amount: '', vat_included: false, vat_rate: 5, vat_amount: 0, total_with_vat: 0, date: new Date().toISOString().split('T')[0], vehicle_plate: '', driver_name: '', payment_method: 'cash', vendor_name: '', reference_number: '', notes: '', status: 'pending' });

  useEffect(() => {
    if (editItem) setForm({ ...form, ...editItem, amount: editItem.amount || '', vat_included: editItem.vat_included ?? false, vat_rate: editItem.vat_rate ?? 5, vat_amount: editItem.vat_amount || 0, total_with_vat: editItem.total_with_vat || 0 });
    else setForm({ category: 'other', description: '', amount: '', vat_included: false, vat_rate: 5, vat_amount: 0, total_with_vat: 0, date: new Date().toISOString().split('T')[0], vehicle_plate: '', driver_name: '', payment_method: 'cash', vendor_name: '', reference_number: '', notes: '', status: 'pending' });
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
    if (f === 'amount' || f === 'vat_rate' || f === 'vat_included') {
      const { subtotal, vatAmount, total } = calcVat(next.amount, next.vat_rate, next.vat_included);
      next.vat_amount = vatAmount;
      next.total_with_vat = total;
    } else if (f === 'vat_amount') {
      next.total_with_vat = Math.round((Number(next.amount) + (Number(v) || 0)) * 100) / 100;
    }
    return next;
  });

  const handleSave = async () => {
    setSaving(true);
    const data = { ...form, amount: Number(form.amount) || 0, vat_included: !!form.vat_included, vat_rate: Number(form.vat_rate) || 0, vat_amount: Number(form.vat_amount) || 0, total_with_vat: Number(form.total_with_vat) || 0 };
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
          <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">{t('amount')} <span className="text-primary/70">({form.vat_included ? 'incl. VAT' : 'excl. VAT'})</span></Label><Input type="number" value={form.amount} onChange={e => update('amount', e.target.value)} className="bg-background border-border expense-form-input" /></div>
          <VatModeToggle included={form.vat_included} onChange={(v) => update('vat_included', v)} />
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">{t('date')}</Label><Input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="bg-background border-border expense-form-input" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">VAT Rate</Label>
              <Select value={String(form.vat_rate ?? 5)} onValueChange={v => update('vat_rate', Number(v))}>
                <SelectTrigger className="bg-background border-border expense-form-input"><SelectValue /></SelectTrigger>
                <SelectContent>{[0, 5].map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">VAT Amount</Label><Input type="number" step="0.01" value={form.vat_amount} onChange={e => update('vat_amount', e.target.value)} className="bg-background border-border expense-form-input" /></div>
          </div>
          <div><Label className="text-xs text-muted-foreground mb-1.5 expense-form-label">Total (incl. VAT)</Label><Input type="number" step="0.01" value={form.total_with_vat} readOnly className="bg-background border-border font-semibold expense-form-input" /></div>
          <TaxPreview subtotal={form.vat_included ? (Number(form.total_with_vat) - Number(form.vat_amount)) : Number(form.amount) || 0} vatRate={form.vat_rate ?? 5} vatAmount={form.vat_amount || 0} total={form.total_with_vat || 0} included={form.vat_included} />
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