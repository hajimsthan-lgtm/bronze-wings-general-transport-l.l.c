import { useState } from 'react';
import { CheckCircle2, Circle, ListChecks, ChevronDown } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

export default function TripChecklist({ trips = [] }) {
  const [open, setOpen] = useState(false);
  const list = trips.slice(0, 6);
  const done = list.filter((t) => t.status === 'completed').length;

  return (
    <div
      className="glass-card rounded-2xl p-5 animate-fade-in-up transition-all duration-300"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-left">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba('#34d399', 0.14), border: `1px solid ${hexToRgba('#34d399', 0.3)}` }}>
            <ListChecks className="w-4 h-4" style={{ color: '#34d399' }} />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">Trip Checklist</h3>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
          </div>
        </button>
        <span className="text-xs font-semibold text-foreground tabular-nums px-2 py-1 rounded-full" style={{ background: hexToRgba('#34d399', 0.12), border: `1px solid ${hexToRgba('#34d399', 0.25)}` }}>
          {done}/{list.length}
        </span>
      </div>

      {open && (
      <div className="rounded-xl border border-border overflow-hidden p-4 space-y-2">
        {list.length === 0 && <p className="text-xs text-muted-foreground py-2">No trips in this period.</p>}
        {list.map((t) => {
          const ok = t.status === 'completed';
          return (
            <div key={t.id} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 border border-white/[0.06]" style={{ background: hexToRgba('#ffffff', 0.03) }}>
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
      )}
    </div>
  );
}