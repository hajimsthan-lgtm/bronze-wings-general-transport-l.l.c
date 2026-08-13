import { useState, useEffect, useMemo } from 'react';
import { Plus, Loader2, FileText, Search, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadInvoicePDF } from '@/lib/invoiceHtml';
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
import InvoiceFormSheet from '@/components/invoices/InvoiceFormSheet';
import InvoiceCard, { STATUS_OPTIONS } from '@/components/invoices/InvoiceCard';
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
  const [signedFilter, setSignedFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const { dateFrom, dateTo } = useGlobalDate();

  useEffect(() => {
    base44.entities.Client.list('-created_date', 500).catch(() => []).then(setClients);
  }, []);

  const handleNew = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (inv) => { setEditing(inv); setSheetOpen(true); };

  const handleStatusChange = async (inv, newStatus) => {
    try {
      await base44.entities.Invoice.update(inv.id, { status: newStatus });
      toast({ title: 'Status updated', description: `${inv.invoice_number} → ${newStatus.replace(/_/g, ' ')}` });
      refetch();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

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
    try {
      const updates = Array.from(selected).map(id => ({ id, status: bulkStatus }));
      await base44.entities.Invoice.bulkUpdate(updates);
      toast({ title: `${selected.size} invoices updated` });
      setSelected(new Set());
      setBulkStatus('');
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
      refetch();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete error', description: e.message });
    }
  };

  const handleDownload = async (inv) => {
    setDownloadingId(inv.id);
    try {
      const settings = await getCompanySettings();
      await downloadInvoicePDF(inv, inv.client_name, settings);
    } catch (e) {
      toast({ variant: 'destructive', title: 'PDF error', description: e.message });
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = useMemo(() => {
    return allInvoices.filter(inv => {
      const matchesDate = !inv.issue_date || ((!dateFrom || inv.issue_date >= dateFrom) && (!dateTo || inv.issue_date <= dateTo));
      const matchesClient = clientFilter === 'all' || inv.client_name === clientFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || (inv.invoice_number || '').toLowerCase().includes(q) || (inv.client_name || '').toLowerCase().includes(q);
      const matchesSigned = signedFilter === 'all' ||
        (signedFilter === 'signed' && !!inv.signed_invoice_url) ||
        (signedFilter === 'unsigned' && !inv.signed_invoice_url);
      return matchesDate && matchesClient && matchesSearch && matchesSigned;
    });
  }, [allInvoices, dateFrom, dateTo, clientFilter, search, signedFilter]);

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <div className="professional-page-bg min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by number or client..."
              className="search-2026 w-full pl-9 pr-3 py-2 text-sm rounded-lg"
            />
          </div>
          <div className="relative">
            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-10" />
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-44 pl-8 h-9 text-xs bg-muted/40 border-border">
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
          <Select value={signedFilter} onValueChange={setSignedFilter}>
            <SelectTrigger className="w-36 h-9 text-xs bg-muted/40 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Invoices</SelectItem>
              <SelectItem value="signed">Signed</SelectItem>
              <SelectItem value="unsigned">Not Signed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleNew} className="lightning-btn"><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
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

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
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
          <>
            {/* Select All */}
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded accent-primary cursor-pointer" />
              <span className="text-xs text-muted-foreground">{allSelected ? 'Deselect All' : 'Select All'}</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(inv => (
                <InvoiceCard
                  key={inv.id}
                  inv={inv}
                  selected={selected.has(inv.id)}
                  onSelect={toggleSelect}
                  onStatusChange={handleStatusChange}
                  onAttachSigned={handleAttachSigned}
                  onDownload={handleDownload}
                  onEdit={handleEdit}
                  onDelete={setDeleteTarget}
                  downloadingId={downloadingId}
                  uploadingId={uploadingId}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <InvoiceFormSheet open={sheetOpen} onOpenChange={setSheetOpen} editInvoice={editing} onSaved={refetch} />

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