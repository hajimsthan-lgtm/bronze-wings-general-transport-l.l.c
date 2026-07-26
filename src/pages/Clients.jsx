import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ClientsPanel from '@/components/admin/ClientsPanel';
import VendorsPanel from '@/components/admin/VendorsPanel';
import ClientDetail from '@/pages/admin/ClientDetail';
import VendorDetail from '@/pages/admin/VendorDetail';

export default function Clients() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const view = params.get('tab') === 'vendors' ? 'vendors' : 'clients';
  const [selectedId, setSelectedId] = useState('all');
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    base44.entities.Client.list('-created_date', 200).then(setClients).catch(() => {});
    base44.entities.Vendor.list('-created_date', 200).then(setVendors).catch(() => {});
  }, []);

  const setView = (v) => {
    const next = new URLSearchParams(params);
    if (v === 'clients') next.delete('tab'); else next.set('tab', v);
    setParams(next, { replace: true });
    setSelectedId('all');
  };

  const list = view === 'clients' ? clients : vendors;
  const label = view === 'clients' ? 'client' : 'vendor';

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1 backdrop-blur-lg w-fit">
          <button onClick={() => setView('clients')} className={`sub-tab ${view === 'clients' ? 'sub-tab-active' : ''}`}>{t('clients')}</button>
          <button onClick={() => setView('vendors')} className={`sub-tab ${view === 'vendors' ? 'sub-tab-active' : ''}`}>{t('vendors')}</button>
        </div>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-[240px] h-9 bg-white/5 border-white/10 text-foreground">
            <SelectValue placeholder={`Select a ${label}…`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All {view}</SelectItem>
            {list.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {view === 'clients'
        ? (selectedId !== 'all' ? <ClientDetail id={selectedId} inline /> : <ClientsPanel />)
        : (selectedId !== 'all' ? <VendorDetail id={selectedId} inline /> : <VendorsPanel />)}
    </div>
  );
}