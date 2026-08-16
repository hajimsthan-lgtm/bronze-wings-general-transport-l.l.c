import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityDetailHeader from '@/components/admin/EntityDetailHeader';
import EntityDocumentsTab from '@/components/admin/EntityDocumentsTab';
import DriverProfileCard from '@/components/admin/DriverProfileCard';
import ContractsSection from '@/components/contracts/ContractsSection';
import StatusBadge from '@/components/common/StatusBadge';
import DetailSkeleton from '@/components/detail/DetailMotion';
import EmptyState from '@/components/common/EmptyState';
import BreakdownDialog from '@/components/common/BreakdownDialog';
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
import { Inbox, Wallet as WalletIcon, Receipt as ReceiptIcon, FileDown, FileText, Truck, Pencil } from 'lucide-react';
import SalaryFormSheet from '@/components/salary/SalaryFormSheet';
import ExpenseFormSheet from '@/components/expenses/ExpenseFormSheet';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import WeeklyActivityChart from '@/components/drivers/WeeklyActivityChart';
import HoursGauge from '@/components/drivers/HoursGauge';
import TripChecklist from '@/components/drivers/TripChecklist';
import DriverOutstandingPayments from '@/components/drivers/DriverOutstandingPayments';
import DriverDeductionsSection from '@/components/drivers/DriverDeductionsSection';
import { formatCurrency, formatDate } from '@/lib/formatters';

const yearsSince = (d) =>
  d ? Math.max(0, Math.floor((Date.now() - new Date(d)) / (365.25 * 86400000))) : 0;

