import { useState, useEffect, useCallback } from 'react';
import { Plus, FileDown, Pencil, Trash2, Loader2, FileSignature, Search, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadAgreementPDF } from '@/lib/agreementPdf';
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
import AgreementFormSheet from '@/components/agreements/AgreementFormSheet';

const STATUS_COLORS = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-500/15 text-blue-400',
  signed: 'bg-purple-500/15 text-purple-400',
  active: 'bg-green-500/15 text-green-400',
  expired: 'bg-orange-500/15 text-orange-400',
  terminated: 'bg-red-500/15 text-red-400',
};

export default function Agreements() {
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, clientData] = await Promise.all([
        base44.entities.Agreement.list('-created_date', 50),
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
  const handleEdit = (a) => { setEditing(a); setSheetOpen(true); };

  const handleDelete = async (a) => {
    if (!confirm('Delete this agreement?')) return;
    try {
      await base44.entities.Agreement.delete(a.id);
      toast({ title: 'Agreement deleted' });
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

  // Filter list by search text and client dropdown
  const filtered = list.filter(a => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      (a.agreement_number || '').toLowerCase().includes(q) ||
      (a.client_name || '').toLowerCase().includes(q) ||
      (a.title || '').toLowerCase().includes(q);
    const matchesClient = clientFilter === 'all' || (a.client_name || '') === clientFilter;
    return matchesSearch && matchesClient;
  });

  return (
    <div>
      <div className="max-w-6xl mx-auto">
        {/* Toolbar: search bar + client dropdown + new button */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by number, client, or title..."
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
          <Button onClick={handleNew} className="lightning-btn"><Plus className="w-4 h-4 mr-2" /> New Agreement</Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full empty-orb flex items-center justify-center mb-4">
              <FileSignature className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {list.length === 0 ? 'No agreements yet' : 'No matches found'}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {list.length === 0 ? 'Create your first agreement to get started.' : 'Try a different search or client filter.'}
            </p>
            {list.length === 0 && (
              <Button onClick={handleNew} className="lightning-btn"><Plus className="w-4 h-4 mr-2" />New Agreement</Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(a => (
              <div key={a.id} className="glass-card-hover p-4 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-xs text-muted-foreground font-mono">{a.agreement_number || '—'}</div>
                    <div className="text-sm font-semibold text-foreground mt-0.5">{a.client_name || '—'}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${STATUS_COLORS[a.status] || STATUS_COLORS.draft}`}>
                    {a.status || 'draft'}
                  </span>
                </div>
                {a.title && <div className="text-xs text-muted-foreground mb-2 line-clamp-1">{a.title}</div>}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-muted-foreground">
                    {a.start_date ? new Date(a.start_date).toLocaleDateString() : '—'}
                  </div>
                  {a.amount != null && <div className="text-sm font-bold font-mono text-primary">AED {Number(a.amount || 0).toFixed(2)}</div>}
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => handleDownload(a)} disabled={downloadingId === a.id} className="flex-1 h-8 text-xs">
                    {downloadingId === a.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FileDown className="w-3 h-3 mr-1" />}
                    PDF
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(a)} className="h-8 w-8 p-0"><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(a)} className="h-8 w-8 p-0 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AgreementFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        agreement={editing}
        onSaved={load}
      />
    </div>
  );
}