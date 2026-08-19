import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Plus, Loader2, FileSignature, SlidersHorizontal, X, ArrowLeft, Upload, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadAgreementPDF } from '@/lib/agreementPdf';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { signatureFlag, deriveStatus } from '@/lib/agreementWorkflow';
import AgreementActionsMenu from '@/components/agreements/AgreementActionsMenu';
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
import AgreementFormSheet from '@/components/agreements/AgreementFormSheet';
import AgreementStatCards from '@/components/agreements/AgreementStatCards';
import AgreementPreview from '@/components/agreements/AgreementPreview';
import DocumentListPane from '@/components/documents/DocumentListPane';
import DocumentDetailPane from '@/components/documents/DocumentDetailPane';
import HeaderActionButton from '@/components/layout/HeaderActionButton';
import DocumentTemplateEditor from '@/components/invoices/template-editor/DocumentTemplateEditor';
import { formatCurrency } from '@/lib/formatters';

const STATUS_CONFIG = {
  draft: { pill: 'bg-muted text-muted-foreground border-border', label: 'Draft' },
  sent: { pill: 'bg-blue-500/15 text-blue-400 border-blue-500/20', label: 'Sent' },
  signed: { pill: 'bg-purple-500/15 text-purple-400 border-purple-500/20', label: 'Signed' },
  active: { pill: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', label: 'Active' },
  expired: { pill: 'bg-orange-500/15 text-orange-400 border-orange-500/20', label: 'Expired' },
  terminated: { pill: 'bg-red-500/15 text-red-400 border-red-500/20', label: 'Terminated' },
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'signed', label: 'Signed' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'terminated', label: 'Terminated' },
];

