import { Truck, CheckCircle2, Clock, CalendarClock, Building2, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

/**
 * Four KPI cards replacing the old OperationsToolbar panel.
 * Shows trip or contract summary metrics depending on mode.
 */
export default function OperationsStats({ mode, tripsCount, totalRevenue, tripCounts, contractsCount, contractCounts }) {
  const isContract = mode === 'contract';

  const stats = isContract ? [
    { label: 'Contracts', value: contractsCount, icon: Building2, accent: '#a855f7' },
    { label: 'Active', value: contractCounts.active, icon: CheckCircle2, accent: '#34d399' },
    { label: 'Expired', value: contractCounts.expired, icon: Clock, accent: '#f59e0b' },
    { label: 'Terminated', value: contractCounts.terminated, icon: FileText, accent: '#f43f5e' },
  ] : [
    { label: 'Total Trips', value: tripsCount, icon: Truck, accent: '#1ED760', sub: formatCurrency(totalRevenue) },
    { label: 'Completed', value: tripCounts.completed, icon: CheckCircle2, accent: '#34d399' },
    { label: 'In Transit', value: tripCounts.in_transit, icon: Clock, accent: '#f59e0b' },
    { label: 'Scheduled', value: tripCounts.scheduled, icon: CalendarClock, accent: '#3b82f6' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="stat-tile p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.accent}1a`, border: `1px solid ${s.accent}33` }}
            >
              <Icon className="w-5 h-5" style={{ color: s.accent }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{s.label}</p>
              <p className="text-lg font-bold text-foreground tabular-nums truncate">{s.value}</p>
              {s.sub && <p className="text-[10px] text-muted-foreground truncate">{s.sub}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}