export default function DriverDetail() {
  const { id } = useParams();
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
    <div className="detail-page space-y-5 pt-2">
      {/* Grid: profile (left, frozen) | sections + widgets (right, scroll) */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:h-[calc(100dvh-15rem)]">
        <div className="lg:h-full lg:overflow-y-auto thin-scroll space-y-5">
          <EntityDetailHeader backTo="/admin/drivers" />
          <DriverProfileCard driver={driver} vehicle={vehicle} stats={{ trips: fTrips.length, revenue: totalTrips, avgPerTrip, experience: `${expYears} yr${expYears === 1 ? '' : 's'}`, expenses: totalExpenses, salary: totalSalary, netProfit }} onSave={saveDriver} />
        </div>
        <div className="space-y-4 lg:h-full lg:overflow-y-auto thin-scroll pr-1">
          {/* Trips — long table, auto-collapse on hover */}
          <TabTableCard
              collapsible
              defaultOpen={false}
              icon={Truck}
              accent="#f43f5e"
              title={`Trips — ${driver.name}`}
              subtitle={`${dateFrom} → ${dateTo}`}
              loading={dataLoading}
              columns={[
              { label: 'Trip ID', className: 'col-span-2' },
              { label: 'Date', className: 'col-span-2' },
              { label: 'Route', className: 'col-span-3' },
              { label: 'Status', className: 'col-span-2' },
              { label: 'Amount', className: 'col-span-2 text-right' },
              { label: 'Action', className: 'col-span-1 text-right' }]
              }
              emptyIcon={Inbox}>
            {fTrips.map((trip) =>
              <div key={trip.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-muted/20 transition-colors">
                <div className="col-span-2 text-muted-foreground truncate">{trip.trip_number || trip.id.slice(0, 6)}</div>
                <div className="col-span-2 text-muted-foreground">{formatDate(trip.trip_date)}</div>
                <div className="col-span-3 text-foreground truncate">{trip.from_location} → {trip.to_location}</div>
                <div className="col-span-2"><StatusBadge status={trip.status} /></div>
                <div className="col-span-2 text-right font-semibold text-foreground tabular-nums">{formatCurrency(trip.revenue)}</div>
                <div className="col-span-1 text-right">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground">View</Button>
                </div>
              </div>
              )}
          </TabTableCard>

          {/* Contracts */}
          <ContractsSection filter={{ driver_name: driver.name }} />

          {/* Salary — small card, click-to-collapse */}
          <DriverOutstandingPayments salaries={salaries} onMarkPaid={markPaid} busyId={salaryBusyId} collapsible />
          <RecordSectionCard
              title="Salary Records"
              icon={WalletIcon}
              accent="#10b981"
              count={fSalaries.length}
              collapsible
              defaultOpen={false}
              onView={() => setViewer('salary')}
              onPdf={salaryPdf}
              onNew={() => setSalaryFormOpen(true)}
              newLabel="Add salary"
              loading={dataLoading}
              emptyIcon={WalletIcon}
              emptyLabel={t('no_data')}
              columns={[
                { label: 'Period', className: 'col-span-3' },
                { label: 'Payment Date', className: 'col-span-3' },
                { label: 'Net Salary', className: 'col-span-3 text-right' },
                { label: 'Status', className: 'col-span-2' },
                { label: '', className: 'col-span-1 text-right' },
              ]}>
            {fSalaries.slice(0, 5).map((rec) => (
              <div key={rec.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-muted/20 transition-colors">
                <div className="col-span-3 text-foreground font-medium">{rec.month} {rec.year}</div>
                <div className="col-span-3 text-muted-foreground">{formatDate(rec.payment_date)}</div>
                <div className="col-span-3 text-right font-semibold text-foreground tabular-nums">{formatCurrency(rec.net_salary)}</div>
                <div className="col-span-2"><StatusBadge status={rec.status} /></div>
                <div className="col-span-1 text-right">
                  <Button size="sm" variant="ghost" disabled={payslipBusyId === rec.id} onClick={() => downloadPayslip(rec)} className="h-7 px-2 text-muted-foreground hover:text-primary" title="Download payslip"><FileDown className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </RecordSectionCard>

          {/* Expenses — small card, click-to-collapse */}
          <RecordSectionCard
              title="Expenses"
              icon={ReceiptIcon}
              accent="#f43f5e"
              count={fExpenses.length}
              collapsible
              defaultOpen={false}
              onView={() => setViewer('expenses')}
              onPdf={expensesPdf}
              onNew={() => { setExpenseEdit(null); setExpenseFormOpen(true); }}
              newLabel="Add expense"
              loading={dataLoading}
              emptyIcon={ReceiptIcon}
              emptyLabel={t('no_data')}
              columns={[
                { label: 'Date', className: 'col-span-2' },
                { label: 'Category', className: 'col-span-2' },
                { label: 'Description', className: 'col-span-3' },
                { label: 'Amount', className: 'col-span-2 text-right' },
                { label: 'Status', className: 'col-span-2' },
                { label: '', className: 'col-span-1 text-right' },
              ]}>
            {fExpenses.slice(0, 5).map((rec) => (
              <div key={rec.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-muted/20 transition-colors">
                <div className="col-span-2 text-muted-foreground">{formatDate(rec.date)}</div>
                <div className="col-span-2 text-muted-foreground capitalize">{rec.category}</div>
                <div className="col-span-3 text-foreground truncate">{rec.description || rec.category}</div>
                <div className="col-span-2 text-right font-semibold text-foreground tabular-nums">{formatCurrency(rec.amount)}</div>
                <div className="col-span-2"><StatusBadge status={rec.status} /></div>
                <div className="col-span-1 text-right">
                  <Button size="sm" variant="ghost" onClick={() => { setExpenseEdit(rec); setExpenseFormOpen(true); }} className="h-7 px-2 text-muted-foreground hover:text-foreground" title="Edit expense"><Pencil className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </RecordSectionCard>

          {/* Documents — small card, click-to-collapse */}
          <RecordSectionCard
              title={t('documents')}
              icon={FileText}
              accent="#a855f7"
              count={null}
              collapsible
              defaultOpen={false}
              loading={false}>
            <EntityDocumentsTab entityType="driver" entityId={driver.id} />
          </RecordSectionCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DriverDeductionsSection driverName={driver.name} />
            <WeeklyActivityChart trips={trips} />
            <HoursGauge hours={totalHours} />
            <TripChecklist trips={fTrips} />
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
              await base44.entities.SalaryRecord.create({ ...salaryData, applied_deductions: breakdown });
              reloadSalaries();
              setSalaryFormOpen(false);
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