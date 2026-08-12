import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { safeAll } from '@/lib/safeRequest';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { useReportClient } from '@/lib/reportClientFilter';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import { buildSoaRows } from '@/lib/soaExport';
import SoaExportButtons from '@/components/reports/SoaExportButtons';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/formatters';
import { FileText } from 'lucide-react';
import SectionExportButtons from '@/components/reports/SectionExportButtons';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import ReportRowCard from '@/components/reports/ReportRowCard';
import ReportStatusBadge from '@/components/reports/ReportStatusBadge';
import DonutChart from '@/components/reports/DonutChart';
import BarTrendChart from '@/components/reports/BarTrendChart';
import Sparkline from '@/components/reports/Sparkline';

const STATUS_COLOR = { paid: '#22c55e', partially_paid: '#f59e0b', partial: '#f59e0b', sent: '#3b82f6', draft: '#94a3b8', pending: '#f97316' };

export default function Soa() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const reportClient = useReportClient();
  const { dateFrom, dateTo } = useGlobalDate();

  useEffect(() => {
    safeAll([
      () => base44.entities.Invoice.list('-issue_date', 500),
      () => base44.entities.Client.list(),
      () => base44.entities.Trip.list('-trip_date', 500),
      () => base44.entities.Expense.list('-date', 500),
      () => base44.entities.FuelRecord.list('-date', 500),
      () => base44.entities.Vehicle.list(),
    ]).then(([inv, cl, tr, ex, fu, ve]) => {
      setInvoices(inv || []); setClients(cl || []); setTrips(tr || []); setExpenses(ex || []); setFuelRecords(fu || []); setVehicles(ve || []);
    }).finally(() => setLoading(false));
  }, []);

  const _f = dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const _t = dateTo || new Date().toISOString().split('T')[0];
  const dateFiltered = invoices.filter(i => !i.issue_date || (i.issue_date >= _f && i.issue_date <= _t));
  const filtered = reportClient === 'all' ? dateFiltered : dateFiltered.filter(i => i.client_name === reportClient);
  const soaRows = buildSoaRows(filtered, trips, vehicles);
  const totalAmount = filtered.reduce((s, i) => s + (i.total_amount || 0), 0);
  const paidAmount = filtered.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0);
  const balance = totalAmount - paidAmount;
  const dateRange = `${formatDate(_f)} - ${formatDate(_t)}`;



  // Payment status pie
  const statusMap = {};
  filtered.forEach((i) => { statusMap[i.status] = (statusMap[i.status] || 0) + (i.total_amount || 0); });
  const pieData = Object.entries(statusMap).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value, color: STATUS_COLOR[name] || '#94a3b8' })).filter((d) => d.value > 0);
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  // Aging buckets
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
  filtered.forEach((i) => {
    if (!i.issue_date) return;
    const age = Math.floor((today - new Date(i.issue_date)) / 86400000);
    if (age <= 30) buckets['0-30'] += (i.total_amount || 0);
    else if (age <= 60) buckets['31-60'] += (i.total_amount || 0);
    else if (age <= 90) buckets['61-90'] += (i.total_amount || 0);
    else buckets['90+'] += (i.total_amount || 0);
  });
  const agingData = Object.entries(buckets).map(([label, value]) => ({ label, value }));

  // Client balance
  const clientBal = {};
  filtered.forEach((i) => { clientBal[i.client_name] = (clientBal[i.client_name] || 0) + (i.total_amount || 0) - (i.status === 'paid' ? (i.total_amount || 0) : 0); });
  const clientBalData = Object.entries(clientBal).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  // Outstanding sparkline (cumulative issued - cumulative paid per day)
  const days = [];
  { const _cf = dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]; const _ct = dateTo || new Date().toISOString().split('T')[0]; let d = new Date(_cf); const end = new Date(_ct); while (d <= end) { days.push(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 1); } }
  const outSeries = days.map((d) => {
    const issued = filtered.filter((i) => i.issue_date && i.issue_date <= d).reduce((s, i) => s + (i.total_amount || 0), 0);
    const paid = filtered.filter((i) => i.status === 'paid' && i.issue_date && i.issue_date <= d).reduce((s, i) => s + (i.total_amount || 0), 0);
    return issued - paid;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="relative">
      {/* Ambient handled by app layout */}

      <PageHeader icon={FileText} title={t('soa')} description="Client account statements" />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <SoaExportButtons rows={soaRows} filename="soa" date={new Date().toLocaleDateString('en-GB').replace(/\//g, '-')} clientName={reportClient === 'all' ? '' : reportClient} dateRange={dateRange} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <ReportStatCard index={0} label={t('total')} value={totalAmount} format={formatCurrency} icon={FileText} color="#3b82f6" />
        <ReportStatCard index={1} label={t('paid')} value={paidAmount} format={formatCurrency} icon={FileText} color="#22c55e" />
        <ReportStatCard index={2} label="Balance" value={balance} format={formatCurrency} icon={FileText} color="#f97316"
          extra={<Sparkline data={outSeries.length ? outSeries : [0, 0]} type="area" color="#f97316" width={90} height={32} />} />
      </div>

      {pieData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <ReportSectionCard index={3} color="#22c55e" title="Payment Status" action={<SectionExportButtons data={pieData.map((d) => ({ status: d.name, amount: d.value }))} filename="soa_payment_status" columns={[{ label: 'Status', key: 'status' }, { label: 'Amount (AED)', key: 'amount', numeric: true }]} title="Payment Status" options={{ dateRange }} />}>
            <div className="flex justify-center"><DonutChart data={pieData} total={formatCurrency(pieTotal)} height={180} /></div>
          </ReportSectionCard>
          <ReportSectionCard index={4} color="#a855f7" title="Aging Buckets" action={<SectionExportButtons data={agingData} filename="soa_aging_buckets" columns={[{ label: 'Bucket', key: 'label' }, { label: 'Amount (AED)', key: 'value', numeric: true }]} title="Aging Buckets" options={{ dateRange }} />}>
            <BarTrendChart data={agingData} dataKey="value" color="#a855f7" height={200} />
          </ReportSectionCard>
          <ReportSectionCard index={5} color="#f97316" title="Client Balances" action={<SectionExportButtons data={clientBalData} filename="soa_client_balances" columns={[{ label: 'Client', key: 'label' }, { label: 'Balance (AED)', key: 'value', numeric: true }]} title="Client Balances" options={{ dateRange }} />}>
            <BarTrendChart data={clientBalData} dataKey="value" color="#f97316" height={200} horizontal />
          </ReportSectionCard>
        </div>
      )}

      {filtered.length === 0 ? <EmptyState icon={FileText} title={t('no_data')} /> : (
        <div>
          {filtered.map((inv, i) => (
            <ReportRowCard
              key={inv.id}
              icon={FileText}
              iconColor={STATUS_COLOR[inv.status] || '#94a3b8'}
              title={inv.invoice_number || `INV-${inv.id?.slice(-6)}`}
              subtitle={`${inv.client_name || '—'}${inv.contact_person ? ` · ${inv.contact_person}` : ''} · ${formatDate(inv.issue_date)}`}
              accent={STATUS_COLOR[inv.status] || '#94a3b8'}
              right={
                <div className="flex items-center gap-3 flex-shrink-0">
                  <ReportStatusBadge status={inv.status} />
                  <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(inv.total_amount)}</span>
                </div>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}