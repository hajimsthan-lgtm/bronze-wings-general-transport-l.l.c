import { useState, useEffect, useMemo } from 'react';
import { Plus, FileDown, Pencil, Trash2, Loader2, FileText, Search, Building2 } from 'lucide-react';
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
import { useInvoices, useInvoiceDelete } from '@/hooks/useEntityQueries';
import { restructureInvoiceSequence } from '@/lib/invoiceSequence';
import { useGlobalDate } from '@/lib/GlobalDateContext';

const STATUS_COLORS = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-500/15 text-blue-400',
  partially_paid: 'bg-orange-500/15 text-orange-400',
  paid: 'bg-green-500/15 text-green-400',
  overdue: 'bg-red-500/15 text-red-400',
  cancelled: 'bg-white/10 text-white/50',
};

export default function InvoicesPage() {
  const { toast } = useToast();
  const { data: allInvoices = [], isLoading: loading, refetch } = useInvoices();
  const deleteInvoice = useInvoiceDelete();
  const [clients, setClients] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { dateFrom, dateTo } = useGlobalDate();

  useEffect(() => {
    base44.entities.Client.list('-created_date', 500).catch(() => []).then(setClients);
  }, []);

  const handleNew = () => { setEditing(null); setSheetOpen(true); };
  const handleEdit = (inv) => { setEditing(inv); setSheetOpen(true); };

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
      return matchesDate && matchesClient && matchesSearch;
    });
  }, [allInvoices, dateFrom, dateTo, clientFilter, search]);

  return (
    <div className="professional-page-bg min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Toolbar: search + client dropdown + new button */}
        <div className="flex items-center gap-3 mb-5">
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
              <SelectTrigger className="w-52 pl-8 h-9 text-xs bg-muted/40 border-border">
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
          <Button onClick={handleNew} className="lightning-btn"><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
        </div>

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
              {allInvoices.length === 0 ? 'Create your first invoice to get started.' : 'Try a different search or client filter.'}
            </p>
            {allInvoices.length === 0 && (
              <Button onClick={handleNew} className="lightning-btn"><Plus className="w-4 h-4 mr-2" />New Invoice</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(inv => {
              const total = Number(inv.total_amount || 0);
              return (
                <div key={inv.id} className="glass-card-hover p-4 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-xs text-muted-foreground font-mono">{inv.invoice_number || '—'}</div>
                      <div className="text-sm font-semibold text-foreground mt-0.5">{inv.client_name || '—'}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${STATUS_COLORS[inv.status] || STATUS_COLORS.draft}`}>
                      {(inv.status || 'draft').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-muted-foreground">
                      {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : '—'}
                    </div>
                    <div className="text-sm font-bold font-mono text-primary">AED {total.toFixed(2)}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => handleDownload(inv)} disabled={downloadingId === inv.id} className="flex-1 h-8 text-xs">
                      {downloadingId === inv.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FileDown className="w-3 h-3 mr-1" />}
                      PDF
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(inv)} className="h-8 w-8 p-0"><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(inv)} className="h-8 w-8 p-0 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
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