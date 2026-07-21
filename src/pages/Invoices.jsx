import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import InvoiceFormSheet from '@/components/invoices/InvoiceFormSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, Search, FileText, Download, CheckCircle, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import InvoiceAccordion from '@/components/invoices/InvoiceAccordion';
import { useSheetUrlState } from '@/hooks/useSheetUrlState';
import PullToRefresh from '@/components/common/PullToRefresh';
import { useInvoices, useInvoiceUpdate, useInvoiceDelete } from '@/hooks/useEntityQueries';
import ExportButtons from '@/components/common/ExportButtons';
import { downloadInvoicePDF } from '@/lib/invoiceHtml';
import { getCompanySettings } from '@/lib/companySettings';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import SatinCard from '@/components/common/SatinCard';
import PageInfo from '@/components/common/PageInfo';

const STATUSES = ['all', 'draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'];
const UNPAID_STATUSES = ['draft', 'sent', 'overdue', 'partially_paid'];

export default function Invoices() {
  const { t } = useI18n();
  const { data: invoices = [], isLoading: loading, refetch } = useInvoices();
  const updateInvoice = useInvoiceUpdate();
  const deleteInvoice = useInvoiceDelete();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filter, setFilter] = useState('all');
  const [downloadingId, setDownloadingId] = useState(null);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useSheetUrlState('invoice');
  const [editInvoice, setEditInvoice] = useState(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const dateFiltered = invoices.filter((inv) => !inv.issue_date || inv.issue_date >= dateFrom && inv.issue_date <= dateTo);
  const filtered = dateFiltered.filter((inv) => {
    if (filter === 'all') {
      if (!UNPAID_STATUSES.includes(inv.status)) return false;
    } else if (inv.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return inv.invoice_number?.toLowerCase().includes(q) || inv.client_name?.toLowerCase().includes(q);
    }
    return true;
  });

  const totals = {
    draft: dateFiltered.filter((i) => i.status === 'draft').reduce((s, i) => s + (i.total_amount || 0), 0),
    sent: dateFiltered.filter((i) => i.status === 'sent').reduce((s, i) => s + (i.total_amount || 0), 0),
    paid: dateFiltered.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0),
    overdue: dateFiltered.filter((i) => i.status === 'overdue').reduce((s, i) => s + (i.total_amount || 0), 0)
  };

  const handleDownloadPDF = async (inv) => {
    setDownloadingId(inv.id);
    try {
      const settings = await getCompanySettings();
      await downloadInvoicePDF(inv, inv.client_name, settings);
    } catch (e) {}
    setDownloadingId(null);
  };

  const exportColumns = [
  { key: 'invoice_number', label: 'Invoice #' },
  { key: 'client_name', label: 'Client' },
  { key: 'issue_date', label: 'Issue Date' },
  { key: 'due_date', label: 'Due Date' },
  { key: 'total_amount', label: 'Total (AED)' },
  { key: 'status', label: 'Status' }];


  return (
    <div>
      <PullToRefresh onRefresh={() => refetch()}>
        <PageHeader
          title={t('invoices')}
          description={`${invoices.length} total invoices`}
          action={
          <div className="flex items-center gap-2">
              <ExportButtons data={filtered} filename="invoices" columns={exportColumns} title="Invoices" />
              <Button onClick={() => {setEditInvoice(null);setFormOpen(true);}} className="bg-primary hover:bg-primary/90 h-10">
                <Plus className="w-4 h-4 mr-1.5" /> {t('new_invoice')}
              </Button>
            </div>
          } />
        
        <PageInfo text="Create and track invoices for your clients. The form shows live subtotal, VAT and total as you add line items. Mark invoices sent or paid to keep balances current." />

        {/* Summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {['draft', 'sent', 'paid', 'overdue'].map((s) =>
          <SatinCard key={s} as="button" active={filter === s} onClick={() => setFilter(s)} className="p-3 text-left transition-all duration-200 hidden">
              <p className="eyebrow">{t(s)}</p>
              <p className="text-lg font-bold mt-1 text-foreground tabular-nums font-display">{formatCurrency(totals[s])}</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">{dateFiltered.filter((i) => i.status === s).length} invoices</p>
            </SatinCard>
          )}
        </div>

        {/* Unified toolbar */}
        <div className="glass-card p-3 mb-5 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              
              
            </div>
            <DateRangeFilter
              fromValue={dateFrom}
              onFromChange={setDateFrom}
              toValue={dateTo}
              onToChange={setDateTo}
              onToday={() => {const today = new Date().toISOString().split('T')[0];setDateFrom(today);setDateTo(today);}} />
            
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            {STATUSES.map((s) =>
            <button key={s} onClick={() => setFilter(s)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${filter === s ? 'bg-primary/15 text-primary border-primary/25 shadow-[0_0_12px_rgba(59,130,246,0.25)]' : 'bg-white/[0.04] text-muted-foreground border-white/10 hover:bg-white/[0.08] hover:text-foreground'}`}>
                {s === 'all' ? 'All' : t(s)}
              </button>
            )}
          </div>
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ?
        <EmptyState icon={FileText} title={t('no_data')} description="Create your first invoice" action={
        <Button onClick={() => {setEditInvoice(null);setFormOpen(true);}} variant="outline" className="border-border">
              <Plus className="w-4 h-4 mr-1.5" /> {t('new_invoice')}
            </Button>
        } /> :

        <InvoiceAccordion
          invoices={filtered}
          onEdit={(inv) => {setEditInvoice(inv);setFormOpen(true);}}
          onDelete={(inv) => setDeleteTarget(inv)}
          onDownload={handleDownloadPDF}
          downloadingId={downloadingId}
          onMarkPaid={(inv) => updateInvoice.mutateAsync({ id: inv.id, data: { status: 'paid' } })} />

        }
      </PullToRefresh>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => {if (!open) setDeleteTarget(null);}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice {deleteTarget?.invoice_number}. The linked trip will revert to "Not Sent" status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {if (deleteTarget) {await deleteInvoice.mutateAsync(deleteTarget.id);setDeleteTarget(null);}}} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InvoiceFormSheet open={formOpen} onOpenChange={setFormOpen} editInvoice={editInvoice} />
    </div>);

}