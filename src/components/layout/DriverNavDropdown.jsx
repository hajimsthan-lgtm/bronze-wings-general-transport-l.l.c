import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SearchableSelect from '@/components/common/SearchableSelect';

export default function DriverNavDropdown() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  useEffect(() => {base44.entities.Driver.list('-created_date', 200).then((d) => setDrivers((d || []).filter((x) => !x.vendor_name))).catch(() => {});}, []);

  const items = [
    { value: 'all', label: 'All drivers' },
    ...drivers.map((d) => ({
      value: d.id,
      label: d.name,
      search: d.phone ? ` ${d.phone}` : '',
    })),
  ];

  return (
    <div className="w-[130px] sm:w-[200px]">
      <SearchableSelect
        value="all"
        onChange={(id) => id === 'all' ? navigate('/admin/drivers') : navigate(`/admin/drivers/${id}`)}
        placeholder="Select a driver…"
        items={items}
        className="h-8 bg-white/5 border-white/10 text-foreground text-xs"
      />
    </div>
  );
}