import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ClientsAnalytics from '@/components/admin/ClientsAnalytics';
import ClientCard from '@/components/admin/ClientCard';
import ClientListRow from '@/components/admin/ClientListRow';
import ClientForm from '@/components/admin/ClientForm';
import ViewToggle from '@/components/common/ViewToggle';
import ExportButtons from '@/components/common/ExportButtons';
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
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Clients Portal</h1>
          <p className="text-sm text-muted-foreground">Analytics overview & client insights</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <button onClick={() => setMode('analytics')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${mode === 'analytics' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart3 className="w-3.5 h-3.5" />Analytics</button>
            <button onClick={() => setMode('browse')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${mode === 'browse' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" />Browse</button>
          </div>
          {mode === 'browse' && <ViewToggle view={view} onChange={setView} />}
          <ExportButtons data={filtered.map((c) => ({ name: c.name, contact: c.contact_person, email: c.email, phone: c.phone, trn: c.trn, status: c.status, revenue: revenueMap[c.name] || 0 }))} filename="clients" title="Clients" columns={[{ label: 'Name', key: 'name' }, { label: 'Contact', key: 'contact' }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' }, { label: 'TRN', key: 'trn' }, { label: 'Status', key: 'status' }, { label: 'Revenue', key: 'revenue', numeric: true }]} />
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>
        </div>
      </div>

      {mode === 'analytics' ? (
        <ClientsAnalytics clients={filtered} trips={fTrips} invoices={fInvoices} loading={loading} />
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

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Client</SheetTitle></SheetHeader>
          <ClientForm editItem={editItem} onSave={async (data, existingId) => { if (existingId) await base44.entities.Client.update(existingId, data); else if (editItem) await base44.entities.Client.update(editItem.id, data); else await base44.entities.Client.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}