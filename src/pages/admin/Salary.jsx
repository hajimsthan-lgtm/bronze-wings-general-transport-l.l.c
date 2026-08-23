import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import ExportButtons from '@/components/common/ExportButtons';
import ReportStatCard from '@/components/reports/ReportStatCard';
import SalaryFormSheet from '@/components/salary/SalaryFormSheet';
import EntityFormDialog from '@/components/common/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadPayslipPDF } from '@/lib/payslipHtml';
import { Plus, Wallet, CheckCircle2, Clock, Sparkles, Pencil, Download, Trash2, CheckCircle, Search, CreditCard, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';
import { safeListAll, withRetry } from '@/lib/safeRequest';
import MobileFAB from '@/components/mobile/MobileFAB';
import ResponsiveStats from '@/components/mobile/ResponsiveStats';
import ResponsiveLoading from '@/components/mobile/ResponsiveLoading';
import { useProgressiveRender } from '@/hooks/useProgressiveRender';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Salary() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [driverMap, setDriverMap] = useState({});
  const [settings, setSettings] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [prefillDriver, setPrefillDriver] = useState('');
  const [generating, setGenerating] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Filters
  const now = new Date();
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState(MONTHS[now.getMonth()]);
  const [yearFilter, setYearFilter] = useState(String(now.getFullYear()));
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [r, d, s] = await safeListAll([
      () => base44.entities.SalaryRecord.list('-created_date', 200).catch(() => []),
      () => base44.entities.Driver.list('-created_date', 200).catch(() => []),
      () => getCompanySettings()]
      );
      setRecords(r || []);
      setDrivers(d || []);
      setDriverMap(Object.fromEntries((d || []).map((x) => [x.name, x.id])));
      setSettings(s || {});
    } finally {setLoading(false);}
  };
  useEffect(() => {load();}, []);

  useEffect(() => {
    const handler = () => {setEditItem(null);setPrefillDriver('');setFormOpen(true);};
    window.addEventListener('salary:new', handler);
    return () => window.removeEventListener('salary:new', handler);
  }, []);

  const years = useMemo(() => {
    const set = new Set(records.map((r) => String(r.year)));
    set.add(String(now.getFullYear()));
    return [...set].sort((a, b) => Number(b) - Number(a));
  }, [records]);

  const filtered = useMemo(() => records.filter((r) => {
    if (search && !r.driver_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (monthFilter && r.month !== monthFilter) return false;
    if (yearFilter && String(r.year) !== yearFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  }), [records, search, monthFilter, yearFilter, statusFilter]);

  const { visible: visSalary, sentinelProps: salSentinel, hasMore: hasMoreSalary, visibleCount: visS, totalCount: totalS } = useProgressiveRender(filtered);

  const totalPayroll = filtered.reduce((s, r) => s + (Number(r.net_salary) || 0), 0);
  const totalPaid = filtered.filter((r) => r.status === 'paid').reduce((s, r) => s + (Number(r.net_salary) || 0), 0);
  const totalPending = filtered.filter((r) => r.status !== 'paid').reduce((s, r) => s + (Number(r.net_salary) || 0), 0);

  const generatePayroll = async () => {
    const month = monthFilter || MONTHS[now.getMonth()];
    const year = Number(yearFilter || now.getFullYear());
    const existing = new Set(records.filter((r) => r.month === month && Number(r.year) === year).map((r) => r.driver_name));
    const eligible = drivers.filter((d) => (d.status || 'active') !== 'inactive' && !existing.has(d.name));
    if (eligible.length === 0) {alert(`All active drivers already have a salary record for ${month} ${year}.`);return;}
    setGenerating(true);
    try {
      // Auto-apply active installment deductions (FIFO) for each driver
      const toCreate = [];
      for (const d of eligible) {
        const { total: deducted, breakdown } = await applyDeductions(d.name, null);
        await new Promise((r) => setTimeout(r, 200)); // breather between drivers to avoid rate-limit bursts
        toCreate.push({
          driver_name: d.name,
          month,
          year,
          base_salary: Number(d.base_salary) || 0,
          overtime: 0,
          bonus: 0,
          deductions: deducted,
          net_salary: (Number(d.base_salary) || 0) - deducted,
          status: 'pending',
          payment_method: 'bank_transfer',
          notes: '',
          applied_deductions: breakdown
        });
      }
      await base44.entities.SalaryRecord.bulkCreate(toCreate);
      load();
    } finally {setGenerating(false);}
  };

  const markPaid = async (rec) => {
    setBusyId(rec.id);
    try {
      await base44.entities.SalaryRecord.update(rec.id, {
        status: 'paid',
        payment_date: rec.payment_date || new Date().toISOString().split('T')[0]
      });
      load();
    } finally {setBusyId(null);}
  };

  const remove = async (rec) => {
    if (!window.confirm(`Delete salary record for ${rec.driver_name} (${rec.month} ${rec.year})?`)) return;
    setBusyId(rec.id);
    try {await base44.entities.SalaryRecord.delete(rec.id);load();} finally {setBusyId(null);}
  };

  const payslip = async (rec) => {
    const drv = drivers.find((d) => d.name === rec.driver_name) || {};
    await downloadPayslipPDF(rec, drv, settings);
  };

  // Apply installment deductions (FIFO by issue_date) — reduces remaining_balance by the
  // (editable) amount, recomputes months_left, marks completed when fully paid.
  // selectedItems: null = all active (monthly_deduction); or [{id, amount}].
  // Returns { total, breakdown }.
  const applyDeductions = async (driverName, selectedItems) => {
    const all = await withRetry(() => base44.entities.DriverDeduction.filter({ driver_name: driverName, status: 'active' })).catch(() => []);
    const sorted = (all || []).
    filter((d) => Number(d.remaining_balance) > 0).
    sort((a, b) => (a.issue_date || '').localeCompare(b.issue_date || ''));
    const items = !selectedItems ?
    sorted.map((d) => ({ id: d.id, amount: 0 })) :
    selectedItems;
    let total = 0;
    const breakdown = [];
    for (const it of items) {
      const d = (all || []).find((x) => x.id === it.id);
      if (!d) continue;
      const amt = Math.min(Number(it.amount) || 0, Number(d.remaining_balance) || 0);
      if (amt <= 0) continue;
      const newRemaining = Math.max(0, (Number(d.remaining_balance) || 0) - amt);
      const newMonthsLeft = 0;
      const newStatus = newRemaining <= 0 ? 'completed' : 'active';
      await withRetry(() => base44.entities.DriverDeduction.update(d.id, {
        remaining_balance: newRemaining,
        months_left: newMonthsLeft,
        status: newStatus
      }));
      total += amt;
      breakdown.push({ description: d.description || d.type, type: d.type, amount: amt });
    }
    return { total, breakdown };
  };

  const exportColumns = [
  { label: 'Driver', key: 'driver_name' },
  { label: 'Month', key: 'month' },
  { label: 'Year', key: 'year' },
  { label: 'Base', key: 'base_salary' },
  { label: 'Overtime', key: 'overtime' },
  { label: 'Bonus', key: 'bonus' },
  { label: 'Deductions', key: 'deductions' },
  { label: 'Net', key: 'net_salary' },
  { label: 'Status', key: 'status' },
  { label: 'Method', key: 'payment_method' },
  { label: 'Paid On', key: 'payment_date' }];


  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground hidden">Salary & Payroll</h1>
          <p className="text-sm text-muted-foreground hidden">{filtered.length} records · {monthFilter || 'All months'} {yearFilter}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ExportButtons data={filtered} filename="salary_records" title="Salary Records" columns={exportColumns} />
          <Button onClick={generatePayroll} disabled={generating} variant="outline" className="h-10 border-border">
            <Sparkles className="w-4 h-4 mr-1.5 text-amber-400" />{generating ? 'Generating…' : 'Generate Payroll'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search driver…" className="bg-input border-border pl-9" />
        </div>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="bg-input border-border w-[150px]"><SelectValue placeholder="Month" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Months</SelectItem>
            {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="bg-input border-border w-[110px]"><SelectValue placeholder="Year" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Years</SelectItem>
            {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-input border-border w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>All Status</SelectItem>
            {['pending', 'paid', 'partial'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || monthFilter || yearFilter || statusFilter) &&
        <Button variant="ghost" size="sm" onClick={() => {setSearch('');setMonthFilter('');setYearFilter('');setStatusFilter('');}} className="text-muted-foreground">Clear</Button>
        }
      </div>

      {/* KPIs */}
      <ResponsiveStats
        stats={[
        { label: 'Total Payroll', value: totalPayroll, format: formatCurrency, icon: Wallet, color: '#38BDF8' },
        { label: t('paid'), value: totalPaid, format: formatCurrency, icon: CheckCircle2, color: '#22c55e' },
        { label: t('pending'), value: totalPending, format: formatCurrency, icon: Clock, color: '#f59e0b' },
        { label: 'Records', value: filtered.length, format: (v) => String(v), icon: CreditCard, color: '#a855f7' }]
        }
        desktopGridClass="md:grid-cols-2 lg:grid-cols-4"
        className="mb-5" />
      

      {/* List */}
      {loading ? <ResponsiveLoading type="list" count={4} /> : filtered.length === 0 ?
      <EmptyState icon={Wallet} title={t('no_data')} description="Generate payroll for the selected month or add a salary record manually." /> :

      <div className="space-y-2">
           {visSalary.map((r) =>
        <div key={r.id} className="row-card flex items-start gap-3 min-h-[56px]">
               <div className="w-10 h-10 rounded-lg entity-avatar flex items-center justify-center flex-shrink-0">
                 <Wallet className="w-4 h-4 text-white/70" />
               </div>
               <div className="flex-1 min-w-0 pt-0.5">
                 {driverMap[r.driver_name] ?
            <Link to={`/admin/drivers/${driverMap[r.driver_name]}`} className="text-sm font-medium text-foreground hover:text-[#38BDF8] transition-colors hover:underline">{r.driver_name}</Link> :
            <p className="text-sm font-medium text-foreground">{r.driver_name}</p>}
                 <p className="text-xs text-muted-foreground truncate">
                   {r.month} {r.year} · {(r.payment_method || '').replace(/_/g, ' ')}
                   {r.payment_date ? ` · paid ${formatDate(r.payment_date)}` : ''}
                 </p>
                 {r.applied_deductions?.length > 0 &&
            <p className="text-[10px] text-muted-foreground/70 truncate">Deductions: {r.applied_deductions.map((d) => `${d.description} ${formatCurrency(d.amount)}`).join(' · ')}</p>
            }
               </div>
               <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground mr-2">
                 <span title="Base">{formatCurrency(r.base_salary)}</span>
                 <span title="Overtime" className="text-emerald-400/80">+{formatCurrency(r.overtime)}</span>
                 <span title="Deductions" className="text-red-400/80">-{formatCurrency(r.deductions)}</span>
               </div>
               <div className="text-right flex-shrink-0 pt-0.5">
                 <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(r.net_salary)}</p>
                 <StatusBadge status={r.status} />
               </div>
               <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                 {r.status !== 'paid' &&
            <button title="Mark Paid" onClick={() => markPaid(r)} disabled={busyId === r.id} className="p-2 rounded-lg hover:bg-emerald-500/15 text-emerald-400 transition-colors disabled:opacity-50">
                     <CheckCircle className="w-4 h-4" />
                   </button>
            }
                 <button title="Download Payslip" onClick={() => payslip(r)} className="p-2 rounded-lg hover:bg-primary/15 text-[#38BDF8] transition-colors">
                   <Download className="w-4 h-4" />
                 </button>
                 <button title="Edit" onClick={() => {setEditItem(r);setPrefillDriver('');setFormOpen(true);}} className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors">
                   <Pencil className="w-4 h-4" />
                 </button>
                 <button title="Delete" onClick={() => remove(r)} disabled={busyId === r.id} className="p-2 rounded-lg hover:bg-red-500/15 text-red-400 transition-colors disabled:opacity-50">
                   <Trash2 className="w-4 h-4" />
                 </button>
               </div>
               <div className="sm:hidden flex-shrink-0">
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <button className="p-2 -mr-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
                       <MoreVertical className="w-4 h-4" />
                     </button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end" className="bg-card border-border">
                     {r.status !== 'paid' &&
                <DropdownMenuItem onClick={() => markPaid(r)} disabled={busyId === r.id}>Mark Paid</DropdownMenuItem>
                }
                     <DropdownMenuItem onClick={() => payslip(r)}>Download Payslip</DropdownMenuItem>
                     <DropdownMenuItem onClick={() => {setEditItem(r);setPrefillDriver('');setFormOpen(true);}}>Edit</DropdownMenuItem>
                     <DropdownMenuItem onClick={() => remove(r)} className="text-red-400">Delete</DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
               </div>
             </div>
        )}
             {hasMoreSalary &&
        <div {...salSentinel} className="text-center text-xs text-muted-foreground py-4">
              Loading more… ({visS}/{totalS})
             </div>
        }
             </div>
      }

      {/* Form Dialog */}
      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen} icon={Wallet} title={`${editItem ? t('edit') : t('add_new')} Salary`} subtitle="Create or edit a salary record">
        <SalaryFormSheet
          editItem={editItem}
          prefillDriver={prefillDriver}
          onSave={async (data) => {
            const { applied_deductions = [], ...salaryData } = data;
            const breakdown = applied_deductions.map(({ description, type, amount }) => ({ description, type, amount }));
            let rec;
            if (editItem) {rec = await base44.entities.SalaryRecord.update(editItem.id, { ...salaryData, applied_deductions: breakdown });} else
            {rec = await base44.entities.SalaryRecord.create({ ...salaryData, applied_deductions: breakdown });}
            if (applied_deductions.length > 0) {
              await applyDeductions(salaryData.driver_name, applied_deductions);
            }
            load();
            setFormOpen(false);
            return rec;
          }}
          onCancel={() => setFormOpen(false)} />
        
      </EntityFormDialog>
      <MobileFAB icon={Plus} onClick={() => {setEditItem(null);setPrefillDriver('');setFormOpen(true);}} label="Add Salary" />
    </div>);

}