import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DriverNavDropdown() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  useEffect(() => {base44.entities.Driver.list('-created_date', 200).then(setDrivers).catch(() => {});}, []);

  const onSelect = (id) => {if (id === 'all') navigate('/admin/drivers');else navigate(`/admin/drivers/${id}`);};

  return (
    <Select value="all" onValueChange={onSelect}>
      

      
      <SelectContent>
        <SelectItem value="all">All drivers</SelectItem>
        {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
      </SelectContent>
    </Select>);

}