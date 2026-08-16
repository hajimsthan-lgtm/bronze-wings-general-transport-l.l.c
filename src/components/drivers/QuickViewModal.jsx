import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { Table, FileText, Calendar } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';

function startOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().split('T')[0];
}
function endOfWeek() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day + 6);
  return d.toISOString().split('T')[0];
}
function startOfMonth() { return new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]; }
function endOfMonth() { return new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]; }

const PRESETS = ['This Week', 'This Month', 'All'];

export default function QuickViewModal({
  open, onOpenChange, title, icon: Icon, accent = '#1ED760',
  records = [], dateField = 'date', columns = [],
  renderRow, bodyRender, summaryFooter, filename = 'quick-view',
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [preset, setPreset] = useState('All');

  const filtered = useMemo(() => {
    if (!from && !to) return records;
    return records.filter((r) => {
      const d = r[dateField] || r.trip_date;
      if (!d) return true;
      return (!from || d >= from) && (!to || d <= to);
    });
  }, [records, from, to, dateField]);

  const exportData = filtered.map((r) => {
    const o = {};
    columns.forEach((c) => { o[c.key] = r[c.key]; });
    return o;
  });
  const dateRange = `${from || 'start'} → ${to || 'now'}`;
  const handleCsv = () => exportToCSV(exportData, filename, columns);
  const handlePdf = () => exportToPDF(exportData, filename, columns, title, { dateRange });

  const applyPreset = (label) => {
    setPreset(label);
    if (label === 'All') { setFrom(''); setTo(''); }
    else if (label === 'This Week') { setFrom(startOfWeek()); setTo(endOfWeek()); }
    else if (label === 'This Month') { setFrom(startOfMonth()); setTo(endOfMonth()); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border flex-shrink-0" style={{ background: `linear-gradient(135deg, ${hexToRgba(accent, 0.14)}, transparent)` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(accent, 0.16), border: `1px solid ${hexToRgba(accent, 0.35)}`, boxShadow: `0 0 18px -6px ${accent}` }}>
              {Icon && <Icon className="w-5 h-5" style={{ color: accent }} />}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-display text-foreground">{title}</DialogTitle>
              <p className="text-xs text-muted-foreground">{filtered.length} records · {dateRange}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-5 py-3 flex flex-wrap items-center gap-2 border-b border-border bg-muted/20 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset('Custom'); }} className="bg-transparent text-xs text-foreground border border-border rounded-lg px-2 py-1" />
            <span className="text-muted-foreground text-xs">→</span>
            <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset('Custom'); }} className="bg-transparent text-xs text-foreground border border-border rounded-lg px-2 py-1" />
          </div>
          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => applyPreset(p)} className={`h-7 px-2.5 rounded-lg text-[11px] font-medium transition-colors ${preset === p ? 'text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`} style={preset === p ? { background: accent } : {}}>{p}</button>
            ))}
          </div>
          <div className="ml-auto flex gap-1.5">
            <button onClick={handleCsv} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-medium text-foreground hover:bg-white/10 transition-colors"><Table className="w-3 h-3" /> CSV</button>
            <button onClick={handlePdf} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-white text-[11px] font-medium transition-transform active:scale-95" style={{ background: accent, boxShadow: `0 4px 14px -4px ${accent}` }}><FileText className="w-3 h-3" /> PDF</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll p-4 min-h-0">
          {bodyRender ? bodyRender(filtered) : (
            filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No records in this period</p>
            ) : (
              <div className="space-y-2">{filtered.map(renderRow)}</div>
            )
          )}
        </div>

        {summaryFooter && (
          <div className="border-t border-border px-5 py-3 bg-muted/20 flex-shrink-0">
            {typeof summaryFooter === 'function' ? summaryFooter(filtered) : summaryFooter}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}