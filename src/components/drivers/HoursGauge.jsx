import { useState } from 'react';
import { Clock, Eye } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import { formatCurrency, formatDate } from '@/lib/formatters';
import QuickViewModal from './QuickViewModal';

export default function HoursGauge({ hours = 0, target = 40, trips = [] }) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const pct = Math.min(100, (hours / target) * 100);
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="glass-card rounded-2xl flex flex-col animate-fade-in-up transition-all duration-200" style={{ borderLeft: '4px solid #a855f7' }}>
      <div className="flex items-center justify-between h-12 px-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba('#a855f7', 0.10), border: `1px solid ${hexToRgba('#a855f7', 0.25)}` }}>
            <Clock className="w-4 h-4" style={{ color: '#a855f7' }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Time Tracker</h3>
            <p className="text-xs text-muted-foreground truncate">Hours this period</p>
          </div>
        </div>
        <button onClick={() => setQuickViewOpen(true)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0" title="Quick View">
          <Eye className="w-4 h-4" />
        </button>
      </div>

      <div className="h-[280px] flex flex-col items-center justify-center p-5">
        <div className="relative flex items-center justify-center my-2">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.12" strokeWidth="6" />
            <circle cx="70" cy="70" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground tabular-nums">{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Work Time</span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground text-center tabular-nums">
          {hours.toFixed(1)}h of {target}h target
        </p>
      </div>

      <QuickViewModal
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        title="Time Tracker — Quick View"
        icon={Clock}
        accent="#a855f7"
        records={trips}
        dateField="trip_date"
        filename="time-tracker"
        columns={[
          { label: 'Date', key: 'trip_date' },
          { label: 'Route', key: 'route' },
          { label: 'Hours', key: 'hours', numeric: true },
          { label: 'Revenue', key: 'revenue', numeric: true },
          { label: 'Status', key: 'status' },
        ]}
        renderRow={(t) => {
          const hrs = Number(t.hours) || Number(t.calculated_duration) || 0;
          return (
            <div key={t.id} className="flex items-center gap-3 rounded-xl p-3 border" style={{ background: hexToRgba('#a855f7', 0.06), borderColor: hexToRgba('#a855f7', 0.18) }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{t.from_location} → {t.to_location}</p>
                <p className="text-xs text-muted-foreground">{formatDate(t.trip_date)} · {t.vehicle_plate}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-foreground tabular-nums">{hrs.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(t.revenue)}</p>
              </div>
            </div>
          );
        }}
        summaryFooter={(filtered) => {
          const totalH = filtered.reduce((s, t) => s + (Number(t.hours) || Number(t.calculated_duration) || 0), 0);
          return (
            <div className="flex items-center justify-between">
              <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Hours</p><p className="text-lg font-bold text-foreground tabular-nums">{totalH.toFixed(1)}h</p></div>
              <div className="text-right"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Trips</p><p className="text-lg font-bold text-foreground tabular-nums">{filtered.length}</p></div>
            </div>
          );
        }}
      />
    </div>
  );
}