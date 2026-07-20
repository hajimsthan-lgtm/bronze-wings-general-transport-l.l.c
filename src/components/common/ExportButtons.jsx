import { FileText, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';

export default function ExportButtons({ data, filename, columns, title, options }) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => exportToCSV(data, filename, columns)} className="h-9">
        <Table className="w-3.5 h-3.5 mr-1" /> CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => exportToPDF(data, filename, columns, title || filename, options)} className="h-9">
        <FileText className="w-3.5 h-3.5 mr-1" /> PDF
      </Button>
    </div>
  );
}