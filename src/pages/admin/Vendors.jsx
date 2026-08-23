import VendorsPanel from '@/components/admin/VendorsPanel';
import ServiceProvidersPanel from '@/components/admin/ServiceProvidersPanel';
import { useVendorsView } from '@/lib/vendorsStore';

export default function Vendors() {
  const view = useVendorsView();
  return (
    <div>
      {view === 'all' ? <VendorsPanel /> : <ServiceProvidersPanel />}
    </div>
  );
}