import { ExcelIcon, PdfIcon } from '@/components/common/BrandIcons';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';

export default function SectionExportButtons({ data, filename, columns, title, options, className = '' }) {
  const btn = 'p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors';
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button title="Export CSV" onClick={() => exportToCSV(data, filename, columns)} className={btn}>
        <ExcelIcon className="w-3.5 h-3.5" />
      </button>
      <button title="Export PDF" onClick={() => exportToPDF(data, filename, columns, title || filename, options)} className={btn}>
        <PdfIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}