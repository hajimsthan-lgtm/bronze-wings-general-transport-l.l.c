import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SearchableSelect from '@/components/common/SearchableSelect';

const TYPES = [
  { key: 'clients', label: 'Client', path: '/admin/clients', nameKey: 'name', load: () => base44.entities.Client.list('-created_date', 200) },
  { key: 'drivers', label: 'Driver', path: '/admin/drivers', nameKey: 'name', load: () => base44.entities.Driver.list('-created_date', 200).then((r) => (r || []).filter((d) => !d.vendor_name)) },
  { key: 'vehicles', label: 'Vehicle', path: '/admin/vehicles', nameKey: 'plate_number', load: () => base44.entities.Vehicle.list('-created_date', 100) },
];

export default function GlobalEntitySelector() {
  const navigate = useNavigate();
  const location = useLocation();
  const [list, setList] = useState([]);

  const active = TYPES.find((t) => location.pathname.startsWith(t.path));
  useEffect(() => {
    if (!active) { setList([]); return; }
    active.load().then((r) => setList(r || [])).catch(() => setList([]));
  }, [active?.key]);

  if (!active) return null;

  const items = [
    { value: 'all', label: `All ${active.label.toLowerCase()}s` },
    ...list.map((item) => ({
      value: item.id,
      label: item[active.nameKey],
      search: active.key === 'vehicles' ? ` ${item.make || ''} ${item.model || ''}` : (active.key === 'drivers' ? ` ${item.phone || ''}` : ''),
    })),
  ];

  return (
    <div className="hidden md:flex items-center gap-2">
      <div className="w-[160px]">
        <SearchableSelect
          value="all"
          onChange={(id) => id !== 'all' && navigate(`${active.path}/${id}`)}
          placeholder={`Select a ${active.label.toLowerCase()}…`}
          items={items}
          className="h-8 bg-white/5 border-white/10 text-foreground text-xs hover:border-white/20"
        />
      </div>
    </div>
  );
}