import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function GlobalEntitySelector() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    base44.entities.Client.list('-created_date', 200).then(setClients).catch(() => {});
    base44.entities.Driver.list('-created_date', 200).then(setDrivers).catch(() => {});
    base44.entities.Vehicle.list('-created_date', 100).then(setVehicles).catch(() => {});
  }, []);

  const triggerCls = 'w-[112px] h-8 bg-white/5 border-white/10 text-foreground text-xs hover:border-white/20';

  return (
    <div className="hidden md:flex items-center gap-2">
      <Select value="all" onValueChange={(id) => id !== 'all' && navigate(`/admin/clients/${id}`)}>
        <SelectTrigger className={triggerCls}><SelectValue placeholder="Clients" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All clients</SelectItem>
          {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value="all" onValueChange={(id) => id !== 'all' && navigate(`/admin/drivers/${id}`)}>
        <SelectTrigger className={triggerCls}><SelectValue placeholder="Drivers" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All drivers</SelectItem>
          {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value="all" onValueChange={(id) => id !== 'all' && navigate(`/admin/vehicles/${id}`)}>
        <SelectTrigger className={triggerCls}><SelectValue placeholder="Vehicles" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All vehicles</SelectItem>
          {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.plate_number}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}