import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function VehicleNavDropdown() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    base44.entities.Vehicle.list('-created_date', 200).then(setVehicles).catch(() => {});
  }, []);

  const onSelect = (id) => {
    if (id === 'all') navigate('/admin/vehicles');
    else navigate(`/admin/vehicles/${id}`);
  };

  return (
    <Select value="all" onValueChange={onSelect}>
      <SelectTrigger className="w-[200px] h-8 bg-white/5 border-white/10 text-foreground text-xs">
        <SelectValue placeholder="Select a vehicle…" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Vehicles</SelectItem>
        {vehicles.map((v) => (
          <SelectItem key={v.id} value={v.id}>
            {v.plate_number}{v.make ? ` · ${v.make} ${v.model || ''}` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}