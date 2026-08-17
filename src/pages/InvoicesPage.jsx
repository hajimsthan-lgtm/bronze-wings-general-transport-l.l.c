import { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, FileText, Search, Building2, LayoutTemplate, ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadInvoicePDF, downloadMonthlyInvoicePDF } from '@/lib/invoiceHtml';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import InvoiceFormSheet from '@/components/invoices/InvoiceFormSheet';
import InvoiceCard, { STATUS_OPTIONS } from '@/components/invoices/InvoiceCard';
import InvoiceStatCards from '@/components/invoices/InvoiceStatCards';
import InvoiceListPane from '@/components/invoices/InvoiceListPane';
import InvoiceDetailPane from '@/components/invoices/InvoiceDetailPane';
import PaymentModal from '@/components/invoices/PaymentModal';
import BulkPaymentModal from '@/components/invoices/BulkPaymentModal';
import CancelReasonModal from '@/components/invoices/CancelReasonModal';
import HeaderActionButton from '@/components/layout/HeaderActionButton';
import CustomTemplateManager from '@/components/invoices/CustomTemplateManager';
import TemplateSelectorModal from '@/components/invoices/TemplateSelectorModal';
import { useInvoices, useInvoiceDelete } from '@/hooks/useEntityQueries';
import { restructureInvoiceSequence } from '@/lib/invoiceSequence';
import { useGlobalDate } from '@/lib/GlobalDateContext';

