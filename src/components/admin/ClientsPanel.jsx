import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityFormDialog from '@/components/common/EntityFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ClientsAnalytics from '@/components/admin/ClientsAnalytics';
import ClientCard from '@/components/admin/ClientCard';
import ClientListRow from '@/components/admin/ClientListRow';
import ClientAddForm from '@/components/admin/ClientAddForm';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Plus, Search, Building2 } from 'lucide-react';
import MobileFAB from '@/components/mobile/MobileFAB';
import { useGlobalDate, inGlobalDateRange } from '@/lib/GlobalDateContext';
import { useClientsMode, setClientsMode, setClientsData, getClientsView } from '@/lib/clientsStore';

export default function ClientsPanel() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState('');
  const { mode } = useClientsMode();
  const view = getClientsView();
  const { dateFrom, dateTo } = useGlobalDate();

  const load = () => {
    setLoading(true);
    Promise.all([
    base44.entities.Client.list('-created_date', 200).catch(() => []),
    base44.entities.Trip.list('-trip_date', 500).catch(() => []),
    base44.entities.Invoice.list('-created_date', 300).catch(() => [])]
    ).then(([c, tr, i]) => {setItems(c || []);setTrips(tr || []);setInvoices(i || []);}).finally(() => setLoading(false));
  };
  useEffect(() => {load();}, []);

  // Listen for TopBar "Add New" event
  useEffect(() => {
    const onNew = () => { setEditItem(null); setFormOpen(true); };
    window.addEventListener('clients:new', onNew);
    return () => window.removeEventListener('clients:new', onNew);
  }, []);

  const filtered = items.filter((c) => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.contact_person?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));
  const fTrips = trips.filter((tt) => inGlobalDateRange(tt.trip_date, dateFrom, dateTo));
  const fInvoices = invoices.filter((i) => inGlobalDateRange(i.issue_date, dateFrom, dateTo));
  const revenueMap = {};
  fTrips.forEach((tt) => {if (tt.client_name) revenueMap[tt.client_name] = (revenueMap[tt.client_name] || 0) + (Number(tt.revenue) || 0);});

  // Publish filtered data + load to the store for TopBar Export/Import
  useEffect(() => { setClientsData(filtered, load); }, [filtered, load]);

  return (
    <div>
      {mode === 'analytics' ?
      <ClientsAnalytics clients={filtered} trips={fTrips} invoices={fInvoices} loading={loading} onBrowseClients={() => setClientsMode('browse')} /> :

      <>
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 search-2026 h-10" />
          </div>

          {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Building2} title={t('no_data')} /> :
        view === 'grid' ?
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((c) =>
          <ClientCard key={c.id} c={c} onOpen={(cc) => navigate(`/admin/clients/${cc.id}`)} onEdit={(cc) => {setEditItem(cc);setFormOpen(true);}} onDelete={async (cc) => {await base44.entities.Client.delete(cc.id);load();}} />
          )}
              </div> :

        <div className="space-y-2">
                {filtered.map((c) =>
          <ClientListRow key={c.id} c={c} onOpen={(cc) => navigate(`/admin/clients/${cc.id}`)} onEdit={(cc) => {setEditItem(cc);setFormOpen(true);}} onDelete={async (cc) => {await base44.entities.Client.delete(cc.id);load();}} />
          )}
              </div>
        }
        </>
      }

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen} icon={Building2} title={`${editItem ? t('edit') : t('add_new')} Client`} subtitle="Scan trade license or enter details manually">
          <ClientAddForm editItem={editItem} onSave={async (data, existingId) => {if (existingId) await base44.entities.Client.update(existingId, data);else if (editItem) await base44.entities.Client.update(editItem.id, data);else await base44.entities.Client.create(data);load();setFormOpen(false);}} onCancel={() => setFormOpen(false)} />
      </EntityFormDialog>
      <MobileFAB icon={Plus} onClick={() => {setEditItem(null);setFormOpen(true);}} label="Add Client" />
    </div>);

}