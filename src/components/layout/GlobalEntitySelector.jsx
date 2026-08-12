import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TYPES = [
  { key: 'clients', label: 'Clients', path: '/admin/clients', nameKey: 'name' },
  { key: 'drivers', label: 'Drivers', path: '/admin/drivers', nameKey: 'name' },
  { key: 'vehicles', label: 'Vehicles', path: '/admin/vehicles', nameKey: 'plate_number' },
];

export default function GlobalEntitySelector() {
  const navigate = useNavigate();
  const [type, setType] = useState('clients');
  const [data, setData] = useState({ clients: [], drivers: [], vehicles: [] });

  useEffect(() => {
    base44.entities.Client.list('-created_date', 200).then((r) => setData((p) => ({ ...p, clients: r || [] }))).catch(() => {});
    base44.entities.Driver.list('-created_date', 200).then((r) => setData((p) => ({ ...p, drivers: r || [] }))).catch(() => {});
    base44.entities.Vehicle.list('-created_date', 100).then((r) => setData((p) => ({ ...p, vehicles: r || [] }))).catch(() => {});
  }, []);

  const active = TYPES.find((t) => t.key === type);
  const list = data[type] || [];

  return (
    <div className="hidden md:flex items-center gap-2">
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-[104px] h-8 bg-white/5 border-white/10 text-foreground text-xs hover:border-white/20 capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPES.map((t) => <SelectItem key={t.key} value={t.key} className="capitalize">{t.label}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value="all" onValueChange={(id) => id !== 'all' && navigate(`${active.path}/${id}`)}>
        <SelectTrigger className="w-[150px] h-8 bg-white/5 border-white/10 text-foreground text-xs hover:border-white/20">
          <SelectValue placeholder={`Select a ${active.label.toLowerCase().slice(0, -1)}…`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All {active.label.toLowerCase()}</SelectItem>
          {list.map((item) => <SelectItem key={item.id} value={item.id}>{item[active.nameKey]}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}