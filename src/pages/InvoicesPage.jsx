import { useState, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Search, FileText, Download, CheckCircle, Loader2, FilePlus2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import InvoiceAccordion from '@/components/invoices/InvoiceAccordion';
import InvoiceFormSheet from '@/components/invoices/InvoiceFormSheet';
import { useSheetUrlState } from '@/hooks/useSheetUrlState';
import PullToRefresh from '@/components/common/PullToRefresh';
import { useInvoices, useInvoiceUpdate, useInvoiceDelete } from '@/hooks/useEntityQueries';
import ExportButtons from '@/components/common/ExportButtons';
import { downloadInvoicePDF } from '@/lib/invoiceHtml';
import { getCompanySettings } from '@/lib/companySettings';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import { restructureInvoiceSequence } from '@/lib/invoiceSequence';
import PageInfo from '@/components/common/PageInfo';
import { cn } from '@/lib/utils';

const STATUSES = [
  { key: 'all', label: 'All', color: '#6EE7B7' },
  { key: 'draft', label: 'Drafts', color: '#fbbf24' },
  { key: 'sent', label: 'Sent', color: '#3b82f6' },
  { key: 'partially_paid', label: 'Partially Paid', color: '#f97316' },
  { key: 'paid', label: 'Paid', color: '#34d399' },
  { key: 'overdue', label: 'Overdue', color: '#f87171' },
  { key: 'cancelled', label: 'Cancelled', color: '#94a3b8' },
];
const UNPAID_STATUSES = ['draft', 'sent', 'overdue', 'partially_paid'];

export default function InvoicesPage() {
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
  const { dateFrom, dateTo } = useGlobalDate();

  const dateFiltered = useMemo(
    () => invoices.filter((inv) => !inv.issue_date || ((!dateFrom || inv.issue_date >= dateFrom) && (!dateTo || inv.issue_date <= dateTo))),
    [invoices, dateFrom, dateTo]
  );

  const counts = useMemo(() => {
    const c = { all: 0, draft: 0, sent: 0, partially_paid: 0, paid: 0, overdue: 0, cancelled: 0 };
    dateFiltered.forEach((inv) => {
      c.all += 1;
      if (c[inv.status] !== undefined) c[inv.status] += 1;
    });
    // "all" shows only unpaid (matching current behaviour)
    c.all = UNPAID_STATUSES.reduce((s, k) => s + (c[k] || 0), 0);
    return c;
  }, [dateFiltered]);

  const totals = useMemo(() => ({
    draft: dateFiltered.filter((i) => i.status === 'draft').reduce((s, i) => s + (i.total_amount || 0), 0),
    sent: dateFiltered.filter((i) => i.status === 'sent').reduce((s, i) => s + (i.total_amount || 0), 0),
    paid: dateFiltered.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0),
    overdue: dateFiltered.filter((i) => i.status === 'overdue').reduce((s, i) => s + (i.total_amount || 0), 0),
  }), [dateFiltered]);

  const filtered = useMemo(() => dateFiltered.filter((inv) => {
    if (filter === 'all') {
      if (!UNPAID_STATUSES.includes(inv.status)) return false;
    } else if (inv.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return inv.invoice_number?.toLowerCase().includes(q) || inv.client_name?.toLowerCase().includes(q);
    }
    return true;
  }), [dateFiltered, filter, search]);

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
    { key: 'status', label: 'Status' },
  ];

  const openNew = () => { setEditInvoice(null); setFormOpen(true); };
  const openEdit = (inv) => { setEditInvoice(inv); setFormOpen(true); };

  return (
    <div>
      <PullToRefresh onRefresh={() => refetch()}>
        <PageHeader
          title={t('invoices')}
          description={`${invoices.length} total invoices`}
          action={
            <div className="flex items-center gap-2">
              <ExportButtons data={filtered} filename="invoices" columns={exportColumns} title="Invoices" />
              <Button onClick={openNew} className="bg-primary hover:bg-primary/90 h-10">
                <Plus className="w-4 h-4 mr-1.5" /> {t('new_invoice')}
              </Button>
            </div>
          }
        />

        <PageInfo text="Create and track invoices for your clients. The form shows live subtotal, VAT and total as you add line items. Mark invoices sent or paid to keep balances current." />

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 mt-1">
          {/* ── Side nav ── */}
          <aside className="glass-card p-2.5 lg:sticky lg:top-4 lg:self-start">
            <p className="eyebrow px-2.5 py-1.5">Filter by status</p>
            <nav className="space-y-0.5">
              {STATUSES.map((s) => {
                const active = filter === s.key;
                const count = counts[s.key] || 0;
                const amount = s.key === 'all' ? null : totals[s.key];
                return (
                  <button
                    key={s.key}
                    onClick={() => setFilter(s.key)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all duration-200 group',
                      active
                        ? 'bg-primary/15 text-foreground border border-primary/25 shadow-[0_0_12px_rgba(30,215,96,0.18)]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-transparent'
                    )}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: s.color, boxShadow: active ? `0 0 8px ${s.color}` : 'none' }}
                    />
                    <span className="flex-1 text-left font-medium">{s.label}</span>
                    <span className={cn('text-[11px] font-mono tabular-nums', active ? 'text-primary' : 'text-muted-foreground/70')}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* mini totals */}
            <div className="mt-3 pt-3 border-t border-white/[0.06] px-2.5 space-y-1.5">
              <p className="eyebrow">Outstanding</p>
              {['draft', 'sent', 'overdue'].map((k) => (
                <div key={k} className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground capitalize">{k.replace('_', ' ')}</span>
                  <span className="font-mono tabular-nums text-foreground">{formatCurrency(totals[k] || 0)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/[0.06]">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-mono tabular-nums text-emerald-400">{formatCurrency(totals.paid || 0)}</span>
              </div>
            </div>

            <button
              onClick={openNew}
              className="w-full mt-3 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <FilePlus2 className="w-3.5 h-3.5" /> New Invoice
            </button>
          </aside>

          {/* ── Main content ── */}
          <div className="min-w-0">
            {/* search bar */}
            <div className="glass-card p-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by invoice # or client…"
                  className="search-2026 pl-9 h-10"
                />
              </div>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t('no_data')}
                description="Create your first invoice"
                action={
                  <Button onClick={openNew} variant="outline" className="border-border">
                    <Plus className="w-4 h-4 mr-1.5" /> {t('new_invoice')}
                  </Button>
                }
              />
            ) : (
              <InvoiceAccordion
                invoices={filtered}
                onEdit={openEdit}
                onDelete={(inv) => setDeleteTarget(inv)}
                onDownload={handleDownloadPDF}
                downloadingId={downloadingId}
                onMarkPaid={(inv) => updateInvoice.mutateAsync({ id: inv.id, data: { status: 'paid' } })}
              />
            )}
          </div>
        </div>
      </PullToRefresh>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice {deleteTarget?.invoice_number}. The linked trip will revert to "Not Sent" status. Subsequent invoice numbers will be automatically renumbered to maintain a strict sequence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteTarget) {
                  const invNum = deleteTarget.invoice_number;
                  await deleteInvoice.mutateAsync(deleteTarget.id);
                  await restructureInvoiceSequence(invNum);
                  refetch();
                  setDeleteTarget(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InvoiceFormSheet open={formOpen} onOpenChange={setFormOpen} editInvoice={editInvoice} onSaved={() => refetch()} />
    </div>
  );
}