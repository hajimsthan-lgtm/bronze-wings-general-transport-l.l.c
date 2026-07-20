import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import InvoiceFormSheet from '@/components/invoices/InvoiceFormSheet';
import { FileText, Plus } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import PullToRefresh from '@/components/common/PullToRefresh';
import ExportButtons from '@/components/common/ExportButtons';
import { useInvoices, useInvoiceUpdate, useInvoiceDelete } from '@/hooks/useEntityQueries';
import { downloadInvoicePDF } from '@/lib/invoiceHtml';
import { getCompanySettings } from '@/lib/companySettings';
import { useSheetUrlState } from '@/hooks/useSheetUrlState';

import InvoiceMetrics from '@/components/invoices/InvoiceMetrics';
import InvoiceTimeline from '@/components/invoices/InvoiceTimeline';
import InvoicePayoutCards from '@/components/invoices/InvoicePayoutCards';
import InvoiceFilters from '@/components/invoices/InvoiceFilters';
import InvoiceTabs from '@/components/invoices/InvoiceTabs';
import InvoiceListPanel from '@/components/invoices/InvoiceListPanel';
import InvoiceDetailPanel from '@/components/invoices/InvoiceDetailPanel';

export default function Invoices() {
  const { t } = useI18n();
  const { data: invoices = [], isLoading: loading, refetch } = useInvoices();
  const updateInvoice = useInvoiceUpdate();
  const deleteInvoice = useInvoiceDelete();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [status, setStatus] = useState('all');
  const [customer, setCustomer] = useState('all');
  const [activeMonths, setActiveMonths] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [formOpen, setFormOpen] = useSheetUrlState('invoice');
  const [editInvoice, setEditInvoice] = useState(null);

  const customers = useMemo(
    () => [...new Set(invoices.map(i => i.client_name).filter(Boolean))].sort(),
    [invoices]
  );

  const months = useMemo(() => {
    const set = new Set();
    invoices.forEach(i => { if (i.issue_date) set.add(i.issue_date.slice(0, 7)); });
    return [...set].sort().reverse().slice(0, 6).map(k => {
      const [y, m] = k.split('-');
      return { key: k, label: new Date(+y, +m - 1).toLocaleString('default', { month: 'short', year: 'numeric' }) };
    });
  }, [invoices]);

  const monthFiltered = activeMonths.length === 0
    ? invoices
    : invoices.filter(i => i.issue_date && activeMonths.includes(i.issue_date.slice(0, 7)));

  const filtered = monthFiltered.filter(inv => {
    if (tab === 'draft' && inv.status !== 'draft') return false;
    if (tab === 'unpaid' && !['sent', 'overdue', 'partially_paid'].includes(inv.status)) return false;
    if (status !== 'all' && inv.status !== status) return false;
    if (customer !== 'all' && inv.client_name !== customer) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(inv.invoice_number?.toLowerCase().includes(q) || inv.client_name?.toLowerCase().includes(q))) return false;
    }
    return true;
  });

  useEffect(() => {
    if (filtered.length && !filtered.some(i => i.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find(i => i.id === selectedId) || filtered[0] || null;

  const totals = useMemo(() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const withDates = monthFiltered.filter(i => i.issue_date && i.due_date);
    const avgDays = withDates.length
      ? Math.round(withDates.reduce((s, i) => s + (new Date(i.due_date) - new Date(i.issue_date)) / 86400000, 0) / withDates.length)
      : 0;
    return {
      overdue: monthFiltered.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.total_amount || 0), 0),
      dueNextMonth: monthFiltered
        .filter(i => ['sent', 'partially_paid'].includes(i.status) && i.due_date && new Date(i.due_date) >= now && new Date(i.due_date) <= next)
        .reduce((s, i) => s + (i.total_amount || 0), 0),
      avgDays,
      availablePayout: monthFiltered.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0),
    };
  }, [monthFiltered]);

  const counts = {
    all: monthFiltered.length,
    draft: monthFiltered.filter(i => i.status === 'draft').length,
    unpaid: monthFiltered.filter(i => ['sent', 'overdue', 'partially_paid'].includes(i.status)).length,
  };

  const handleDownloadPDF = async (inv) => {
    setDownloadingId(inv.id);
    try {
      const settings = await getCompanySettings();
      await downloadInvoicePDF(inv, inv.client_name, settings);
    } catch (e) {}
    setDownloadingId(null);
  };

  const toggleMonth = (key) =>
    setActiveMonths(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  const exportColumns = [
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'client_name', label: 'Client' },
    { key: 'issue_date', label: 'Issue Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'total_amount', label: 'Total (AED)' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div>
      <PullToRefresh onRefresh={() => refetch()}>
        <InvoiceMetrics
          totals={totals}
          onCreate={() => { setEditInvoice(null); setFormOpen(true); }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-5">
          <div className="lg:col-span-2">
            <InvoiceTimeline invoices={monthFiltered} />
          </div>
          <InvoicePayoutCards invoices={monthFiltered} />
        </div>

        {/* White content slab */}
        <div className="mt-6 rounded-3xl bg-white text-slate-900 p-4 md:p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <InvoiceFilters
              search={search} setSearch={setSearch}
              status={status} setStatus={setStatus}
              customer={customer} setCustomer={setCustomer} customers={customers}
              months={months} activeMonths={activeMonths} onToggleMonth={toggleMonth}
            />
            <ExportButtons data={filtered} filename="invoices" columns={exportColumns} title="Invoices" />
          </div>

          <InvoiceTabs tab={tab} setTab={setTab} counts={counts} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
            <div className="lg:max-h-[620px] lg:overflow-y-auto pr-1">
              {loading ? (
                <LoadingSpinner />
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title={t('no_data')}
                  description="Create your first invoice"
                  action={null}
                />
              ) : (
                <InvoiceListPanel
                  invoices={filtered}
                  selectedId={selected?.id}
                  onSelect={setSelectedId}
                />
              )}
            </div>
            <InvoiceDetailPanel
              invoice={selected}
              onEdit={(inv) => { setEditInvoice(inv); setFormOpen(true); }}
              onDownload={handleDownloadPDF}
              onMarkPaid={(inv) => updateInvoice.mutateAsync({ id: inv.id, data: { status: 'paid' } })}
              onDelete={(inv) => setDeleteTarget(inv)}
              downloadingId={downloadingId}
            />
          </div>
        </div>
      </PullToRefresh>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice {deleteTarget?.invoice_number}. The linked trip will revert to "Not Sent" status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { if (deleteTarget) { await deleteInvoice.mutateAsync(deleteTarget.id); setDeleteTarget(null); } }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InvoiceFormSheet open={formOpen} onOpenChange={setFormOpen} editInvoice={editInvoice} />
    </div>
  );
}