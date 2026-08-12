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
import ClientForm from '@/components/admin/ClientForm';
import ViewToggle from '@/components/common/ViewToggle';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import ExportButtons from '@/components/common/ExportButtons';
import CsvImportButton from '@/components/common/CsvImportButton';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Plus, Search, Building2, BarChart3, LayoutGrid } from 'lucide-react';
import { useGlobalDate, inGlobalDateRange } from '@/lib/GlobalDateContext';

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
  const [view, setView] = useState('list');
  const [mode, setMode] = useState('analytics');
  const { dateFrom, dateTo } = useGlobalDate();

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Client.list('-created_date', 200).catch(() => []),
      base44.entities.Trip.list('-trip_date', 500).catch(() => []),
      base44.entities.Invoice.list('-created_date', 300).catch(() => []),
    ]).then(([c, tr, i]) => { setItems(c || []); setTrips(tr || []); setInvoices(i || []); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((c) => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.contact_person?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search));
  const fTrips = trips.filter((tt) => inGlobalDateRange(tt.trip_date, dateFrom, dateTo));
  const fInvoices = invoices.filter((i) => inGlobalDateRange(i.issue_date, dateFrom, dateTo));
  const revenueMap = {};
  fTrips.forEach((tt) => { if (tt.client_name) revenueMap[tt.client_name] = (revenueMap[tt.client_name] || 0) + (Number(tt.revenue) || 0); });

  return (
    <div>
      <div className="flex items-center justify-end gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-[150px] h-10 bg-background/60 border-white/10 hover:border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="analytics"><span className="inline-flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" />Analytics</span></SelectItem>
              <SelectItem value="browse"><span className="inline-flex items-center gap-2"><LayoutGrid className="w-3.5 h-3.5" />Browse</span></SelectItem>
            </SelectContent>
          </Select>
          {mode === 'browse' && <ViewToggle view={view} onChange={setView} />}
          <ExportButtons data={filtered.map((c) => ({ name: c.name, contact: c.contact_person, email: c.email, phone: c.phone, trn: c.trn, status: c.status, revenue: revenueMap[c.name] || 0 }))} filename="clients" title="Clients" columns={[{ label: 'Name', key: 'name' }, { label: 'Contact', key: 'contact' }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' }, { label: 'TRN', key: 'trn' }, { label: 'Status', key: 'status' }, { label: 'Revenue', key: 'revenue', numeric: true }]} />
          <CsvImportButton entityName="Client" filename="clients" onImported={load} columns={[
            { key: 'name', label: 'Name', sample: 'ABC Transport LLC' },
            { key: 'contact_person', label: 'Contact Person', sample: 'John Doe' },
            { key: 'email', label: 'Email', sample: 'info@abctransport.com' },
            { key: 'phone', label: 'Phone', sample: '+97141234567' },
            { key: 'address', label: 'Address', sample: 'Dubai, UAE' },
            { key: 'trn', label: 'TRN', sample: '100123456700003' },
            { key: 'status', label: 'Status', sample: 'active' },
            { key: 'payment_terms', label: 'Payment Terms', sample: 'Net 30' },
          ]} transform={(r) => ({
            name: r.name || r.Name || '',
            contact_person: r.contact_person || r['Contact Person'] || '',
            email: r.email || r.Email || '',
            phone: r.phone || r.Phone || '',
            address: r.address || r.Address || '',
            trn: r.trn || r.TRN || '',
            status: r.status || r.Status || 'active',
            payment_terms: r.payment_terms || r['Payment Terms'] || 'Net 30',
          })} />
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>
        </div>
      </div>

      {mode === 'analytics' ? (
        <ClientsAnalytics clients={filtered} trips={fTrips} invoices={fInvoices} loading={loading} onBrowseClients={() => setMode('browse')} />
      ) : (
        <>
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 search-2026 h-10" />
          </div>

          {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Building2} title={t('no_data')} /> :
            view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((c) => (
                  <ClientCard key={c.id} c={c} onOpen={(cc) => navigate(`/admin/clients/${cc.id}`)} onEdit={(cc) => { setEditItem(cc); setFormOpen(true); }} onDelete={async (cc) => { await base44.entities.Client.delete(cc.id); load(); }} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((c) => (
                  <ClientListRow key={c.id} c={c} onOpen={(cc) => navigate(`/admin/clients/${cc.id}`)} onEdit={(cc) => { setEditItem(cc); setFormOpen(true); }} onDelete={async (cc) => { await base44.entities.Client.delete(cc.id); load(); }} />
                ))}
              </div>
            )}
        </>
      )}

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen} icon={Building2} title={`${editItem ? t('edit') : t('add_new')} Client`} subtitle="Add a new client company">
          <ClientForm editItem={editItem} onSave={async (data, existingId) => { if (existingId) await base44.entities.Client.update(existingId, data); else if (editItem) await base44.entities.Client.update(editItem.id, data); else await base44.entities.Client.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
      </EntityFormDialog>
    </div>
  );
}