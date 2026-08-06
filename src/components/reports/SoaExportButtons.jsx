import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExcelIcon, PdfIcon } from '@/components/common/BrandIcons';
import { exportSoaCSV, exportSoaPDF } from '@/lib/soaExport';

export default function SoaExportButtons({ rows, filename, date, clientName, dateRange }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => exportSoaCSV(rows, filename)} className="h-9">
        <ExcelIcon className="w-3.5 h-3.5 mr-1" /> CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={async () => { setBusy(true); try { await exportSoaPDF(rows, filename, { date, clientName, dateRange }); } finally { setBusy(false); } }}
        className="h-9"
      >
        <PdfIcon className="w-3.5 h-3.5 mr-1" /> PDF
      </Button>
    </div>
  );
}