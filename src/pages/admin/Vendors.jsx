import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import VendorsPanel from '@/components/admin/VendorsPanel';
import ServiceProvidersPanel from '@/components/admin/ServiceProvidersPanel';
import SubTabBar from '@/components/common/SubTabBar';

export default function Vendors() {
  const [view, setView] = useState('all');
  const handleNew = () => {
    if (view === 'all') window.dispatchEvent(new CustomEvent('vendors:new'));
    else window.dispatchEvent(new CustomEvent('service-providers:new'));
  };
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <Button onClick={handleNew} className="h-9"><Plus className="w-4 h-4 mr-1.5" />Add New</Button>
        <SubTabBar value={view} onChange={setView} options={[
          { value: 'all', label: 'All Vendors' },
          { value: 'providers', label: 'Service Providers' },
        ]} />
      </div>
      {view === 'all' ? <VendorsPanel /> : <ServiceProvidersPanel />}
    </div>
  );
}