export default function InvoicesPage() {
  const { toast } = useToast();
  const { data: allInvoices = [], isLoading: loading, refetch } = useInvoices();
  const deleteInvoice = useInvoiceDelete();
  const [clients, setClients] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [paymentModal, setPaymentModal] = useState(null);
  const [bulkPaymentModal, setBulkPaymentModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('all');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const { dateFrom, dateTo } = useGlobalDate();
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Client.list('-created_date', 500).catch(() => []).then(setClients);
  }, []);

  const handleClientClick = (clientName) => {
    const client = clients.find(c => c.name === clientName);
    if (client) navigate(`/admin/clients/${client.id}`);
  };

  const deletePaymentsForInvoice = async (inv) => {
    const payments = await base44.entities.ClientPayment.filter({ client_name: inv.client_name }, '-created_date', 200).catch(() => []);
    const linked = (payments || []).filter(p => (p.allocated_invoices || []).some(a => a.invoice_id === inv.id));
    if (linked.length === 0) return 0;
    await Promise.all(linked.map(p => base44.entities.ClientPayment.delete(p.id)));
    return linked.length;
  };

  const handleNew = async () => {
    setEditing(null);
    try {
      const customTpls = await base44.entities.CustomTemplate.filter({ document_type: 'invoice' }, '-updated_date', 100).catch(() => []);
      if (customTpls.length > 0) {
        setTemplateSelectorOpen(true);
      } else {
        setSelectedTemplateId(null);
        setSheetOpen(true);
      }
    } catch {
      setSelectedTemplateId(null);
      setSheetOpen(true);
    }
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    setSheetOpen(true);
  };
  const handleEdit = (inv) => { setEditing(inv); setSheetOpen(true); setMobileDetailOpen(false); };

  const handleStatusChangeRequest = (inv, newStatus) => {
    if (newStatus === 'paid' || newStatus === 'partially_paid') {
      setPaymentModal({ inv, mode: newStatus });
    } else if (newStatus === 'cancelled') {
      setCancelModal(inv);
    } else {
      doStatusUpdate(inv, newStatus);
    }
  };

  const doStatusUpdate = async (inv, newStatus, extraData = {}) => {
    try {
      const wasPaid = inv.status === 'paid' || inv.status === 'partially_paid';
      const reverting = wasPaid && (newStatus === 'draft' || newStatus === 'sent');
      const patch = { status: newStatus, ...extraData };
      if (reverting) {
        const deletedCount = await deletePaymentsForInvoice(inv);
        patch.paid_amount = 0;
        if (deletedCount > 0) {
          toast({ title: 'Payment records removed', description: `${deletedCount} payment(s) deleted for ${inv.invoice_number}` });
        }
      }
      await base44.entities.Invoice.update(inv.id, patch);
      toast({ title: 'Status updated', description: `${inv.invoice_number} → ${newStatus.replace(/_/g, ' ')}` });
      refetch();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handlePaymentConfirm = async (payData) => {
    const inv = paymentModal?.inv;
    const requestedMode = paymentModal?.mode;
    if (!inv) return;
    const total = Number(inv.total_amount || 0);
    const alreadyPaid = Number(inv.paid_amount || 0);
    const newPaidAmount = alreadyPaid + payData.amount;
    const actualStatus = newPaidAmount >= total ? 'paid' : 'partially_paid';
    try {
      await base44.entities.Invoice.update(inv.id, {
        status: actualStatus,
        paid_amount: newPaidAmount,
      });
      await base44.entities.ClientPayment.create({
        reference_number: payData.reference,
        client_name: inv.client_name,
        amount: payData.amount,
        payment_date: payData.date,
        payment_mode: payData.mode,
        allocated_invoices: [{
          invoice_id: inv.id,
          invoice_number: inv.invoice_number,
          invoice_total: total,
          allocated_amount: payData.amount,
          is_selected: true,
        }],
        unapplied_balance: 0,
        status: 'completed',
        notes: payData.notes,
      });
      toast({
        title: actualStatus === 'paid' ? 'Invoice Paid' : 'Partial Payment Recorded',
        description: `${inv.invoice_number} — AED ${payData.amount.toFixed(2)} received`,
      });
      refetch();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleCancelConfirm = async (reason) => {
    if (cancelModal?.bulk) {
      try {
        const updates = Array.from(selected).map(id => ({ id, status: 'cancelled', voided: true, void_reason: reason }));
        await base44.entities.Invoice.bulkUpdate(updates);
        toast({ title: `${selected.size} invoices cancelled` });
        setSelected(new Set());
        setBulkStatus('');
        setCancelModal(null);
        refetch();
      } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
      }
      return;
    }
    const inv = cancelModal;
    if (!inv) return;
    await doStatusUpdate(inv, 'cancelled', { voided: true, void_reason: reason });
  };

  // Auto-overdue
  useEffect(() => {
    if (!allInvoices.length) return;
    const today = new Date().toISOString().split('T')[0];
    const toUpdate = allInvoices.filter(inv =>
      inv.due_date &&
      inv.due_date < today &&
      (inv.status === 'draft' || inv.status === 'sent' || inv.status === 'partially_paid') &&
      !inv.voided
    );
    if (toUpdate.length === 0) return;
    base44.entities.Invoice.bulkUpdate(
      toUpdate.map(inv => ({ id: inv.id, status: 'overdue' }))
    ).then(() => refetch()).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allInvoices.length]);

  const handleAttachSigned = async (inv, file) => {
    setUploadingId(inv.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const today = new Date().toISOString().split('T')[0];
      await base44.entities.Invoice.update(inv.id, { signed_invoice_url: file_url, signed_date: today });
      const client = clients.find(c => c.name === inv.client_name);
      if (client) {
        await base44.entities.Document.create({
          title: `Signed Invoice ${inv.invoice_number}`,
          type: 'invoice',
          related_entity: 'Client',
          related_id: client.id,
          file_url: file_url,
          notes: `Signed by client for ${inv.invoice_number}`,
        }).catch(() => {});
      }
      toast({ title: 'Signed invoice attached', description: inv.invoice_number });
      refetch();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Upload error', description: e.message });
    } finally {
      setUploadingId(null);
    }
  };

  const handleBulkStatusChange = async () => {
    if (selected.size === 0 || !bulkStatus) return;
    if (bulkStatus === 'paid' || bulkStatus === 'partially_paid') {
      setBulkPaymentModal(true);
      return;
    }
    if (bulkStatus === 'cancelled') {
      setCancelModal({ bulk: true });
      return;
    }
    try {
      const selectedInvoices = allInvoices.filter(inv => selected.has(inv.id));
      const revertingTo = bulkStatus === 'draft' || bulkStatus === 'sent';
      if (revertingTo) {
        const paidOnes = selectedInvoices.filter(inv => inv.status === 'paid' || inv.status === 'partially_paid');
        if (paidOnes.length > 0) {
          await Promise.all(paidOnes.map(inv => deletePaymentsForInvoice(inv)));
        }
      }
      const updates = selectedInvoices.map(inv => {
        const patch = { id: inv.id, status: bulkStatus };
        if (revertingTo && (inv.status === 'paid' || inv.status === 'partially_paid')) {
          patch.paid_amount = 0;
        }
        return patch;
      });
      await base44.entities.Invoice.bulkUpdate(updates);
      toast({ title: `${selected.size} invoices updated` });
      setSelected(new Set());
      setBulkStatus('');
      refetch();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleBulkPaymentConfirm = async (payData) => {
    const selectedInvoices = allInvoices.filter(inv => selected.has(inv.id));
    if (selectedInvoices.length === 0) return;
    try {
      await base44.entities.ClientPayment.create({
        reference_number: payData.reference,
        client_name: selectedInvoices[0]?.client_name || '',
        amount: payData.amount,
        payment_date: payData.date,
        payment_mode: payData.mode,
        allocated_invoices: payData.allocations.map(a => ({
          invoice_id: a.invoice_id,
          invoice_number: a.invoice_number,
          invoice_total: a.invoice_total,
          allocated_amount: a.allocated_amount,
          is_selected: true,
        })),
        unapplied_balance: payData.amount - payData.allocations.reduce((s, a) => s + a.allocated_amount, 0),
        status: 'completed',
        notes: payData.notes,
      });
      await base44.entities.Invoice.bulkUpdate(
        payData.allocations.map(a => {
          const inv = selectedInvoices.find(i => i.id === a.invoice_id);
          const newPaid = (Number(inv?.paid_amount) || 0) + a.allocated_amount;
          const newStatus = newPaid >= (Number(a.invoice_total) || 0) - 0.01 ? 'paid' : 'partially_paid';
          return { id: a.invoice_id, paid_amount: newPaid, status: newStatus };
        })
      );
      toast({
        title: 'Bulk Payment Recorded',
        description: `${payData.allocations.length} invoices — AED ${payData.amount.toFixed(2)} allocated (FIFO)`,
      });
      setSelected(new Set());
      setBulkStatus('');
      setBulkPaymentModal(false);
      refetch();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const toggleSelect = (id, checked) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (checked) n.add(id); else n.delete(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(inv => inv.id)));
    }
  };

  const confirmDelete = async () => {
    const inv = deleteTarget;
    setDeleteTarget(null);
    if (!inv) return;
    try {
      const invNum = inv.invoice_number;
      await deleteInvoice.mutateAsync(inv.id);
      await restructureInvoiceSequence(invNum);
      toast({ title: 'Invoice deleted' });
      if (selectedId === inv.id) setSelectedId(null);
      refetch();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete error', description: e.message });
    }
  };

  const handleDownload = async (inv) => {
    setDownloadingId(inv.id);
    try {
      const settings = await getCompanySettings();
      const isMonthly = /Rental|Contract/i.test(inv.line_items?.[0]?.description || '');
      const downloader = isMonthly ? downloadMonthlyInvoicePDF : downloadInvoicePDF;
      await downloader(inv, inv.client_name, settings);
    } catch (e) {
      toast({ variant: 'destructive', title: 'PDF error', description: e.message });
    } finally {
      setDownloadingId(null);
    }
  };

  // Base filter (date + client + search + status)
  const baseFiltered = useMemo(() => {
    return allInvoices.filter(inv => {
      const matchesDate = !inv.issue_date || ((!dateFrom || inv.issue_date >= dateFrom) && (!dateTo || inv.issue_date <= dateTo));
      const matchesClient = clientFilter === 'all' || inv.client_name === clientFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || (inv.invoice_number || '').toLowerCase().includes(q) || (inv.client_name || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesDate && matchesClient && matchesSearch && matchesStatus;
    });
  }, [allInvoices, dateFrom, dateTo, clientFilter, search, statusFilter]);

  // Tab counts
  const counts = useMemo(() => ({
    all: baseFiltered.length,
    draft: baseFiltered.filter(i => i.status === 'draft').length,
    unpaid: baseFiltered.filter(i => i.status !== 'paid' && i.status !== 'cancelled').length,
    signed: baseFiltered.filter(i => !!i.signed_invoice_url).length,
    unsigned: baseFiltered.filter(i => !i.signed_invoice_url).length,
  }), [baseFiltered]);

  // Tab-filtered list
  const filtered = useMemo(() => {
    if (tab === 'draft') return baseFiltered.filter(i => i.status === 'draft');
    if (tab === 'unpaid') return baseFiltered.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
    if (tab === 'signed') return baseFiltered.filter(i => !!i.signed_invoice_url);
    if (tab === 'unsigned') return baseFiltered.filter(i => !i.signed_invoice_url);
    return baseFiltered;
  }, [baseFiltered, tab]);

  const selectedInvoice = filtered.find(i => i.id === selectedId) || baseFiltered.find(i => i.id === selectedId) || null;
  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  const activeFilterCount = (clientFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (search ? 1 : 0) + (dateFrom || dateTo ? 1 : 0);

  const handleSelectRow = (id) => {
    setSelectedId(id);
    if (window.innerWidth < 1024) {
      setMobileDetailOpen(true);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track all your invoices</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setTemplateManagerOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            title="Custom Templates"
          >
            <LayoutTemplate className="w-4 h-4" />
          </button>
          <HeaderActionButton
            label="Create Invoice"
            variant="trip"
            onClick={handleNew}
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-5">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <InvoiceStatCards invoices={allInvoices} />
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/25">
            {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
            <button onClick={() => { setClientFilter('all'); setStatusFilter('all'); setSearch(''); }} className="ml-0.5 hover:opacity-70">
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        <div className="relative">
          <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-40 pl-8 h-9 text-xs bg-muted/40 border-border">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-xs bg-muted/40 border-border">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-primary/10 border border-primary/30">
          <span className="text-sm font-semibold text-primary">{selected.size} selected</span>
          <Select value={bulkStatus} onValueChange={setBulkStatus}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue placeholder="Change status to..." />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBulkStatusChange} disabled={!bulkStatus} className="h-8">Apply</Button>
          <Button size="sm" variant="outline" onClick={() => { setSelected(new Set()); setBulkStatus(''); }} className="h-8">Clear</Button>
        </div>
      )}

      {/* Two-pane layout */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : baseFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full empty-orb flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {allInvoices.length === 0 ? 'No invoices yet' : 'No matches found'}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {allInvoices.length === 0 ? 'Create your first invoice to get started.' : 'Try a different search or filter.'}
          </p>
          {allInvoices.length === 0 && (
            <Button onClick={handleNew} className="lightning-btn"><Plus className="w-4 h-4 mr-2" />New Invoice</Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:h-[calc(100vh-22rem)] min-h-[400px]">
          {/* Left pane — list */}
          <div className="lg:col-span-2 min-h-0 h-[50vh] lg:h-full">
            <InvoiceListPane
              invoices={filtered}
              selectedId={selectedId}
              onSelect={handleSelectRow}
              tab={tab}
              onTabChange={setTab}
              counts={counts}
              search={search}
              onSearchChange={setSearch}
              selectedSet={selected}
              onToggleSelect={toggleSelect}
              allSelected={allSelected}
              onToggleSelectAll={toggleSelectAll}
              onClientClick={handleClientClick}
              onStatusChange={handleStatusChangeRequest}
            />
          </div>

          {/* Right pane — detail (desktop) */}
          <div className="hidden lg:block lg:col-span-3 min-h-0 h-full">
            <InvoiceDetailPane
              inv={selectedInvoice}
              clients={clients}
              onClientClick={handleClientClick}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onDownload={handleDownload}
              onAttachSigned={handleAttachSigned}
              onStatusChangeRequest={handleStatusChangeRequest}
              downloadingId={downloadingId}
              uploadingId={uploadingId}
            />
          </div>
        </div>
      )}

      {/* Mobile detail sheet */}
      <Sheet open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
        <SheetContent side="bottom" className="h-[90vh] p-0 overflow-hidden">
          <SheetHeader className="px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <button onClick={() => setMobileDetailOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center border border-border/50">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <SheetTitle className="text-base font-bold">Invoice Details</SheetTitle>
            </div>
          </SheetHeader>
          <div className="h-[calc(90vh-3.5rem)] overflow-hidden">
            <InvoiceDetailPane
              inv={selectedInvoice}
              clients={clients}
              onClientClick={handleClientClick}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onDownload={handleDownload}
              onAttachSigned={handleAttachSigned}
              onStatusChangeRequest={handleStatusChangeRequest}
              downloadingId={downloadingId}
              uploadingId={uploadingId}
            />
          </div>
        </SheetContent>
      </Sheet>

      <InvoiceFormSheet open={sheetOpen} onOpenChange={setSheetOpen} editInvoice={editing} onSaved={refetch} customTemplateId={selectedTemplateId} />

      <PaymentModal
        invoice={paymentModal?.inv}
        mode={paymentModal?.mode}
        open={!!paymentModal}
        onOpenChange={(open) => { if (!open) setPaymentModal(null); }}
        onConfirm={handlePaymentConfirm}
      />

      <BulkPaymentModal
        invoices={allInvoices.filter(inv => selected.has(inv.id))}
        open={bulkPaymentModal}
        onOpenChange={setBulkPaymentModal}
        onConfirm={handleBulkPaymentConfirm}
      />

      <CancelReasonModal
        invoice={cancelModal}
        open={!!cancelModal}
        onOpenChange={(open) => { if (!open) setCancelModal(null); }}
        onConfirm={handleCancelConfirm}
      />

      <CustomTemplateManager open={templateManagerOpen} onClose={() => setTemplateManagerOpen(false)} documentType="invoice" />

      <TemplateSelectorModal open={templateSelectorOpen} onClose={() => setTemplateSelectorOpen(false)} onSelect={handleTemplateSelect} documentType="invoice" />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice {deleteTarget?.invoice_number}. Subsequent invoice numbers will be automatically renumbered to maintain a strict sequence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}