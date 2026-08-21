import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Loader2, FileText, Search, Building2, LayoutTemplate, ArrowLeft, X, Send, Ban } from 'lucide-react';
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
  SelectValue } from
'@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } from
'@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle } from
'@/components/ui/sheet';
import InvoiceFormSheet from '@/components/invoices/InvoiceFormSheet';
import InvoiceCard, { STATUS_OPTIONS } from '@/components/invoices/InvoiceCard';
import InvoiceStatCards from '@/components/invoices/InvoiceStatCards';
import InvoiceListPane from '@/components/invoices/InvoiceListPane';
import InvoiceDetailPane from '@/components/invoices/InvoiceDetailPane';
import PaymentModal from '@/components/invoices/PaymentModal';
import BulkPaymentModal from '@/components/invoices/BulkPaymentModal';
import CancelReasonModal from '@/components/invoices/CancelReasonModal';
import SendForSignatureDialog from '@/components/invoices/SendForSignatureDialog';
import SkipSignatureDialog from '@/components/invoices/SkipSignatureDialog';
import HeaderActionButton from '@/components/layout/HeaderActionButton';
import CustomTemplateManager from '@/components/invoices/CustomTemplateManager';
import TemplateSelectorModal from '@/components/invoices/TemplateSelectorModal';
import { useInvoices, useInvoiceDelete } from '@/hooks/useEntityQueries';
import { restructureInvoiceSequence } from '@/lib/invoiceSequence';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import { deriveStatus, computeTabCounts, filterByTab } from '@/lib/invoiceWorkflow';
import { useInvoicesFilters, setInvoicesClientFilter, setInvoicesStatusFilter, setInvoicesClients } from '@/lib/invoicesStore';

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
  const { clientFilter, statusFilter } = useInvoicesFilters();
  const setClientFilter = setInvoicesClientFilter;
  const setStatusFilter = setInvoicesStatusFilter;
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [paymentModal, setPaymentModal] = useState(null);
  const [bulkPaymentModal, setBulkPaymentModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [signedDocs, setSignedDocs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [sendForSignatureModal, setSendForSignatureModal] = useState(null);
  const [skipSignatureModal, setSkipSignatureModal] = useState(null);
  const [attachTarget, setAttachTarget] = useState(null);
  const attachSignedInputRef = useRef(null);
  const [tab, setTab] = useState('all');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [templateManagerOpen, setTemplateManagerOpen] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [settings, setSettings] = useState({});
  const { dateFrom, dateTo } = useGlobalDate();
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Client.list('-created_date', 500).catch(() => []).then((c) => { setClients(c); setInvoicesClients(c); });
    base44.auth.me().then(setCurrentUser).catch(() => {});
    getCompanySettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    const onNew = () => handleNew();
    const onTemplates = () => setTemplateManagerOpen(true);
    window.addEventListener('invoices:new', onNew);
    window.addEventListener('invoices:templates', onTemplates);
    return () => {
      window.removeEventListener('invoices:new', onNew);
      window.removeEventListener('invoices:templates', onTemplates);
    };
  }, []);

  const handleClientClick = (clientName) => {
    const client = clients.find((c) => c.name === clientName);
    if (client) navigate(`/admin/clients/${client.id}`);
  };

  const deletePaymentsForInvoice = async (inv) => {
    const payments = await base44.entities.ClientPayment.filter({ client_name: inv.client_name }, '-created_date', 200).catch(() => []);
    const linked = (payments || []).filter((p) => (p.allocated_invoices || []).some((a) => a.invoice_id === inv.id));
    if (linked.length === 0) return 0;
    await Promise.all(linked.map((p) => base44.entities.ClientPayment.delete(p.id)));
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
  const handleEdit = (inv) => {setEditing(inv);setSheetOpen(true);setMobileDetailOpen(false);};

  const handleAction = (actionKey, inv) => {
    switch (actionKey) {
      case 'sendForSignature':
        setSendForSignatureModal(inv);
        break;
      case 'attachSigned':
        setAttachTarget(inv);
        attachSignedInputRef.current?.click();
        break;
      case 'skipSignature':
        setSkipSignatureModal(inv);
        break;
      case 'recordPayment':
        setPaymentModal({ inv, mode: 'paid' });
        break;
      case 'cancel':
        setCancelModal(inv);
        break;
    }
  };

  const doStatusUpdate = async (inv, newStatus, extraData = {}) => {
    try {
      await base44.entities.Invoice.update(inv.id, { status: newStatus, ...extraData });
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
        paid_amount: newPaidAmount
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
          is_selected: true
        }],
        unapplied_balance: 0,
        status: 'completed',
        notes: payData.notes
      });
      toast({
        title: actualStatus === 'paid' ? 'Invoice Paid' : 'Partial Payment Recorded',
        description: `${inv.invoice_number} — AED ${payData.amount.toFixed(2)} received`
      });
      refetch();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleCancelConfirm = async (reason) => {
    if (cancelModal?.bulk) {
      try {
        const updates = Array.from(selected).map((id) => ({ id, status: 'cancelled', voided: true, void_reason: reason }));
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

  const handleAttachSigned = async (inv, file) => {
    // Validate file type (PDF or image only)
    if (!file.type.match(/(pdf|image\/)/)) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Only PDF or image files are allowed.' });
      return;
    }
    setUploadingId(inv.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const uploadedBy = currentUser?.full_name || currentUser?.email || '—';
      await base44.entities.Invoice.update(inv.id, {
        signed_invoice_url: file_url,
        signed_date: today,
        signed_uploaded_by: uploadedBy,
        status: 'signed',
        signature_skipped: false
      });
      await base44.entities.SignedDocument.create({
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        client_name: inv.client_name,
        file_url: file_url,
        file_name: file.name,
        uploaded_by: uploadedBy,
        upload_date: today,
        upload_datetime: now.toISOString()
      });
      const client = clients.find((c) => c.name === inv.client_name);
      if (client) {
        await base44.entities.Document.create({
          title: `Signed Invoice ${inv.invoice_number}`,
          type: 'invoice',
          related_entity: 'Client',
          related_id: client.id,
          file_url: file_url,
          notes: `Signed by client for ${inv.invoice_number}`
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

  const handleViewSigned = (inv) => {
    const url = inv.signed_invoice_url || inv.file_url;
    if (url) window.open(url, '_blank');
  };

  const handleDownloadSigned = (inv) => {
    const url = inv.signed_invoice_url || inv.file_url;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `Signed_${inv.invoice_number || 'invoice'}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDeleteSigned = async (inv) => {
    try {
      await base44.entities.Invoice.update(inv.id, {
        signed_invoice_url: '',
        signed_date: '',
        signed_uploaded_by: '',
        status: 'unsigned',
        signature_skipped: false
      });
      toast({ title: 'Signed copy removed', description: `${inv.invoice_number} reverted to unsigned.` });
      refetch();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Remove failed', description: e.message });
    }
  };

  const handleSendForSignature = async (inv) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await base44.entities.Invoice.update(inv.id, {
        status: 'unsigned',
        sent_for_signature_date: today
      });
      toast({ title: 'Sent for signature', description: `${inv.invoice_number} → Unsigned` });
      refetch();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleSkipSignature = async (inv) => {
    try {
      await base44.entities.Invoice.update(inv.id, {
        status: 'sent',
        signature_skipped: true
      });
      toast({ title: 'Signature skipped', description: `${inv.invoice_number} → Sent (payment-ready)` });
      refetch();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleAttachSignedFromMenu = (e) => {
    if (e.target.files[0] && attachTarget) {
      handleAttachSigned(attachTarget, e.target.files[0]);
    }
    e.target.value = '';
    setAttachTarget(null);
  };

  const handleBulkAction = async (actionKey) => {
    const selectedInvoices = allInvoices.filter((inv) => selected.has(inv.id));
    if (selectedInvoices.length === 0) return;
    if (actionKey === 'sendForSignature') {
      try {
        const today = new Date().toISOString().split('T')[0];
        const draftOnes = selectedInvoices.filter((inv) => deriveStatus(inv) === 'draft');
        if (draftOnes.length === 0) {
          toast({ title: 'No draft invoices selected', description: 'Only draft invoices can be sent for signature.' });
          return;
        }
        await base44.entities.Invoice.bulkUpdate(
          draftOnes.map((inv) => ({ id: inv.id, status: 'unsigned', sent_for_signature_date: today }))
        );
        toast({ title: `${draftOnes.length} invoices sent for signature` });
        setSelected(new Set());
        refetch();
      } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
      }
      return;
    }
    if (actionKey === 'cancel') {
      setCancelModal({ bulk: true });
      return;
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
      const selectedInvoices = allInvoices.filter((inv) => selected.has(inv.id));
      const revertingTo = bulkStatus === 'draft' || bulkStatus === 'sent';
      if (revertingTo) {
        const paidOnes = selectedInvoices.filter((inv) => inv.status === 'paid' || inv.status === 'partially_paid');
        if (paidOnes.length > 0) {
          await Promise.all(paidOnes.map((inv) => deletePaymentsForInvoice(inv)));
        }
      }
      const updates = selectedInvoices.map((inv) => {
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
    const selectedInvoices = allInvoices.filter((inv) => selected.has(inv.id));
    if (selectedInvoices.length === 0) return;
    try {
      await base44.entities.ClientPayment.create({
        reference_number: payData.reference,
        client_name: selectedInvoices[0]?.client_name || '',
        amount: payData.amount,
        payment_date: payData.date,
        payment_mode: payData.mode,
        allocated_invoices: payData.allocations.map((a) => ({
          invoice_id: a.invoice_id,
          invoice_number: a.invoice_number,
          invoice_total: a.invoice_total,
          allocated_amount: a.allocated_amount,
          is_selected: true
        })),
        unapplied_balance: payData.amount - payData.allocations.reduce((s, a) => s + a.allocated_amount, 0),
        status: 'completed',
        notes: payData.notes
      });
      await base44.entities.Invoice.bulkUpdate(
        payData.allocations.map((a) => {
          const inv = selectedInvoices.find((i) => i.id === a.invoice_id);
          const newPaid = (Number(inv?.paid_amount) || 0) + a.allocated_amount;
          const newStatus = newPaid >= (Number(a.invoice_total) || 0) - 0.01 ? 'paid' : 'partially_paid';
          return { id: a.invoice_id, paid_amount: newPaid, status: newStatus };
        })
      );
      toast({
        title: 'Bulk Payment Recorded',
        description: `${payData.allocations.length} invoices — AED ${payData.amount.toFixed(2)} allocated (FIFO)`
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
    setSelected((prev) => {
      const n = new Set(prev);
      if (checked) n.add(id);else n.delete(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((inv) => inv.id)));
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
    return allInvoices.filter((inv) => {
      const matchesDate = !inv.issue_date || (!dateFrom || inv.issue_date >= dateFrom) && (!dateTo || inv.issue_date <= dateTo);
      const matchesClient = clientFilter === 'all' || inv.client_name === clientFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || (inv.invoice_number || '').toLowerCase().includes(q) || (inv.client_name || '').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || deriveStatus(inv) === statusFilter;
      return matchesDate && matchesClient && matchesSearch && matchesStatus;
    });
  }, [allInvoices, dateFrom, dateTo, clientFilter, search, statusFilter]);

  // Tab counts — derived from action-based status logic
  const counts = useMemo(() => computeTabCounts(baseFiltered), [baseFiltered]);

  // Tab-filtered list
  const filtered = useMemo(() => filterByTab(baseFiltered, tab), [baseFiltered, tab]);

  const selectedInvoice = filtered.find((i) => i.id === selectedId) || baseFiltered.find((i) => i.id === selectedId) || null;
  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  useEffect(() => {
    if (!selectedInvoice) {setSignedDocs([]);setPayments([]);return;}
    base44.entities.SignedDocument.filter({ invoice_id: selectedInvoice.id }, '-upload_date', 50).
    then(setSignedDocs).catch(() => setSignedDocs([]));
    base44.entities.ClientPayment.filter({ client_name: selectedInvoice.client_name }, '-created_date', 100).
    then((allPays) => {
      const linked = (allPays || []).filter((p) =>
      (p.allocated_invoices || []).some((a) => a.invoice_id === selectedInvoice.id)
      );
      setPayments(linked);
    }).
    catch(() => setPayments([]));
  }, [selectedInvoice?.id]);

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
      <div className="mb-4">
        
        
      </div>

      {/* Stat cards */}
      <div className="mb-5">
        {loading ?
        <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div> :

        <InvoiceStatCards invoices={allInvoices} />
        }
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 &&
      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-primary/10 border border-primary/30">
          <span className="text-sm font-semibold text-primary">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('sendForSignature')} className="h-8 border-primary/30 text-primary hover:bg-primary/10">
            <Send className="w-3.5 h-3.5 mr-1.5" /> Send for Signature
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleBulkAction('cancel')} className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10">
            <Ban className="w-3.5 h-3.5 mr-1.5" /> Cancel
          </Button>
          <Button size="sm" variant="outline" onClick={() => setSelected(new Set())} className="h-8">Clear</Button>
        </div>
      }

      {/* Two-pane layout */}
      {loading ?
      <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div> :
      baseFiltered.length === 0 ?
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
          {allInvoices.length === 0 &&
        <Button onClick={handleNew} className="lightning-btn"><Plus className="w-4 h-4 mr-2" />New Invoice</Button>
        }
        </div> :

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:h-[calc(100vh-18rem)] min-h-[400px]">
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
            onAction={handleAction} />
          
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
            onAction={handleAction}
            downloadingId={downloadingId}
            uploadingId={uploadingId}
            signedDocs={signedDocs}
            onViewSigned={handleViewSigned}
            onDownloadSigned={handleDownloadSigned}
            onDeleteSigned={handleDeleteSigned}
            payments={payments}
            settings={settings} />
          
              </div>
              </div>
      }

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
              onAction={handleAction}
              downloadingId={downloadingId}
              uploadingId={uploadingId}
              signedDocs={signedDocs}
              onViewSigned={handleViewSigned}
              onDownloadSigned={handleDownloadSigned}
              onDeleteSigned={handleDeleteSigned}
              payments={payments}
              settings={settings} />
            
              </div>
              </SheetContent>
              </Sheet>

      <InvoiceFormSheet open={sheetOpen} onOpenChange={setSheetOpen} editInvoice={editing} onSaved={refetch} customTemplateId={selectedTemplateId} />

      <PaymentModal
        invoice={paymentModal?.inv}
        mode={paymentModal?.mode}
        open={!!paymentModal}
        onOpenChange={(open) => {if (!open) setPaymentModal(null);}}
        onConfirm={handlePaymentConfirm} />
      

      <BulkPaymentModal
        invoices={allInvoices.filter((inv) => selected.has(inv.id))}
        open={bulkPaymentModal}
        onOpenChange={setBulkPaymentModal}
        onConfirm={handleBulkPaymentConfirm} />
      

      <CancelReasonModal
        invoice={cancelModal}
        open={!!cancelModal}
        onOpenChange={(open) => {if (!open) setCancelModal(null);}}
        onConfirm={handleCancelConfirm} />
      

      <SendForSignatureDialog
        invoice={sendForSignatureModal}
        open={!!sendForSignatureModal}
        onOpenChange={(open) => {if (!open) setSendForSignatureModal(null);}}
        onConfirm={handleSendForSignature} />
      

      <SkipSignatureDialog
        invoice={skipSignatureModal}
        open={!!skipSignatureModal}
        onOpenChange={(open) => {if (!open) setSkipSignatureModal(null);}}
        onConfirm={handleSkipSignature} />
      

      <input ref={attachSignedInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleAttachSignedFromMenu} />

      <CustomTemplateManager open={templateManagerOpen} onClose={() => setTemplateManagerOpen(false)} documentType="invoice" />

      <TemplateSelectorModal open={templateSelectorOpen} onClose={() => setTemplateSelectorOpen(false)} onSelect={handleTemplateSelect} documentType="invoice" />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => {if (!open) setDeleteTarget(null);}}>
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
    </div>);

}