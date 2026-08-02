import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityDetailHeader from '@/components/admin/EntityDetailHeader';
import EntityDocumentsTab from '@/components/admin/EntityDocumentsTab';
import DriverProfileCard from '@/components/admin/DriverProfileCard';
import StatusBadge from '@/components/common/StatusBadge';
import DetailSkeleton from '@/components/detail/DetailMotion';
import EmptyState from '@/components/common/EmptyState';
import BreakdownDialog from '@/components/common/BreakdownDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Inbox, Wallet, Receipt, Plus, FileDown, Eye, Calendar, IdCard, UserCircle, Banknote, TrendingUp } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import WeeklyActivityChart from '@/components/drivers/WeeklyActivityChart';
import HoursGauge from '@/components/drivers/HoursGauge';
import TripChecklist from '@/components/drivers/TripChecklist';
import DriverOutstandingPayments from '@/components/drivers/DriverOutstandingPayments';
import DriverDeductionsSection from '@/components/drivers/DriverDeductionsSection';
import TabTableCard from '@/components/admin/TabTableCard';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import SalaryFormSheet from '@/components/salary/SalaryFormSheet';
import { useToast } from '@/components/ui/use-toast';
import { exportToPDF } from '@/lib/exportUtils';

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
  const [dateFrom, setDateFrom] = useState(() => {const d = new Date();return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];});
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [breakdown, setBreakdown] = useState(null);
  const [salaryFormOpen, setSalaryFormOpen] = useState(false);
  const [editSalary, setEditSalary] = useState(null);
  const [salaryBusyId, setSalaryBusyId] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'trips';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities.Driver.get(id).then(async (d) => {
      if (cancelled) return;
      setDriver(d);
      setLoading(false);
      setDataLoading(true);
      try {
        const delay = (ms) => new Promise((r) => setTimeout(r, ms));
        const tR = await base44.entities.Trip.filter({ driver_name: d.name }).catch(() => []);
        await delay(300);
        const sR = await base44.entities.SalaryRecord.filter({ driver_name: d.name }).catch(() => []);
        await delay(300);
        const eR = await base44.entities.Expense.filter({ driver_name: d.name }).catch(() => []);
        await delay(300);
        const vR = d.assigned_vehicle ? await base44.entities.Vehicle.filter({ plate_number: d.assigned_vehicle }).catch(() => []) : [];
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

  if (loading) return <DetailSkeleton />;
  if (!driver) return <EmptyState title="Driver not found" />;

  const fTrips = trips.filter((tt) => !tt.trip_date || tt.trip_date >= dateFrom && tt.trip_date <= dateTo);
  const fSalaries = salaries.filter((r) => !r.payment_date || r.payment_date >= dateFrom && r.payment_date <= dateTo);
  const fExpenses = expenses.filter((r) => !r.date || r.date >= dateFrom && r.date <= dateTo);

  const totalTrips = fTrips.reduce((s, x) => s + (Number(x.revenue) || 0), 0);
  const totalExpenses = fExpenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const totalSalary = fSalaries.reduce((s, x) => s + (Number(x.net_salary) || 0), 0);
  const netProfit = totalTrips - totalExpenses - totalSalary;
  const avgPerTrip = fTrips.length ? totalTrips / fTrips.length : 0;
  const expYears = yearsSince(driver.join_date);
  const totalHours = fTrips.reduce((s, x) => s + (Number(x.hours) || Number(x.calculated_duration) || 0), 0);

  const reloadSalaries = () => base44.entities.SalaryRecord.filter({ driver_name: driver.name }).then(setSalaries).catch(() => {});
  const markPaid = async (rec) => {
    setSalaryBusyId(rec.id);
    try {
      await base44.entities.SalaryRecord.update(rec.id, { status: 'paid', payment_date: rec.payment_date || new Date().toISOString().split('T')[0] });
      reloadSalaries();
    } finally {setSalaryBusyId(null);}
  };
  const saveSalary = async (data) => {
    if (editSalary) await base44.entities.SalaryRecord.update(editSalary.id, data);else
    await base44.entities.SalaryRecord.create(data);
    reloadSalaries();
    setSalaryFormOpen(false);
  };

  const handleProfitPDF = () => {
    try {
      const data = [
      { label: 'Trip Revenue', amount: totalTrips },
      { label: 'Expenses', amount: totalExpenses },
      { label: 'Salary', amount: totalSalary },
      { label: 'Net Profit', amount: netProfit }];

      exportToPDF(
        data,
        `driver-${driver.name}-profit`,
        [{ label: 'Category', key: 'label' }, { label: 'Amount', key: 'amount', numeric: true }],
        `Driver Profit — ${driver.name}`,
        { dateRange: `${dateFrom} to ${dateTo}`, skipTotal: true }
      );
    } catch (e) {
      toast({ title: 'PDF generation failed', variant: 'destructive' });
    }
  };

  const hasProfitData = totalTrips || totalExpenses || totalSalary || netProfit;

  return (
    <div className="detail-page space-y-4">
      {/* Top row: back + global date filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <EntityDetailHeader backTo="/admin/drivers" />
        <div className="flex items-center gap-2 sm:ml-auto">
          <Calendar className="w-4 h-4 text-muted-foreground hidden sm:block" />
          <DateRangeFilter
            fromValue={dateFrom}
            onFromChange={setDateFrom}
            toValue={dateTo}
            onToChange={setDateTo}
            onToday={() => {const today = new Date().toISOString().split('T')[0];setDateFrom(today);setDateTo(today);}} />
          
        </div>
      </div>

      {/* Grid: profile (left) | widgets (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
        <DriverProfileCard driver={driver} vehicle={vehicle} stats={{ trips: fTrips.length, revenue: totalTrips, avgPerTrip, experience: `${expYears} yr${expYears === 1 ? '' : 's'}`, expenses: totalExpenses, salary: totalSalary, netProfit }} />
        <div className="space-y-4">
          <WeeklyActivityChart trips={trips} />
          <HoursGauge hours={totalHours} />
          <TripChecklist trips={fTrips} />
        </div>
      </div>

      {/* License & Details accordion — full width */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        










































































        
      </div>

      {/* Driver Profit Card — full width */}
      






























      

      {/* Tabs */}
      <Tabs defaultValue={initialTab}>
        <TabsList className="rounded-xl p-1.5 gap-1.5 bg-card border border-border">
          <TabsTrigger value="trips">{t('trips')} ({fTrips.length})</TabsTrigger>
          <TabsTrigger value="salary">{t('salary')} ({fSalaries.length})</TabsTrigger>
          <TabsTrigger value="expenses">{t('expenses')} ({fExpenses.length})</TabsTrigger>
          <TabsTrigger value="documents">{t('documents')}</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4">
          <TabTableCard
            title={`Trips — ${driver.name}`}
            subtitle={`${dateFrom} → ${dateTo}`}
            loading={dataLoading}
            columns={[
              { label: 'Trip ID', className: 'col-span-2' },
              { label: 'Date', className: 'col-span-2' },
              { label: 'Route', className: 'col-span-3' },
              { label: 'Status', className: 'col-span-2' },
              { label: 'Amount', className: 'col-span-2 text-right' },
              { label: 'Action', className: 'col-span-1 text-right' },
            ]}
            emptyIcon={Inbox}
          >
            {fTrips.map((trip) => (
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
            ))}
          </TabTableCard>
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <DriverOutstandingPayments salaries={salaries} onMarkPaid={markPaid} busyId={salaryBusyId} />
          <TabTableCard
            title="Salary Records"
            subtitle={`${dateFrom} → ${dateTo}`}
            loading={dataLoading}
            actions={
              <Button onClick={() => { setEditSalary(null); setSalaryFormOpen(true); }} size="sm" className="bg-primary hover:bg-primary/90 h-8">
                <Plus className="w-3.5 h-3.5 mr-1" /> Generate Salary
              </Button>
            }
            columns={[
              { label: 'Period', className: 'col-span-2' },
              { label: 'Pay Date', className: 'col-span-2' },
              { label: 'Base', className: 'col-span-2 text-right' },
              { label: 'Additions', className: 'col-span-2 text-right' },
              { label: 'Deductions', className: 'col-span-1 text-right' },
              { label: 'Net', className: 'col-span-2 text-right' },
              { label: 'Status', className: 'col-span-1 text-right' },
            ]}
            emptyIcon={Wallet}
          >
            {fSalaries.map((rec) => (
              <div key={rec.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-muted/20 transition-colors">
                <div className="col-span-2 text-foreground font-medium truncate">{rec.month} {rec.year}</div>
                <div className="col-span-2 text-muted-foreground">{formatDate(rec.payment_date)}</div>
                <div className="col-span-2 text-right text-muted-foreground tabular-nums">{formatCurrency(rec.base_salary)}</div>
                <div className="col-span-2 text-right text-emerald-400 tabular-nums">{formatCurrency((rec.overtime || 0) + (rec.bonus || 0))}</div>
                <div className="col-span-1 text-right text-amber-400 tabular-nums">{formatCurrency(rec.deductions)}</div>
                <div className="col-span-2 text-right font-semibold text-foreground tabular-nums">{formatCurrency(rec.net_salary)}</div>
                <div className="col-span-1 text-right"><StatusBadge status={rec.status} /></div>
              </div>
            ))}
          </TabTableCard>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <TabTableCard
            title="Expenses"
            subtitle={`${dateFrom} → ${dateTo}`}
            loading={dataLoading}
            columns={[
              { label: 'Date', className: 'col-span-2' },
              { label: 'Category', className: 'col-span-2' },
              { label: 'Description', className: 'col-span-5' },
              { label: 'Amount', className: 'col-span-2 text-right' },
              { label: 'Status', className: 'col-span-1 text-right' },
            ]}
            emptyIcon={Receipt}
          >
            {fExpenses.map((rec) => (
              <div key={rec.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-muted/20 transition-colors">
                <div className="col-span-2 text-muted-foreground">{formatDate(rec.date)}</div>
                <div className="col-span-2 text-foreground capitalize truncate">{rec.category}</div>
                <div className="col-span-5 text-muted-foreground truncate">{rec.description || '—'}</div>
                <div className="col-span-2 text-right font-semibold text-foreground tabular-nums">{formatCurrency(rec.amount)}</div>
                <div className="col-span-1 text-right"><StatusBadge status={rec.status} /></div>
              </div>
            ))}
          </TabTableCard>
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <EntityDocumentsTab entityType="driver" entityId={driver.id} />
        </TabsContent>
      </Tabs>

      {/* Pending Deductions — full width */}
      <DriverDeductionsSection driverName={driver.name} />

      <Sheet open={salaryFormOpen} onOpenChange={setSalaryFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6">
            <SheetTitle className="font-display text-foreground">{editSalary ? t('edit') : 'Generate'} Salary</SheetTitle>
          </SheetHeader>
          <SalaryFormSheet
            editItem={editSalary}
            prefillDriver={driver.name}
            onSave={saveSalary}
            onCancel={() => setSalaryFormOpen(false)} />
          
        </SheetContent>
      </Sheet>

      <BreakdownDialog
        open={!!breakdown}
        onOpenChange={(o) => !o && setBreakdown(null)}
        title={breakdown?.title}
        rows={breakdown?.rows} />
      
    </div>);

}

function DetailField({ icon: Icon, label, value, sub, valueClass }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground mb-1.5" />}
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold ${valueClass || 'text-foreground'}`}>{value || '—'}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>);

}

function ProfitRow({ label, value, tone, bold }) {
  return (
    <div className={`flex items-center justify-between py-3 ${bold ? 'pt-4' : ''}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`${bold ? 'text-lg' : 'text-base'} ${bold ? 'text-foreground' : tone} font-bold tabular-nums`}>{formatCurrency(value)}</span>
    </div>);

}