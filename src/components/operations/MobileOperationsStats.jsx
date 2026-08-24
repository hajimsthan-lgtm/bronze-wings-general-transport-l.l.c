import { Truck, CheckCircle2, Clock, CalendarClock, Building2, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

/**
 * Mobile-only horizontal scroll carousel of stat chips.
 * Replaces the 2x2 grid that truncates sub-text and uses hardcoded colors.
 * Theme-aware, fully visible, no content hiding.
 */
export default function MobileOperationsStats({ mode, tripsCount, totalRevenue, tripCounts, contractsCount, contractCounts }) {
  const isContract = mode === 'contract';

  const stats = isContract ? [
    { label: 'Contracts', value: contractsCount, icon: Building2 },
    { label: 'Active', value: contractCounts.active, icon: CheckCircle2 },
    { label: 'Expired', value: contractCounts.expired, icon: Clock },
    { label: 'Terminated', value: contractCounts.terminated, icon: FileText },
  ] : [
    { label: 'Total Trips', value: tripsCount, icon: Truck, sub: formatCurrency(totalRevenue) },
    { label: 'Completed', value: tripCounts.completed, icon: CheckCircle2 },
    { label: 'Started', value: tripCounts.trip_started, icon: Clock },
    { label: 'Scheduled', value: tripCounts.scheduled, icon: CalendarClock },
  ];

  return (
    <div className="md:hidden -mx-1 px-1">
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="snap-start flex-shrink-0 w-[140px] rounded-2xl p-3 flex flex-col gap-2"
              style={{
                background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.88) 0%, rgba(var(--surf-2-rgb),0.94) 100%)',
                border: '1px solid rgba(var(--panel-accent-rgb),0.15)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 14px rgba(0,0,0,0.06)',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(var(--panel-accent-rgb),0.14)',
                    border: '1px solid rgba(var(--panel-accent-rgb),0.30)',
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: 'rgb(var(--panel-accent-rgb))' }} />
                </div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold leading-tight">
                  {s.label}
                </p>
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums leading-none">
                {s.value}
              </p>
              {s.sub && (
                <p className="text-[10px] text-muted-foreground tabular-nums leading-tight whitespace-nowrap">
                  {s.sub}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}