import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getInitials } from '@/lib/formatters';
import { Plus, Search, Users, Pencil, Trash2, Phone, Mail } from 'lucide-react';
import ExportButtons from '@/components/common/ExportButtons';
import ClientForm from '@/components/admin/ClientForm';

export default function Clients() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = () => { setLoading(true); base44.entities.Client.list('-created_date', 100).then(setItems).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()));
  const exportColumns = [
    { key: 'name', label: 'Company Name' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'trn', label: 'TRN' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div>
      <PageHeader title={t('clients')} description={`${items.length} clients`}
        action={<div className="flex items-center gap-2"><ExportButtons data={filtered} filename="clients" columns={exportColumns} title="Clients" /><Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button></div>} />
      <div className="relative mb-5"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 search-2026 h-10" /></div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Users} title={t('no_data')} /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <div key={c.id} className="entity-card cursor-pointer" onClick={() => navigate(`/admin/clients/${c.id}`)}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full entity-avatar flex items-center justify-center text-sm font-semibold">{getInitials(c.name)}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-foreground truncate">{c.name}</p><p className="text-xs text-muted-foreground">{c.contact_person}</p></div>
                <StatusBadge status={c.status} />
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                {c.email && <p className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</p>}
                {c.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>}
                {c.trn && <p>TRN: {c.trn}</p>}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" onClick={() => { setEditItem(c); setFormOpen(true); }} className="text-muted-foreground hover:text-foreground h-8 px-2"><Pencil className="w-3.5 h-3.5" /></Button>
                <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400 h-8 px-2"><Trash2 className="w-3.5 h-3.5" /></Button></AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border"><AlertDialogHeader><AlertDialogTitle className="text-foreground">{t('delete')}?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="border-border">{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={async () => { await base44.entities.Client.delete(c.id); load(); }} className="bg-destructive">{t('delete')}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Client</SheetTitle></SheetHeader>
          <ClientForm editItem={editItem} onSave={async (data, existingId) => { if (existingId) await base44.entities.Client.update(existingId, data); else if (editItem) await base44.entities.Client.update(editItem.id, data); else await base44.entities.Client.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}