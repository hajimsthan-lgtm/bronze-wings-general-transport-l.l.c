import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TYPES = [
  { key: 'clients', label: 'Client', path: '/admin/clients', nameKey: 'name', load: () => base44.entities.Client.list('-created_date', 200) },
  { key: 'drivers', label: 'Driver', path: '/admin/drivers', nameKey: 'name', load: () => base44.entities.Driver.list('-created_date', 200) },
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

  return (
    <div className="hidden md:flex items-center gap-2">
      <Select value="all" onValueChange={(id) => id !== 'all' && navigate(`${active.path}/${id}`)}>
        <SelectTrigger className="w-[160px] h-8 bg-white/5 border-white/10 text-foreground text-xs hover:border-white/20">
          <SelectValue placeholder={`Select a ${active.label.toLowerCase()}…`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All {active.label.toLowerCase()}s</SelectItem>
          {list.map((item) => <SelectItem key={item.id} value={item.id}>{item[active.nameKey]}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}