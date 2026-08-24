import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExcelIcon, PdfIcon } from '@/components/common/BrandIcons';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';

export default function ExportButtons({ data, filename, columns, title, options }) {
  const [busy, setBusy] = useState(null);

  const handleCSV = () => {
    setBusy('csv');
    try {
      exportToCSV(data, filename, columns);
    } finally {
      setBusy(null);
    }
  };

  const handlePDF = async () => {
    setBusy('pdf');
    try {
      await exportToPDF(data, filename, columns, title, options);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCSV}
        disabled={busy !== null || !data?.length}
        className="gap-2"
      >
        <ExcelIcon className="w-4 h-4" />
        {busy === 'csv' ? 'Exporting...' : 'CSV'}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePDF}
        disabled={busy !== null || !data?.length}
        className="gap-2"
      >
        <PdfIcon className="w-4 h-4" />
        {busy === 'pdf' ? 'Exporting...' : 'PDF'}
      </Button>
    </div>
  );
}