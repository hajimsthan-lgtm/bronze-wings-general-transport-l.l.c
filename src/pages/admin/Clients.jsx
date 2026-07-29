import { useSearchParams } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import ClientsPanel from '@/components/admin/ClientsPanel';
import VendorsPanel from '@/components/admin/VendorsPanel';
import SubTabBar from '@/components/common/SubTabBar';

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
      <SubTabBar value={view} onChange={setView} options={[{ value: 'clients', label: t('clients') }, { value: 'vendors', label: t('vendors') }]} className="mb-5" />
      {view === 'clients' ? <ClientsPanel /> : <VendorsPanel />}
    </div>
  );
}