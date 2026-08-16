import { CheckCircle2, Circle, ListChecks } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import EmptyState from '@/components/common/EmptyState';

export default function TripChecklist({ trips = [] }) {
  const list = trips.slice(0, 6);
  const done = list.filter((t) => t.status === 'completed').length;

  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up transition-all duration-200" style={{ borderLeft: '4px solid #34d399' }}>
      <div className="flex items-center justify-between h-12 px-4 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba('#34d399', 0.10), border: `1px solid ${hexToRgba('#34d399', 0.25)}` }}>
            <ListChecks className="w-4 h-4" style={{ color: '#34d399' }} />
          </div>
          <h3 className="text-sm font-semibold text-foreground truncate">Trip Checklist</h3>
        </div>
        <span className="text-[11px] font-bold text-foreground tabular-nums px-2 py-0.5 rounded-full bg-muted">
          {done}/{list.length}
        </span>
      </div>

      <div className="p-4 space-y-2">
        {list.length === 0 && <EmptyState icon={ListChecks} title="No trips in this period" />}
        {list.map((t) => {
          const ok = t.status === 'completed';
          return (
            <div key={t.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 border border-border/40 bg-muted/20">
              {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{t.from_location} → {t.to_location}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(t.trip_date)}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{t.vehicle_plate}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}