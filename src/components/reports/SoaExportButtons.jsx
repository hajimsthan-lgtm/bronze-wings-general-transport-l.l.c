import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ExcelIcon, PdfIcon } from '@/components/common/BrandIcons';
import { exportSoaCSV, exportSoaPDF } from '@/lib/soaExport';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'unpaid', label: 'Unpaid' },
];

export default function SoaExportButtons({ rows, filename, date, clientName, dateRange }) {
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');

  const filteredRows = filter === 'all'
    ? rows
    : rows.filter((r) => (filter === 'paid' ? r.raw_status === 'paid' : r.raw_status !== 'paid'));

  const pill = (key) =>
    `px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
      filter === key
        ? 'bg-primary/20 text-primary border border-primary/40 shadow-[0_0_10px_-2px_rgba(var(--panel-accent-rgb),0.4)]'
        : 'text-muted-foreground hover:text-foreground border border-transparent'
    }`;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 h-9 px-1.5 rounded-lg border border-border bg-card shadow-sm">
        {FILTERS.map((f) => (
          <button key={f.key} className={pill(f.key)} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => exportSoaCSV(filteredRows, `${filename}_${filter}`)}
        className="h-9"
      >
        <ExcelIcon className="w-3.5 h-3.5 mr-1" /> CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await exportSoaPDF(filteredRows, `${filename}_${filter}`, { date, clientName, dateRange });
          } finally {
            setBusy(false);
          }
        }}
        className="h-9"
      >
        <PdfIcon className="w-3.5 h-3.5 mr-1" /> PDF
      </Button>
    </div>
  );
}