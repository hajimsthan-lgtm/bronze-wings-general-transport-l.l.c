import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityDetailHeader from '@/components/admin/EntityDetailHeader';
import DocumentsSection from '@/components/admin/DocumentsSection';
import DriverProfileCard from '@/components/admin/DriverProfileCard';
import ContractsSection from '@/components/contracts/ContractsSection';
import StatusBadge from '@/components/common/StatusBadge';
import DetailSkeleton from '@/components/detail/DetailMotion';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import BreakdownDialog from '@/components/common/BreakdownDialog';
import CollapsibleSection from '@/components/common/CollapsibleSection';
import TabTableCard from '@/components/admin/TabTableCard';
import RecordSectionCard from '@/components/common/RecordSectionCard';
import RecordsViewerSheet from '@/components/common/RecordsViewerSheet';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { exportToPDF } from '@/lib/exportUtils';
import { downloadPayslipPDF } from '@/lib/payslipHtml';
import { getCompanySettings } from '@/lib/companySettings';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import { safeAll } from '@/lib/safeRequest';
import { Inbox, Wallet as WalletIcon, Receipt as ReceiptIcon, FileDown, FileText, Truck, Pencil, Plus } from 'lucide-react';
import SalaryFormSheet from '@/components/salary/SalaryFormSheet';
import ExpenseFormSheet from '@/components/expenses/ExpenseFormSheet';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import WeeklyActivityChart from '@/components/drivers/WeeklyActivityChart';
import HoursGauge from '@/components/drivers/HoursGauge';
import DriverOvertimeCard from '@/components/drivers/DriverOvertimeCard';
import DriverOutstandingPayments from '@/components/drivers/DriverOutstandingPayments';
import DriverDeductionsSection from '@/components/drivers/DriverDeductionsSection';
import { formatCurrency, formatDate } from '@/lib/formatters';

const yearsSince = (d) =>
  d ? Math.max(0, Math.floor((Date.now() - new Date(d)) / (365.25 * 86400000))) : 0;

