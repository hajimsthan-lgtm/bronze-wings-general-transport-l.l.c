import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/formatters';
import { Plus, Search, FileText, Pencil, Trash2 } from 'lucide-react';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import ExportButtons from '@/components/common/ExportButtons';

export default function Documents() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { dateFrom, dateTo, setDateFrom, setDateTo } = useGlobalDate();

  const load = () => { setLoading(true); base44.entities.Document.list('-created_date', 100).then(setItems).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(d => (!search || d.title?.toLowerCase().includes(search.toLowerCase())) && (!d.expiry_date || ((!dateFrom || d.expiry_date >= dateFrom) && (!dateTo || d.expiry_date <= dateTo))));

  return (
    <div>
      <PageHeader title={t('documents')} description={`${filtered.length} documents`}
        action={<div className="flex items-center gap-2"><ExportButtons data={filtered} filename="documents" title="Documents" columns={[{ label: 'Title', key: 'title' }, { label: 'Type', key: 'type' }, { label: 'Related To', key: 'related_entity' }, { label: 'Expiry', key: 'expiry_date' }, { label: 'Status', key: 'status' }]} /><Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button></div>} />
      <div className="relative mb-5"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 search-2026 h-10" /></div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={FileText} title={t('no_data')} /> : (
        <div className="space-y-2">
          {filtered.map(doc => (
            <div key={doc.id} className="row-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-primary" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{doc.type?.replace(/_/g, ' ')} {doc.expiry_date ? `· Expires: ${formatDate(doc.expiry_date)}` : ''}</p>
              </div>
              <StatusBadge status={doc.status} />
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={() => { setEditItem(doc); setFormOpen(true); }} className="text-muted-foreground h-8 px-2"><Pencil className="w-3.5 h-3.5" /></Button>
                <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400 h-8 px-2"><Trash2 className="w-3.5 h-3.5" /></Button></AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle className="text-foreground">{t('delete')}?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-border">{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={async () => { await base44.entities.Document.delete(doc.id); load(); }} className="bg-destructive">{t('delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Document</SheetTitle></SheetHeader>
          <DocForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.Document.update(editItem.id, data); else await base44.entities.Document.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DocForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'other', related_entity: '', expiry_date: '', status: 'valid', notes: '' });
  useEffect(() => { if (editItem) setForm({ ...form, ...editItem }); else setForm({ title: '', type: 'other', related_entity: '', expiry_date: '', status: 'valid', notes: '' }); }, [editItem]);
  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
  const handle = async () => { setSaving(true); await onSave(form); setSaving(false); };

  return (
    <div className="space-y-4">
      <div><Label className="text-xs text-muted-foreground mb-1.5">Title</Label><Input value={form.title} onChange={e => update('title', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Type</Label><Select value={form.type} onValueChange={v => update('type', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['registration','insurance','license','permit','contract','invoice','other'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label><Select value={form.status} onValueChange={v => update('status', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['valid','expiring_soon','expired'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Related To</Label><Input value={form.related_entity} onChange={e => update('related_entity', e.target.value)} className="bg-background border-border" /></div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => update('expiry_date', e.target.value)} className="bg-background border-border" /></div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>
  );
}