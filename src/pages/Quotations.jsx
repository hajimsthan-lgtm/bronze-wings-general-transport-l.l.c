import { useState, useEffect, useCallback } from 'react';
import { Plus, FileDown, Pencil, Trash2, Loader2, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadQuotationPDF } from '@/lib/quotationPdf';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
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
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Quotation.list('-created_date', 50);
      setList(data || []);
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

  return (
    <div className="professional-page-bg min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Quotation Generator</h1>
            <p className="text-sm text-muted-foreground mt-1">Create and manage client quotations with invoice letterhead.</p>
          </div>
          <Button onClick={handleNew} className="lightning-btn">
            <Plus className="w-4 h-4 mr-2" /> New Quotation
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full empty-orb flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">No quotations yet</h3>
            <p className="text-xs text-muted-foreground mb-4">Create your first quotation to get started.</p>
            <Button onClick={handleNew} className="lightning-btn"><Plus className="w-4 h-4 mr-2" />New Quotation</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map(q => {
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