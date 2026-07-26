import { useSearchParams } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import ClientsPanel from '@/components/admin/ClientsPanel';
import VendorsPanel from '@/components/admin/VendorsPanel';

export default function Clients() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const view = params.get('tab') === 'vendors' ? 'vendors' : 'clients';

  const setView = (v) => {
    const next = new URLSearchParams(params);
    if (v === 'clients') next.delete('tab'); else next.set('tab', v);
    setParams(next, { replace: true });
  };

  return (
    <div>
      <div className="flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1 backdrop-blur-lg w-fit mb-5">
        <button onClick={() => setView('clients')} className={`sub-tab ${view === 'clients' ? 'sub-tab-active' : ''}`}>{t('clients')}</button>
        <button onClick={() => setView('vendors')} className={`sub-tab ${view === 'vendors' ? 'sub-tab-active' : ''}`}>{t('vendors')}</button>
      </div>
      {view === 'clients' ? <ClientsPanel /> : <VendorsPanel />}
    </div>
  );
}