export default function Agreements() {
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
  const signedFileRef = useRef(null);
  const [attachTarget, setAttachTarget] = useState(null);

  useEffect(() => { getCompanySettings().then(setSettings).catch(() => {}); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, clientData] = await Promise.all([
        base44.entities.Agreement.list('-created_date', 200),
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
  const handleEdit = (a) => { setEditing(a); setSheetOpen(true); setMobileDetailOpen(false); };

  const handleClientClick = (clientName) => {
    const client = clients.find(c => c.name === clientName);
    if (client) navigate(`/admin/clients/${client.id}`);
  };

  const handleDelete = async () => {
    const a = deleteTarget;
    setDeleteTarget(null);
    if (!a) return;
    try {
      await base44.entities.Agreement.delete(a.id);
      toast({ title: 'Agreement deleted' });
      if (selectedId === a.id) setSelectedId(null);
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete error', description: e.message });
    }
  };

  const handleDownload = async (a) => {
    setDownloadingId(a.id);
    try {
      const settings = await getCompanySettings();
      await downloadAgreementPDF(a, settings);
    } catch (e) {
      toast({ variant: 'destructive', title: 'PDF error', description: e.message });
    } finally {
      setDownloadingId(null);
    }
  };

  const today = () => new Date().toISOString().split('T')[0];

  const handleAction = async (key, a) => {
    try {
      if (key === 'sendForSignature') {
        await base44.entities.Agreement.update(a.id, {
          sent_for_signature_date: today(),
          status: 'sent',
        });
        toast({ title: 'Sent for signature', description: `${a.agreement_number || 'Agreement'} marked as sent for signature.` });
      } else if (key === 'skipSignature') {
        await base44.entities.Agreement.update(a.id, {
          signature_skipped: true,
          status: 'sent',
        });
        toast({ title: 'Signature skipped', description: `${a.agreement_number || 'Agreement'} marked as sent.` });
      } else if (key === 'markActive') {
        await base44.entities.Agreement.update(a.id, { status: 'active' });
        toast({ title: 'Agreement activated', description: `${a.agreement_number || 'Agreement'} is now active.` });
      } else if (key === 'terminate') {
        await base44.entities.Agreement.update(a.id, { status: 'terminated' });
        toast({ title: 'Agreement terminated', description: `${a.agreement_number || 'Agreement'} has been terminated.` });
      } else if (key === 'attachSigned') {
        setAttachTarget(a);
        // trigger file picker on next tick
        setTimeout(() => signedFileRef.current?.click(), 50);
        return;
      }
      load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Action failed', description: e.message });
    }
  };

  const handleSignedFile = async (e) => {
    const file = e.target.files[0];
    const target = attachTarget;
    setAttachTarget(null);
    e.target.value = '';
    if (!file || !target) return;
    setUploadingId(target.id);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.Agreement.update(target.id, {
        signed_agreement_url: file_url,
        signed_date: today(),
        status: 'signed',
      });
      toast({ title: 'Signed copy attached', description: `${target.agreement_number || 'Agreement'} marked as signed.` });
      load();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Upload failed', description: err.message });
    } finally {
      setUploadingId(null);
    }
  };

  const baseFiltered = useMemo(() => {
    return list.filter(a => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q ||
        (a.agreement_number || '').toLowerCase().includes(q) ||
        (a.client_name || '').toLowerCase().includes(q) ||
        (a.title || '').toLowerCase().includes(q);
      const matchesClient = clientFilter === 'all' || a.client_name === clientFilter;
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesClient && matchesStatus;
    });
  }, [list, search, clientFilter, statusFilter]);

  const counts = useMemo(() => ({
    all: baseFiltered.length,
    draft: baseFiltered.filter(a => a.status === 'draft').length,
    active: baseFiltered.filter(a => a.status === 'active' || a.status === 'signed').length,
  }), [baseFiltered]);

  const filtered = useMemo(() => {
    if (tab === 'draft') return baseFiltered.filter(a => a.status === 'draft');
    if (tab === 'active') return baseFiltered.filter(a => a.status === 'active' || a.status === 'signed');
    return baseFiltered;
  }, [baseFiltered, tab]);

  const selectedItem = filtered.find(a => a.id === selectedId) || baseFiltered.find(a => a.id === selectedId) || null;
  const activeFilterCount = (clientFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (search ? 1 : 0);
  const itemFlag = selectedItem ? signatureFlag(selectedItem) : null;
  const isUploading = uploadingId === selectedItem?.id;
  const isSigned = !!selectedItem?.signed_agreement_url;

  const tabs = [
    { key: 'all', label: 'All Agreements', count: counts.all },
    { key: 'draft', label: 'Draft', count: counts.draft },
    { key: 'active', label: 'Active', count: counts.active },
  ];

  const handleSelectRow = (id) => {
    setSelectedId(id);
    if (window.innerWidth < 1024) setMobileDetailOpen(true);
  };

  const totalFields = useMemo(() => {
    if (!selectedItem) return [];
    return [
      { label: 'Contract Value', key: 'amount', bold: true, format: () => formatCurrency(selectedItem.amount || 0) },
    ];
  }, [selectedItem]);

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Agreements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track all your agreements</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setTemplateEditorOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            title="Edit Agreement Template"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <HeaderActionButton label="Create Agreement" variant="trip" onClick={handleNew} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-5">
        {loading ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : (
          <AgreementStatCards agreements={list} />
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
            <FileSignature className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {list.length === 0 ? 'No agreements yet' : 'No matches found'}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            {list.length === 0 ? 'Create your first agreement to get started.' : 'Try a different search or filter.'}
          </p>
          {list.length === 0 && <Button onClick={handleNew} className="lightning-btn"><Plus className="w-4 h-4 mr-2" />New Agreement</Button>}
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
              numberField="agreement_number"
              dateField="start_date"
              dateLabel="Started"
              computeAmount={(a) => Number(a.amount || 0)}
              subtitleField="title"
              onClientClick={handleClientClick}
            />
          </div>
          <div className="hidden lg:block lg:col-span-3 min-h-0 h-full">
            <DocumentDetailPane
              item={selectedItem}
              statusConfig={STATUS_CONFIG}
              numberField="agreement_number"
              subtitleField="title"
              subtitleLabel="Title"
              dateFields={[
                { label: 'Start Date', key: 'start_date' },
                { label: 'End Date', key: 'end_date' },
              ]}
              totalFields={totalFields}
              onClientClick={handleClientClick}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onDownload={handleDownload}
              downloadingId={downloadingId}
              emptyIcon={FileSignature}
              emptyTitle="Select an agreement"
              emptyDescription="Choose an agreement from the list to view its full details here."
              previewComponent={<AgreementPreview form={selectedItem} settings={settings} />}
              settings={settings}
              docType="agreement"
              actionsMenu={selectedItem && !['terminated', 'expired'].includes(deriveStatus(selectedItem)) ? <AgreementActionsMenu agreement={selectedItem} onAction={handleAction} variant="button" /> : null}
              signatureFlag={itemFlag}
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
              <SheetTitle className="text-base font-bold">Agreement Details</SheetTitle>
            </div>
          </SheetHeader>
          <div className="h-[calc(90vh-3.5rem)] overflow-hidden">
            <DocumentDetailPane
              item={selectedItem}
              statusConfig={STATUS_CONFIG}
              numberField="agreement_number"
              subtitleField="title"
              subtitleLabel="Title"
              dateFields={[
                { label: 'Start Date', key: 'start_date' },
                { label: 'End Date', key: 'end_date' },
              ]}
              totalFields={totalFields}
              onClientClick={handleClientClick}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
              onDownload={handleDownload}
              downloadingId={downloadingId}
              emptyIcon={FileSignature}
              emptyTitle="Select an agreement"
              emptyDescription="Choose an agreement from the list to view its full details here."
              previewComponent={<AgreementPreview form={selectedItem} settings={settings} />}
              settings={settings}
              docType="agreement"
              actionsMenu={selectedItem && !['terminated', 'expired'].includes(deriveStatus(selectedItem)) ? <AgreementActionsMenu agreement={selectedItem} onAction={handleAction} variant="button" /> : null}
              signatureFlag={itemFlag}
            />
          </div>
        </SheetContent>
      </Sheet>

      <input ref={signedFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleSignedFile} />

      <DocumentTemplateEditor open={templateEditorOpen} onClose={() => setTemplateEditorOpen(false)} documentType="agreement" />

      <AgreementFormSheet open={sheetOpen} onOpenChange={setSheetOpen} agreement={editing} onSaved={load} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agreement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete agreement {deleteTarget?.agreement_number}. This action cannot be undone.
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