import SubTabBar from '@/components/common/SubTabBar';
import VendorsPanel from '@/components/admin/VendorsPanel';
import ServiceProvidersPanel from '@/components/admin/ServiceProvidersPanel';
import { useVendorsView, setVendorsView } from '@/lib/vendorsStore';

export default function Vendors() {
  const view = useVendorsView();
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <SubTabBar value={view} onChange={setVendorsView} options={[
          { value: 'all', label: 'All Vendors' },
          { value: 'providers', label: 'Service Providers' },
        ]} />
      </div>
      {view === 'all' ? <VendorsPanel /> : <ServiceProvidersPanel />}
    </div>
  );
}