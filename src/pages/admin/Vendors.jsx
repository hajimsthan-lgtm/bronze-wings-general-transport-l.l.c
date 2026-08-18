import { useState } from 'react';
import VendorsPanel from '@/components/admin/VendorsPanel';
import ServiceProvidersPanel from '@/components/admin/ServiceProvidersPanel';
import SubTabBar from '@/components/common/SubTabBar';

export default function Vendors() {
  const [view, setView] = useState('all');
  return (
    <div>
      <SubTabBar value={view} onChange={setView} options={[
        { value: 'all', label: 'All Vendors' },
        { value: 'providers', label: 'Service Providers' },
      ]} className="mb-5" />
      {view === 'all' ? <VendorsPanel /> : <ServiceProvidersPanel />}
    </div>
  );
}