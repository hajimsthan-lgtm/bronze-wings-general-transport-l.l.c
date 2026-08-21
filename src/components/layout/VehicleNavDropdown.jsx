import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SearchableSelect from '@/components/common/SearchableSelect';

export default function VehicleNavDropdown() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    base44.entities.Vehicle.list('-created_date', 200).then((v) => setVehicles((v || []).filter((x) => !x.vendor_name))).catch(() => {});
  }, []);

  const items = [
    { value: 'all', label: 'All Vehicles' },
    ...vehicles.map((v) => ({
      value: v.id,
      label: v.plate_number,
      search: v.make ? ` ${v.make} ${v.model || ''}` : '',
      content: (
        <span className="truncate">
          {v.plate_number}{v.make ? <span className="text-muted-foreground"> · {v.make} {v.model || ''}</span> : ''}
        </span>
      ),
    })),
  ];

  return (
    <div className="w-[130px] sm:w-[200px]">
      <SearchableSelect
        value="all"
        onChange={(id) => id === 'all' ? navigate('/admin/vehicles') : navigate(`/admin/vehicles/${id}`)}
        placeholder="Select a vehicle…"
        items={items}
        className="h-8 bg-white/5 border-white/10 text-foreground text-xs"
      />
    </div>
  );
}