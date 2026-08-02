import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, Trash2, Download, Loader2, Paperclip } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import TabTableCard from '@/components/admin/TabTableCard';

const TYPES = ['registration', 'insurance', 'license', 'permit', 'contract', 'invoice', 'other'];

const statusOf = (expiry) => {
  if (!expiry) return 'valid';
  const days = (new Date(expiry) - new Date()) / 86400000;
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring_soon';
  return 'valid';
};
const STATUS_TONE = { valid: 'text-emerald-400', expiring_soon: 'text-amber-400', expired: 'text-red-400' };

export default function EntityDocumentsTab({ entityType, entityId, collapsible = false }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'other', expiry_date: '', file_url: '', notes: '' });

  const load = () => {
    setLoading(true);
    base44.entities.Document.filter({ related_entity: entityType, related_id: entityId })
      .then((rows) => setDocs(rows || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    if (entityId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm((p) => ({ ...p, file_url, title: p.title || file.name.replace(/\.[^.]+$/, '') }));
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.title || !form.file_url) { toast({ title: 'Title and file are required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await base44.entities.Document.create({
        title: form.title, type: form.type, related_entity: entityType, related_id: entityId,
        file_url: form.file_url, expiry_date: form.expiry_date || null, notes: form.notes,
        status: statusOf(form.expiry_date),
      });
      setForm({ title: '', type: 'other', expiry_date: '', file_url: '', notes: '' });
      setAdding(false);
      load();
      toast({ title: 'Document added' });
    } catch {
      toast({ title: 'Could not add document', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const remove = async (d) => {
    try { await base44.entities.Document.delete(d.id); load(); }
    catch { toast({ title: 'Could not delete', variant: 'destructive' }); }
  };

  return (
    <TabTableCard
      collapsible={collapsible}
      title={t('documents')}
      actions={
        <Button onClick={() => setAdding((v) => !v)} size="sm" className="bg-primary hover:bg-primary/90 h-8">
          <Plus className="w-3.5 h-3.5 mr-1" /> {adding ? t('cancel') : t('add_new')}
        </Button>
      }
      headerExtra={adding ? (
        <div className="glass-card p-4 mb-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Title</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="bg-background border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((tp) => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Expiry</Label>
              <Input type="date" value={form.expiry_date} onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))} className="bg-background border-border" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">File</Label>
              <label className="flex items-center gap-2 h-9 px-3 rounded-lg bg-background border border-border cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                <Paperclip className="w-4 h-4" />
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : form.file_url ? 'File attached' : 'Choose file'}
                <input type="file" className="hidden" onChange={onFile} disabled={uploading} />
              </label>
            </div>
          </div>
          <Button onClick={save} disabled={saving} size="sm" className="bg-primary hover:bg-primary/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
          </Button>
        </div>
      ) : null}
      loading={loading}
      columns={[
        { label: 'Title', className: 'col-span-5' },
        { label: 'Type', className: 'col-span-2' },
        { label: 'Expiry', className: 'col-span-2' },
        { label: 'Status', className: 'col-span-2' },
        { label: 'Action', className: 'col-span-1 text-right' },
      ]}
      emptyIcon={FileText}
      emptyTitle={t('no_data')}
      emptyHint=""
    >
      {docs.map((d) => {
        const st = d.status || statusOf(d.expiry_date);
        return (
          <div key={d.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm hover:bg-muted/20 transition-colors">
            <div className="col-span-5 text-foreground font-medium truncate">{d.title}</div>
            <div className="col-span-2 text-muted-foreground capitalize truncate">{d.type}</div>
            <div className="col-span-2 text-muted-foreground">{d.expiry_date ? formatDate(d.expiry_date) : '—'}</div>
            <div className={`col-span-2 text-[11px] font-semibold uppercase ${STATUS_TONE[st] || 'text-muted-foreground'}`}>{st.replace('_', ' ')}</div>
            <div className="col-span-1 text-right flex items-center justify-end gap-1">
              {d.file_url && <a href={d.file_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary p-1.5"><Download className="w-4 h-4" /></a>}
              <button onClick={() => remove(d)} className="text-muted-foreground hover:text-red-400 p-1.5"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        );
      })}
    </TabTableCard>
  );
}