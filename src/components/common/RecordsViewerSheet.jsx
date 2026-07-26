import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { Table, FileText, Calendar } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';

export default function RecordsViewerSheet({ open, onOpenChange, title, icon: Icon, accent = '#3b82f6', records = [], columns = [], renderRow, dateField = 'date', filename = 'records' }) {
  const [from, setFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);

  const filtered = useMemo(() => (records || []).filter((r) => {
    const d = r[dateField] || r.trip_date;
    if (!d) return true;
    return d >= from && d <= to;
  }), [records, from, to, dateField]);

  const exportData = filtered.map((r) => {
    const o = {};
    columns.forEach((c) => { o[c.key] = r[c.key]; });
    return o;
  });
  const dateRange = `${from} to ${to}`;
  const handleCsv = () => exportToCSV(exportData, filename, columns);
  const handlePdf = () => exportToPDF(exportData, filename, columns, title, { dateRange });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col bg-card">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border" style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0.14)}, transparent)` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(accent, 0.16), border: `1px solid ${hexToRgba(accent, 0.35)}`, boxShadow: `0 0 18px -6px ${accent}` }}>
              {Icon && <Icon className="w-5 h-5" style={{ color: accent }} />}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="font-display text-foreground">{title}</SheetTitle>
              <p className="text-xs text-muted-foreground">{filtered.length} records · {dateRange}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="px-5 py-3 flex flex-wrap items-center gap-2 border-b border-border bg-muted/20">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-transparent text-xs text-foreground border border-border rounded-lg px-2 py-1" />
            <span className="text-muted-foreground text-xs">→</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-transparent text-xs text-foreground border border-border rounded-lg px-2 py-1" />
          </div>
          <div className="ml-auto flex gap-1.5">
            <button onClick={handleCsv} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-foreground hover:bg-white/10 transition-colors"><Table className="w-3 h-3" /> CSV</button>
            <button onClick={handlePdf} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-white text-[11px] font-medium transition-transform active:scale-95" style={{ background: accent, boxShadow: `0 4px 14px -4px ${accent}` }}><FileText className="w-3 h-3" /> PDF</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No records in this period</p>
          ) : (
            filtered.map((rec, i) => (renderRow ? renderRow(rec, i) : (
              <div key={i} className="rounded-xl p-3 border" style={{ background: hexToRgba(accent, 0.06), borderColor: hexToRgba(accent, 0.18) }}>
                <p className="text-sm text-foreground truncate">{columns.map((c) => rec[c.key]).filter(Boolean).join(' · ')}</p>
              </div>
            )))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}