import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { getInitials } from '@/lib/formatters';
import { Plus, Search, Users, Pencil, Trash2, Phone, Mail } from 'lucide-react';
import ExportButtons from '@/components/common/ExportButtons';
import EntityHeroCard from '@/components/common/EntityHeroCard';
import ClientForm from '@/components/admin/ClientForm';
import ClientCard from '@/components/admin/ClientCard';
import ClientsAnalytics from '@/components/admin/ClientsAnalytics';

export default function ClientsPanel() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Client.list('-created_date', 100).catch(() => []),
      base44.entities.Trip.list('-trip_date', 500).catch(() => []),
      base44.entities.Invoice.list('-created_date', 200).catch(() => []),
    ]).then(([c, t, i]) => { setItems(c || []); setTrips(t || []); setInvoices(i || []); }).finally(() => setLoading(false));
  };
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
      <ClientsAnalytics clients={items} trips={trips} invoices={invoices} onSelect={(id) => navigate(`/admin/clients/${id}`)} />

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 search-2026 h-10" /></div>
        <ExportButtons data={filtered} filename="clients" columns={exportColumns} title="Clients" />
        <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Users} title={t('no_data')} /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c => (
            <ClientCard key={c.id} c={c} onOpen={() => navigate(`/admin/clients/${c.id}`)} onEdit={() => { setEditItem(c); setFormOpen(true); }} onDelete={async () => { await base44.entities.Client.delete(c.id); load(); }} />
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