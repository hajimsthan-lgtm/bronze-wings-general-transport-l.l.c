import { useState, useEffect, useCallback } from 'react';
import { Plus, FileDown, Pencil, Trash2, Loader2, FileText, Search, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadQuotationPDF } from '@/lib/quotationPdf';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/common/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import QuotationFormSheet from '@/components/quotations/QuotationFormSheet';

const STATUS_COLORS = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-500/15 text-blue-400',
  accepted: 'bg-green-500/15 text-green-400',
  rejected: 'bg-red-500/15 text-red-400',
  expired: 'bg-orange-500/15 text-orange-400',
};

export default function Quotations() {
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, clientData] = await Promise.all([
        base44.entities.Quotation.list('-created_date', 50),
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
  const handleEdit = (q) => { setEditing(q); setSheetOpen(true); };

  const handleDelete = async (q) => {
    if (!confirm('Delete this quotation?')) return;
    try {
      await base44.entities.Quotation.delete(q.id);
      toast({ title: 'Quotation deleted' });
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

  // Filter list by search text and client dropdown
  const filtered = list.filter(q => {
    const qLower = search.trim().toLowerCase();
    const matchesSearch = !qLower ||
      (q.quotation_number || '').toLowerCase().includes(qLower) ||
      (q.client_name || '').toLowerCase().includes(qLower) ||
      (q.subject || '').toLowerCase().includes(qLower);
    const matchesClient = clientFilter === 'all' || (q.client_name || '') === clientFilter;
    return matchesSearch && matchesClient;
  });

  return (
    <div className="professional-page-bg min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          icon={FileText}
          title="Quotation Generator"
          description="Create and manage client quotations with invoice letterhead."
          action={<Button onClick={handleNew} className="lightning-btn"><Plus className="w-4 h-4 mr-2" /> New Quotation</Button>}
        />

        {/* Toolbar: search bar (left) + client dropdown (right) */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by number, client, or subject..."
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
              {list.length === 0 ? 'No quotations yet' : 'No matches found'}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {list.length === 0 ? 'Create your first quotation to get started.' : 'Try a different search or client filter.'}
            </p>
            {list.length === 0 && (
              <Button onClick={handleNew} className="lightning-btn"><Plus className="w-4 h-4 mr-2" />New Quotation</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(q => {
              const subtotal = (q.line_items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
              const vat = subtotal * (q.vat_rate || 5) / 100;
              const total = subtotal + vat;
              return (
                <div key={q.id} className="glass-card-hover p-4 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-xs text-muted-foreground font-mono">{q.quotation_number || '—'}</div>
                      <div className="text-sm font-semibold text-foreground mt-0.5">{q.client_name || '—'}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${STATUS_COLORS[q.status] || STATUS_COLORS.draft}`}>
                      {q.status || 'draft'}
                    </span>
                  </div>
                  {q.subject && <div className="text-xs text-muted-foreground mb-2 line-clamp-1">{q.subject}</div>}
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-muted-foreground">
                      {q.issue_date ? new Date(q.issue_date).toLocaleDateString() : '—'}
                    </div>
                    <div className="text-sm font-bold font-mono text-primary">AED {Number(total || 0).toFixed(2)}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => handleDownload(q)} disabled={downloadingId === q.id} className="flex-1 h-8 text-xs">
                      {downloadingId === q.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FileDown className="w-3 h-3 mr-1" />}
                      PDF
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(q)} className="h-8 w-8 p-0"><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(q)} className="h-8 w-8 p-0 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <QuotationFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        quotation={editing}
        onSaved={load}
      />
    </div>
  );
}