import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReportClient, setReportClient } from '@/lib/reportClientFilter';

export default function ReportClientDropdown() {
  const [clients, setClients] = useState([]);
  const value = useReportClient();

  useEffect(() => {
    base44.entities.Client.list('-created_date', 500).then(setClients).catch(() => {});
  }, []);

  return (
    <Select value={value} onValueChange={setReportClient}>
      

      
      <SelectContent>
        <SelectItem value="all">All Clients</SelectItem>
        {clients.map((c) =>
        <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
        )}
      </SelectContent>
    </Select>);

}