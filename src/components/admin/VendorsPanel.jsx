import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getInitials } from '@/lib/formatters';
import ExportButtons from '@/components/common/ExportButtons';
import { Plus, Search, Store, Pencil, Trash2 } from 'lucide-react';

export default function VendorsPanel() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = () => { setLoading(true); base44.entities.Vendor.list('-created_date', 100).then(setItems).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(v => !search || v.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 search-2026 h-10" /></div>
        <ExportButtons data={filtered} filename="vendors" title="Vendors" columns={[{ label: 'Name', key: 'name' }, { label: 'Category', key: 'category' }, { label: 'Contact', key: 'contact_person' }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' }, { label: 'TRN', key: 'trn' }, { label: 'Status', key: 'status' }]} />
        <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Store} title={t('no_data')} /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(v => (
            <div key={v.id} className="entity-card cursor-pointer" onClick={() => navigate(`/admin/vendors/${v.id}`)}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full entity-avatar flex items-center justify-center text-sm font-semibold">{getInitials(v.name)}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground truncate">{v.name}</p><p className="text-xs text-muted-foreground capitalize">{v.category}</p></div>
                <StatusBadge status={v.status} />
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => { setEditItem(v); setFormOpen(true); }} className="text-muted-foreground hover:text-foreground h-8 px-2"><Pencil className="w-3.5 h-3.5" /></Button>
                <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400 h-8 px-2"><Trash2 className="w-3.5 h-3.5" /></Button></AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle className="text-foreground">{t('delete')}?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-border">{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={async () => { await base44.entities.Vendor.delete(v.id); load(); }} className="bg-destructive">{t('delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Vendor</SheetTitle></SheetHeader>
          <VendorForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.Vendor.update(editItem.id, data); else await base44.entities.Vendor.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function VendorForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', contact_person: '', email: '', phone: '', address: '', trn: '', category: 'other', status: 'active', notes: '' });
  useEffect(() => { if (editItem) setForm({ ...form, ...editItem }); else setForm({ name: '', contact_person: '', email: '', phone: '', address: '', trn: '', category: 'other', status: 'active', notes: '' }); }, [editItem]);
  const update = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
  const handle = async () => { setSaving(true); await onSave(form); setSaving(false); };

  return (
    <div className="space-y-4">
      <div><Label className="text-xs text-muted-foreground mb-1.5">Name</Label><Input value={form.name} onChange={e => update('name', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Category</Label><Select value={form.category} onValueChange={v => update('category', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['fuel','maintenance','parts','insurance','other'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label><Select value={form.status} onValueChange={v => update('status', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Email</Label><Input value={form.email} onChange={e => update('email', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Phone</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>
  );
}