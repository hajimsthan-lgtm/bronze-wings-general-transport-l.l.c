import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { FileText } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ExportButtons from '@/components/common/ExportButtons';
import ReportStatCard from '@/components/reports/ReportStatCard';

export default function Soa() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('all');
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    Promise.all([
      base44.entities.Invoice.list('-issue_date', 500),
      base44.entities.Client.list(),
    ]).then(([inv, cl]) => { setInvoices(inv); setClients(cl); }).finally(() => setLoading(false));
  }, []);

  const dateFiltered = invoices.filter(i => !i.issue_date || (i.issue_date >= dateFrom && i.issue_date <= dateTo));
  const filtered = selectedClient === 'all' ? dateFiltered : dateFiltered.filter(i => i.client_name === selectedClient);
  const totalAmount = filtered.reduce((s, i) => s + (i.total_amount || 0), 0);
  const paidAmount = filtered.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0);
  const balance = totalAmount - paidAmount;

  const clientNames = [...new Set(invoices.map(i => i.client_name).filter(Boolean))];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-24 -left-10 w-[420px] h-[420px] rounded-full blur-[130px] md:animate-[float_20s_ease-in-out_infinite]" style={{ background: 'rgba(59,130,246,0.05)' }} />
        <div className="absolute top-1/3 -right-24 w-[360px] h-[360px] rounded-full blur-[130px] md:animate-[float_20s_ease-in-out_infinite]" style={{ background: 'rgba(168,85,247,0.05)', animationDelay: '7s' }} />
      </div>
      <PageHeader title={t('soa')} description="Client account statements"
        action={
          <div className="flex items-center gap-2">
            <ExportButtons
              data={filtered.map(inv => ({ invoice_number: inv.invoice_number, client_name: inv.client_name, issue_date: inv.issue_date, status: inv.status, total_amount: inv.total_amount }))}
              filename="soa"
              columns={[
                { label: 'Invoice #', key: 'invoice_number' },
                { label: 'Client', key: 'client_name' },
                { label: 'Issue Date', key: 'issue_date' },
                { label: 'Status', key: 'status' },
                { label: 'Total (AED)', key: 'total_amount', numeric: true },
              ]}
              title="Statement of Account"
              options={{ dateRange: `${formatDate(dateFrom)} - ${formatDate(dateTo)}` }}
            />
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="bg-card border-border w-48 h-10"><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clientNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        } />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <ReportStatCard index={0} label={t('total')} value={totalAmount} format={formatCurrency} icon={FileText} color="#3b82f6" />
        <ReportStatCard index={1} label={t('paid')} value={paidAmount} format={formatCurrency} icon={FileText} color="#22c55e" />
        <ReportStatCard index={2} label="Balance" value={balance} format={formatCurrency} icon={FileText} color="#f59e0b" />
      </div>

      {filtered.length === 0 ? <EmptyState icon={FileText} title={t('no_data')} /> : (
        <div className="space-y-2">
          {filtered.map(inv => (
            <div key={inv.id} className="glass-card p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2"><span className="text-sm font-medium text-foreground">{inv.invoice_number || `INV-${inv.id?.slice(-6)}`}</span><StatusBadge status={inv.status} /></div>
                <p className="text-xs text-muted-foreground mt-0.5">{inv.client_name}{inv.contact_person ? ` · ${inv.contact_person}` : ''} · {formatDate(inv.issue_date)}</p>
              </div>
              <span className="text-sm font-semibold text-foreground">{formatCurrency(inv.total_amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}