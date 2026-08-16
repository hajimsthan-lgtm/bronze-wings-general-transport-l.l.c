import { Truck, Clock, CheckCircle2, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Visual summary card — active vs pending trips for quick tracking.
 * Active = in_transit, Pending = scheduled.
 */
export default function TripsStatusCard({ activeCount, pendingCount, completedCount }) {
  const total = activeCount + pendingCount + completedCount;
  const activePct = total > 0 ? (activeCount / total) * 100 : 0;
  const pendingPct = total > 0 ? (pendingCount / total) * 100 : 0;
  const completedPct = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <Link
      to="/trips"
      className="block group"
    >
      <div
        className="kpi-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
        style={{
          background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.70) 0%, rgba(var(--surf-2-rgb),0.86) 100%)',
          border: '1px solid rgba(var(--panel-accent-rgb),0.14)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 28px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(var(--panel-accent-rgb),0.25), rgba(var(--panel-accent-rgb),0.12))',
                border: '1px solid rgba(var(--panel-accent-rgb),0.30)',
              }}
            >
              <Truck className="w-4.5 h-4.5 text-primary" style={{ color: 'hsl(var(--primary))' }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Trips Status</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active vs Pending</p>
            </div>
          </div>
          <span className="text-2xl font-bold tabular-nums text-foreground">{total}</span>
        </div>

        {/* Stacked progress bar — visual ratio */}
        <div className="h-2.5 rounded-full overflow-hidden flex bg-muted/50 mb-4">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${activePct}%`,
              background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              boxShadow: '0 0 8px rgba(59,130,246,0.4)',
            }}
          />
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${pendingPct}%`,
              background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              boxShadow: '0 0 8px rgba(245,158,11,0.3)',
            }}
          />
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${completedPct}%`,
              background: 'linear-gradient(90deg, #10b981, #34d399)',
              boxShadow: '0 0 8px rgba(16,185,129,0.3)',
            }}
          />
        </div>

        {/* Legend — three stat chips */}
        <div className="grid grid-cols-3 gap-2">
          {/* Active */}
          <div className="rounded-xl p-2.5 bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Activity className="w-3 h-3 text-blue-400" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-400">Active</span>
            </div>
            <p className="text-lg font-bold tabular-nums text-foreground leading-none">{activeCount}</p>
          </div>

          {/* Pending */}
          <div className="rounded-xl p-2.5 bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-400">Pending</span>
            </div>
            <p className="text-lg font-bold tabular-nums text-foreground leading-none">{pendingCount}</p>
          </div>

          {/* Completed */}
          <div className="rounded-xl p-2.5 bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400">Done</span>
            </div>
            <p className="text-lg font-bold tabular-nums text-foreground leading-none">{completedCount}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}