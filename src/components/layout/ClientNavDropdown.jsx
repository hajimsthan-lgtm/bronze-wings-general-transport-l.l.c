import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ClientNavDropdown() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isVendors = params.get('tab') === 'vendors' || location.pathname.startsWith('/admin/vendors');
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    base44.entities.Client.list('-created_date', 200).then(setClients).catch(() => {});
    base44.entities.Vendor.list('-created_date', 200).then(setVendors).catch(() => {});
  }, []);

  const list = isVendors ? vendors : clients;
  const label = isVendors ? 'vendor' : 'client';

  const onSelect = (id) => {
    if (id === 'all') navigate(isVendors ? '/admin/clients?tab=vendors' : '/admin/clients');
    else navigate(isVendors ? `/admin/vendors/${id}` : `/admin/clients/${id}`);
  };

  return (
    <Select value="all" onValueChange={onSelect}>
      <SelectTrigger className="w-[130px] sm:w-[200px] h-8 bg-white/5 border-white/10 text-foreground text-xs">
        <SelectValue placeholder={`Select a ${label}…`} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {isVendors ? 'vendors' : 'clients'}</SelectItem>
        {list.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}