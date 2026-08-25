import { Truck, CheckCircle2, Clock, CalendarClock, Building2, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

/**
 * Mobile-only horizontal scroll carousel of stat chips.
 * Cards are clickable — clicking filters the list below by that status.
 * Active filter is highlighted with accent ring.
 */
export default function MobileOperationsStats({ mode, tripsCount, totalRevenue, tripCounts, contractsCount, contractCounts, activeFilter, onStatClick }) {
  const isContract = mode === 'contract';

  const stats = isContract ? [
    { label: 'Contracts', value: contractsCount, icon: Building2, filter: 'all' },
    { label: 'Active', value: contractCounts.active, icon: CheckCircle2, filter: 'active' },
    { label: 'Expired', value: contractCounts.expired, icon: Clock, filter: 'expired' },
    { label: 'Terminated', value: contractCounts.terminated, icon: FileText, filter: 'terminated' },
  ] : [
    { label: 'Total Trips', value: tripsCount, icon: Truck, sub: formatCurrency(totalRevenue), filter: 'all' },
    { label: 'Completed', value: tripCounts.completed, icon: CheckCircle2, filter: 'completed' },
    { label: 'Started', value: tripCounts.trip_started, icon: Clock, filter: 'trip_started' },
    { label: 'Scheduled', value: tripCounts.scheduled, icon: CalendarClock, filter: 'scheduled' },
  ];

  return (
    <div className="md:hidden -mx-1 px-1">
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
        {stats.map((s) => {
          const Icon = s.icon;
          const isActive = activeFilter === s.filter;
          return (
            <button
              key={s.label}
              onClick={() => onStatClick?.(s.filter)}
              className="snap-start flex-shrink-0 w-[140px] rounded-2xl p-3 flex flex-col gap-2 text-left transition-all duration-200"
              style={{
                background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.88) 0%, rgba(var(--surf-2-rgb),0.94) 100%)',
                border: isActive
                  ? '1px solid rgba(var(--panel-accent-rgb),0.55)'
                  : '1px solid rgba(var(--panel-accent-rgb),0.15)',
                boxShadow: isActive
                  ? 'inset 0 1px 0 rgba(255,255,255,0.8), 0 0 0 2px rgba(var(--panel-accent-rgb),0.25), 0 4px 14px rgba(0,0,0,0.08)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 14px rgba(0,0,0,0.06)',
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
            </button>
          );
        })}
      </div>
    </div>
  );
}