export default function DriverDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const expandDocs = searchParams.get('expand') === 'documents';
  const flashDocId = searchParams.get('doc');
  const { t } = useI18n();
  const { toast } = useToast();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { dateFrom, dateTo } = useGlobalDate();
  const [breakdown, setBreakdown] = useState(null);
  const [salaryBusyId, setSalaryBusyId] = useState(null);
  const [salaryMonth, setSalaryMonth] = useState('all');
  const [companySettings, setCompanySettings] = useState({});
  const [payslipBusyId, setPayslipBusyId] = useState(null);
  const [viewer, setViewer] = useState(null);
  const [salaryFormOpen, setSalaryFormOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [expenseEdit, setExpenseEdit] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities.Driver.get(id).then(async (d) => {
      if (cancelled) return;
      setDriver(d);
      setLoading(false);
      setDataLoading(true);
      try {
        const [tR, sR, eR, vR] = await safeAll([
          () => base44.entities.Trip.filter({ driver_name: d.name }).catch(() => []),
          () => base44.entities.SalaryRecord.filter({ driver_name: d.name }).catch(() => []),
          () => base44.entities.Expense.filter({ driver_name: d.name }).catch(() => []),
          () => d.assigned_vehicle ? base44.entities.Vehicle.filter({ plate_number: d.assigned_vehicle }).catch(() => []) : Promise.resolve([]),
        ], 2);
        if (cancelled) return;
        setTrips(tR || []);
        setSalaries(sR || []);
        setExpenses(eR || []);
        setVehicle(vR && vR[0] || null);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }).catch(() => {if (!cancelled) setLoading(false);});
    return () => {cancelled = true;};
  }, [id]);

  useEffect(() => {getCompanySettings().then(setCompanySettings).catch(() => {});}, []);

  if (loading) return <DetailSkeleton />;
  if (!driver) return <EmptyState title="Driver not found" />;

  const fTrips = trips.filter((tt) => !tt.trip_date || ((!dateFrom || tt.trip_date >= dateFrom) && (!dateTo || tt.trip_date <= dateTo)));
  const fSalaries = salaries.filter((r) => (!r.payment_date || ((!dateFrom || r.payment_date >= dateFrom) && (!dateTo || r.payment_date <= dateTo))) && (salaryMonth === 'all' || r.month === salaryMonth));
  const fExpenses = expenses.filter((r) => !r.date || ((!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo)));

  const totalTrips = fTrips.reduce((s, x) => s + (Number(x.revenue) || 0), 0);
  const totalExpenses = fExpenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const totalSalary = fSalaries.reduce((s, x) => s + (Number(x.net_salary) || 0), 0);
  const netProfit = totalTrips - totalExpenses - totalSalary;
  const avgPerTrip = fTrips.length ? totalTrips / fTrips.length : 0;
  const expYears = yearsSince(driver.join_date);
  const totalHours = fTrips.reduce((s, x) => s + (Number(x.hours) || Number(x.calculated_duration) || 0), 0);

  const saveDriver = async (patch) => {
    const updated = await base44.entities.Driver.update(driver.id, patch);
    setDriver(updated);
    toast({ title: 'Driver updated' });
  };

  const reloadSalaries = () => base44.entities.SalaryRecord.filter({ driver_name: driver.name }).then(setSalaries).catch(() => {});
  const reloadExpenses = () => base44.entities.Expense.filter({ driver_name: driver.name }).then(setExpenses).catch(() => {});
  const markPaid = async (rec) => {
    setSalaryBusyId(rec.id);
    try {
      await base44.entities.SalaryRecord.update(rec.id, { status: 'paid', payment_date: rec.payment_date || new Date().toISOString().split('T')[0] });
      reloadSalaries();
    } finally {setSalaryBusyId(null);}
  };

  const downloadPayslip = async (rec) => {
    setPayslipBusyId(rec.id);
    try {
      await downloadPayslipPDF(rec, driver, companySettings);
    } catch {
      toast({ title: 'Payslip download failed', variant: 'destructive' });
    } finally {setPayslipBusyId(null);}
  };

  const salaryPdf = () => exportToPDF(
    fSalaries.map((r) => ({ period: `${r.month} ${r.year}`, base: r.base_salary, additions: (r.overtime || 0) + (r.bonus || 0), deductions: r.deductions, net: r.net_salary, status: r.status })),
    `driver-${driver.name}-salary`,
    [{ label: 'Period', key: 'period' }, { label: 'Base', key: 'base', numeric: true }, { label: 'Additions', key: 'additions', numeric: true }, { label: 'Deductions', key: 'deductions', numeric: true }, { label: 'Net', key: 'net', numeric: true }, { label: 'Status', key: 'status' }],
    `Salary Records — ${driver.name}`,
    { dateRange: `${dateFrom} to ${dateTo}` }
  );

  const expensesPdf = () => exportToPDF(
    fExpenses.map((r) => ({ date: r.date, category: r.category, description: r.description || '', amount: r.amount, status: r.status })),
    `driver-${driver.name}-expenses`,
    [{ label: 'Date', key: 'date' }, { label: 'Category', key: 'category' }, { label: 'Description', key: 'description' }, { label: 'Amount', key: 'amount', numeric: true }, { label: 'Status', key: 'status' }],
    `Expenses — ${driver.name}`,
    { dateRange: `${dateFrom} to ${dateTo}` }
  );

  const viewerConfig = {
    salary: {
      title: 'Salary Records', icon: WalletIcon, accent: '#10b981', records: fSalaries, dateField: 'payment_date',
      filename: `driver-${driver.name}-salary`,
      columns: [
        { label: 'Period', key: 'period' },
        { label: 'Net', key: 'net_salary', numeric: true },
        { label: 'Status', key: 'status' },
      ],
      renderRow: (rec) => (
        <div key={rec.id} className="rounded-xl p-3 border flex items-center gap-3" style={{ background: hexToRgba('#10b981', 0.06), borderColor: hexToRgba('#10b981', 0.18) }}>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{rec.month} {rec.year}</p>
            <p className="text-xs text-muted-foreground">{formatDate(rec.payment_date)} · <span className="capitalize">{rec.status}</span></p>
            {rec.applied_deductions?.length > 0 && (
              <p className="text-[10px] text-muted-foreground/70 truncate">Deductions: {rec.applied_deductions.map((d) => `${d.description} ${formatCurrency(d.amount)}`).join(' · ')}</p>
            )}
            </div>
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(rec.net_salary)}</span>
          <Button size="sm" variant="ghost" disabled={payslipBusyId === rec.id} onClick={() => downloadPayslip(rec)} className="h-7 px-2 text-muted-foreground hover:text-primary" title="Download payslip"><FileDown className="w-3.5 h-3.5" /></Button>
        </div>
      ),
    },
    expenses: {
      title: 'Expenses', icon: ReceiptIcon, accent: '#f43f5e', records: fExpenses, dateField: 'date',
      filename: `driver-${driver.name}-expenses`,
      columns: [
        { label: 'Date', key: 'date' },
        { label: 'Category', key: 'category' },
        { label: 'Description', key: 'description' },
        { label: 'Amount', key: 'amount', numeric: true },
        { label: 'Status', key: 'status' },
      ],
    },
  };

  return (
    <div className="detail-page space-y-4 max-w-[1600px] mx-auto w-full overflow-x-hidden">
      <EntityDetailHeader
        title={driver.name}
        subtitle="Transport Driver"
        badge={<StatusBadge status={driver.status} />}
        backTo="/admin/drivers"
      />

      {/* Grid: profile (left) | sections (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
        <DriverProfileCard driver={driver} vehicle={vehicle} stats={{ trips: fTrips.length, revenue: totalTrips, avgPerTrip, experience: `${expYears} yr${expYears === 1 ? '' : 's'}`, expenses: totalExpenses, salary: totalSalary, netProfit }} onSave={saveDriver} />
        <div className="space-y-4">
          {/* Trips */}
          <CollapsibleSection title="Trips" icon={Truck} accent="#1ED760" count={fTrips.length}>
            {dataLoading ? <LoadingSpinner /> : fTrips.length === 0 ? <EmptyState icon={Truck} title={t('no_data')} /> : (
              <div className="space-y-2 max-h-[440px] overflow-y-auto thin-scroll pr-1">
                {fTrips.map((trip) => (
                  <div key={trip.id} className="row-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 18px -6px rgba(var(--panel-accent-rgb),0.35)' }}><Truck className="w-4 h-4 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{trip.from_location} → {trip.to_location}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(trip.trip_date)} · {trip.trip_number || trip.id.slice(0, 6)}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">{formatCurrency(trip.revenue)}</span>
                    <StatusBadge status={trip.status} />
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Contracts */}
          <ContractsSection filter={{ driver_name: driver.name }} />

          {/* Outstanding Payments */}
          <CollapsibleSection title="Outstanding Payments" icon={WalletIcon} accent="#f59e0b" count={salaries.filter(s => s.status !== 'paid').length}>
            <DriverOutstandingPayments salaries={salaries} onMarkPaid={markPaid} busyId={salaryBusyId} />
          </CollapsibleSection>

          {/* Salary Records */}
          <CollapsibleSection title="Salary Records" icon={WalletIcon} accent="#10b981" count={fSalaries.length} actions={
            <>
              <button onClick={() => setSalaryFormOpen(true)} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="Add salary"><Plus className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewer('salary')} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="View all"><Inbox className="w-3.5 h-3.5" /></button>
              <button onClick={salaryPdf} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="Export PDF"><FileText className="w-3.5 h-3.5" /></button>
            </>
          }>
            {dataLoading ? <LoadingSpinner /> : fSalaries.length === 0 ? <EmptyState icon={WalletIcon} title={t('no_data')} /> : (
              <div className="space-y-2 max-h-[440px] overflow-y-auto thin-scroll pr-1">
                {fSalaries.map((rec) => (
                  <div key={rec.id} className="row-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 18px -6px rgba(16,185,129,0.35)' }}><WalletIcon className="w-4 h-4 text-emerald-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{rec.month} {rec.year}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(rec.payment_date)} · <span className="capitalize">{rec.status}</span></p>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">{formatCurrency(rec.net_salary)}</span>
                    <StatusBadge status={rec.status} />
                    <button onClick={() => downloadPayslip(rec)} disabled={payslipBusyId === rec.id} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="Download payslip"><FileDown className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Expenses */}
          <CollapsibleSection title="Expenses" icon={ReceiptIcon} accent="#f43f5e" count={fExpenses.length} actions={
            <>
              <button onClick={() => { setExpenseEdit(null); setExpenseFormOpen(true); }} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="Add expense"><Plus className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewer('expenses')} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="View all"><Inbox className="w-3.5 h-3.5" /></button>
              <button onClick={expensesPdf} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="Export PDF"><FileText className="w-3.5 h-3.5" /></button>
            </>
          }>
            {dataLoading ? <LoadingSpinner /> : fExpenses.length === 0 ? <EmptyState icon={ReceiptIcon} title={t('no_data')} /> : (
              <div className="space-y-2 max-h-[440px] overflow-y-auto thin-scroll pr-1">
                {fExpenses.map((rec) => (
                  <div key={rec.id} className="row-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 18px -6px rgba(244,63,94,0.35)' }}><ReceiptIcon className="w-4 h-4 text-rose-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{rec.description || rec.category}</p>
                      <p className="text-xs text-muted-foreground capitalize">{rec.category} · {formatDate(rec.date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">{formatCurrency(rec.amount)}</span>
                    <StatusBadge status={rec.status} />
                    <button onClick={() => { setExpenseEdit(rec); setExpenseFormOpen(true); }} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="Edit expense"><Pencil className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Documents — small card, click-to-collapse */}
          <DocumentsSection entityType="driver" entityId={driver.id} accent="#a855f7" defaultOpen={false} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DriverDeductionsSection driverName={driver.name} />
            <WeeklyActivityChart trips={trips} />
            <HoursGauge hours={totalHours} trips={fTrips} />
            <DriverOvertimeCard driverName={driver.name} trips={trips} />
          </div>
        </div>
      </div>

      <Sheet open={salaryFormOpen} onOpenChange={setSalaryFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-display text-foreground">Add Salary</SheetTitle>
          </SheetHeader>
          <SalaryFormSheet
            editItem={null}
            prefillDriver={driver.name}
            onSave={async (data) => {
              const { applied_deductions = [], ...salaryData } = data;
              const breakdown = applied_deductions.map(({ description, type, amount }) => ({ description, type, amount }));
              const rec = await base44.entities.SalaryRecord.create({ ...salaryData, applied_deductions: breakdown });
              reloadSalaries();
              setSalaryFormOpen(false);
              return rec;
            }}
            onCancel={() => setSalaryFormOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <ExpenseFormSheet
        open={expenseFormOpen}
        onOpenChange={setExpenseFormOpen}
        editItem={expenseEdit}
        prefillDriver={driver.name}
        onSaved={reloadExpenses}
      />

      <BreakdownDialog
        open={!!breakdown}
        onOpenChange={(o) => !o && setBreakdown(null)}
        title={breakdown?.title}
        rows={breakdown?.rows} />

      <RecordsViewerSheet
        open={!!viewer}
        onOpenChange={(o) => !o && setViewer(null)}
        {...(viewer ? viewerConfig[viewer] : {})}
      />
    </div>
  );
}