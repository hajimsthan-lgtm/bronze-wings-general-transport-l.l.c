import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Loader2, FileText, SlidersHorizontal, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadQuotationPDF } from '@/lib/quotationPdf';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import QuotationFormSheet from '@/components/quotations/QuotationFormSheet';
import QuotationStatCards from '@/components/quotations/QuotationStatCards';
import QuotationPreview from '@/components/quotations/QuotationPreview';
import DocumentListPane from '@/components/documents/DocumentListPane';
import DocumentDetailPane from '@/components/documents/DocumentDetailPane';
import HeaderActionButton from '@/components/layout/HeaderActionButton';
import DocumentTemplateEditor from '@/components/invoices/template-editor/DocumentTemplateEditor';
import { formatCurrency } from '@/lib/formatters';

const STATUS_CONFIG = {
  draft: { pill: 'bg-muted text-muted-foreground border-border', label: 'Draft' },
  sent: { pill: 'bg-blue-500/15 text-blue-400 border-blue-500/20', label: 'Sent' },
  signed: { pill: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', label: 'Signed' },
  accepted: { pill: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', label: 'Accepted' },
  rejected: { pill: 'bg-red-500/15 text-red-400 border-red-500/20', label: 'Rejected' },
  expired: { pill: 'bg-orange-500/15 text-orange-400 border-orange-500/20', label: 'Expired' },
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'signed', label: 'Signed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
];

const computeTotal = (q) => {
  const subtotal = (q.line_items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const vat = subtotal * (q.vat_rate || 5) / 100;
  return subtotal + vat;
};

export default function Quotations() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('all');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [settings, setSettings] = useState({});
  const [uploadingId, setUploadingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const signedFileRef = useRef(null);

  useEffect(() => {
    getCompanySettings().then(setSettings).catch(() => {});
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, clientData] = await Promise.all([
        base44.entities.Quotation.list('-created_date', 200),
        base44.entities.Client.list('-created_date', 200).catch(() => []),
      ]);
      setList(data || []);
      setClients(clientData || []);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Load error', description: e.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleNew = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (q) => { setEditing(q); setSheetOpen(true); setMobileDetailOpen(false); };

  const handleClientClick = (clientName) => {
    const client = clients.find(c => c.name === clientName);
    if (client) navigate(`/admin/clients/${client.id}`);
  };

  const handleDelete = async () => {
    const q = deleteTarget;
    setDeleteTarget(null);
    if (!q) return;
    try {
      await base44.entities.Quotation.delete(q.id);
      toast({ title: 'Quotation deleted' });
      if (selectedId === q.id) setSelectedId(null);
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete error', description: e.message });
    }
  };

  const handleDownload = async (q) => {
    setDownloadingId(q.id);
    try {
      const settings = await getCompanySettings();
      await downloadQuotationPDF(q, settings);
    } catch (e) {
      toast({ variant: 'destructive', title: 'PDF error', description: e.message });
    } finally {
      setDownloadingId(null);
    }
  };

  const today = () => new Date().toISOString().split('T')[0];

  const handleAttachSigned = async (q, file) => {
    if (!file.type.match(/(pdf|image\/)/)) {
      toast({ variant: 'destructive', title: 'Invalid file type', description: 'Only PDF or image files are allowed.' });
      return;
    }
    setUploadingId(q.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Quotation.update(q.id, {
        signed_quotation_url: file_url,
        signed_date: today(),
        signed_uploaded_by: currentUser?.full_name || currentUser?.email || '—',
        status: 'signed',
      });
      toast({ title: 'Signed copy attached', description: `${q.quotation_number || 'Quotation'} marked as signed.` });
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    } finally {
      setUploadingId(null);
    }
  };

  const handleViewSigned = (q) => {
    if (q?.signed_quotation_url) window.open(q.signed_quotation_url, '_blank');
  };

  const handleDownloadSigned = (q) => {
    if (!q?.signed_quotation_url) return;
    const link = document.createElement('a');
    link.href = q.signed_quotation_url;
    link.download = `Signed-${q.quotation_number || 'Quotation'}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSigned = async (q) => {
    try {
      await base44.entities.Quotation.update(q.id, {
        signed_quotation_url: '',
        signed_date: '',
        signed_uploaded_by: '',
        status: 'sent',
      });
      toast({ title: 'Signed copy removed', description: `${q.quotation_number || 'Quotation'} reverted to not signed.` });
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Remove failed', description: err.message });
    }
  };

  const baseFiltered = useMemo(() => {
    return list.filter(q => {
      const qLower = search.trim().toLowerCase();
      const matchesSearch = !qLower ||
        (q.quotation_number || '').toLowerCase().includes(qLower) ||
        (q.client_name || '').toLowerCase().includes(qLower) ||
        (q.subject || '').toLowerCase().includes(qLower);
      const matchesClient = clientFilter === 'all' || q.client_name === clientFilter;
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesSearch && matchesClient && matchesStatus;
    });
  }, [list, search, clientFilter, statusFilter]);

  const counts = useMemo(() => ({
    all: baseFiltered.length,
    draft: baseFiltered.filter(q => q.status === 'draft').length,
    pending: baseFiltered.filter(q => q.status === 'sent').length,
    signed: baseFiltered.filter(q => !!q.signed_quotation_url || q.status === 'signed').length,
  }), [baseFiltered]);

  const filtered = useMemo(() => {
    if (tab === 'draft') return baseFiltered.filter(q => q.status === 'draft');
    if (tab === 'pending') return baseFiltered.filter(q => q.status === 'sent');
    if (tab === 'signed') return baseFiltered.filter(q => !!q.signed_quotation_url || q.status === 'signed');
    return baseFiltered;
  }, [baseFiltered, tab]);

  const selectedItem = filtered.find(q => q.id === selectedId) || baseFiltered.find(q => q.id === selectedId) || null;
  const activeFilterCount = (clientFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (search ? 1 : 0);

  const tabs = [
    { key: 'all', label: 'All Quotations', count: counts.all },
    { key: 'draft', label: 'Draft', count: counts.draft },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'signed', label: 'Signed', count: counts.signed },
  ];

  const handleSelectRow = (id) => {
    setSelectedId(id);
    if (window.innerWidth < 1024) setMobileDetailOpen(true);
  };

  const totalFields = useMemo(() => {
    if (!selectedItem) return [];
    const subtotal = (selectedItem.line_items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const vat = subtotal * (selectedItem.vat_rate || 5) / 100;
    const total = subtotal + vat;
    return [
      { label: 'Sub Total', key: '_subtotal', format: () => formatCurrency(subtotal) },
      { label: `VAT (${selectedItem.vat_rate || 5}%)`, key: '_vat', format: () => formatCurrency(vat) },
      { label: 'Total', key: '_total', bold: true, format: () => formatCurrency(total) },
    ];
  }, [selectedItem]);

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Quotations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track all your quotations</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setTemplateEditorOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            title="Edit Quotation Template"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <HeaderActionButton label="Create Quotation" variant="trip" onClick={handleNew} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-5">
        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : (
          <QuotationStatCards quotations={list} />
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
        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-40 h-9 text-xs bg-muted/40 border-border">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 text-xs bg-muted/40 border-border">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Two-pane layout */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : baseFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full empty-orb flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {list.length === 0 ? 'No quotations yet' : 'No matches found'}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {list.length === 0 ? 'Create your first quotation to get started.' : 'Try a different search or filter.'}
          </p>
          {list.length === 0 && <Button onClick={handleNew} className="lightning-btn"><Plus className="w-4 h-4 mr-2" />New Quotation</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:h-[calc(100vh-22rem)] min-h-[400px]">
          <div className="lg:col-span-2 min-h-0 h-[50vh] lg:h-full">
            <DocumentListPane
              items={filtered}
              selectedId={selectedId}
              onSelect={handleSelectRow}
              tab={tab}
              onTabChange={setTab}
              tabs={tabs}
              search={search}
              onSearchChange={setSearch}
              statusConfig={STATUS_CONFIG}
              numberField="quotation_number"
              dateField="issue_date"
              dateLabel="Issued"
              computeAmount={computeTotal}
              subtitleField="subject"
              onClientClick={handleClientClick}
            />
          </div>
          <div className="hidden lg:block lg:col-span-3 min-h-0 h-full">
            <DocumentDetailPane
              item={selectedItem}
              statusConfig={STATUS_CONFIG}
              numberField="quotation_number"
              subtitleField="subject"
              subtitleLabel="Subject"
              dateFields={[
                { label: 'Issued', key: 'issue_date' },
                { label: 'Valid Until', key: 'valid_until' },
              ]}
              totalFields={totalFields}
              onClientClick={handleClientClick}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onDownload={handleDownload}
              downloadingId={downloadingId}
              emptyIcon={FileText}
              emptyTitle="Select a quotation"
              emptyDescription="Choose a quotation from the list to view its full details here."
              previewComponent={<QuotationPreview form={selectedItem} settings={settings} />}
              settings={settings}
              docType="quotation"
              signedUrlField="signed_quotation_url"
              onViewSigned={handleViewSigned}
              onDownloadSigned={handleDownloadSigned}
              onDeleteSigned={handleDeleteSigned}
              onAttachSigned={handleAttachSigned}
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
              <SheetTitle className="text-base font-bold">Quotation Details</SheetTitle>
            </div>
          </SheetHeader>
          <div className="h-[calc(90vh-3.5rem)] overflow-hidden">
            <DocumentDetailPane
              item={selectedItem}
              statusConfig={STATUS_CONFIG}
              numberField="quotation_number"
              subtitleField="subject"
              subtitleLabel="Subject"
              dateFields={[
                { label: 'Issued', key: 'issue_date' },
                { label: 'Valid Until', key: 'valid_until' },
              ]}
              totalFields={totalFields}
              onClientClick={handleClientClick}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onDownload={handleDownload}
              downloadingId={downloadingId}
              emptyIcon={FileText}
              emptyTitle="Select a quotation"
              emptyDescription="Choose a quotation from the list to view its full details here."
              previewComponent={<QuotationPreview form={selectedItem} settings={settings} />}
              settings={settings}
              docType="quotation"
              signedUrlField="signed_quotation_url"
              onViewSigned={handleViewSigned}
              onDownloadSigned={handleDownloadSigned}
              onDeleteSigned={handleDeleteSigned}
              onAttachSigned={handleAttachSigned}
              uploadingId={uploadingId}
            />
          </div>
        </SheetContent>
      </Sheet>

      <DocumentTemplateEditor open={templateEditorOpen} onClose={() => setTemplateEditorOpen(false)} documentType="quotation" />

      <QuotationFormSheet open={sheetOpen} onOpenChange={setSheetOpen} quotation={editing} onSaved={load} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete quotation {deleteTarget?.quotation_number}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}