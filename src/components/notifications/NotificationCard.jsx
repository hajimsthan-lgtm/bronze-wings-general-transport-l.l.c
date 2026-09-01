import { ChevronRight, CheckCircle2, AlertTriangle, FileWarning, Receipt, Truck, Wrench, IdCard, FileText, CalendarClock, Lightbulb, ExternalLink, RotateCcw } from 'lucide-react';
import { SEVERITY } from '@/lib/alertEngine';

const ICONS = { FileWarning, Receipt, Truck, Wrench, IdCard, FileText, CalendarClock, CheckCircle2, AlertTriangle };

// Recommended action per category — gives every alert a concrete next step.
const SOLUTIONS = {
  documents: 'Renew the document before expiry or update the record with the new expiry date.',
  payments: 'Follow up with the client/vendor and record the payment or mark the invoice overdue.',
  trips: 'Update the trip status — mark completed or cancel if it no longer applies.',
  maintenance: 'Schedule the service or return the vehicle to active duty once cleared.',
};

export default function NotificationCard({ alert, onOpen, onResolve }) {
  const Icon = ICONS[alert.icon] || AlertTriangle;
  const sev = SEVERITY[alert.severity] || SEVERITY.info;
  const isCritical = alert.severity === 'critical';
  const isWarning = alert.severity === 'warning';
  const solution = SOLUTIONS[alert.category] || 'Open the record to review and correct it.';

  return (
    <div
      className="notification-card group relative rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-2px]"
      style={{
        background: isCritical
          ? 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(252,165,165,0.05) 100%)'
          : isWarning
          ? 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(254,215,170,0.04) 100%)'
          : 'linear-gradient(135deg, rgba(var(--panel-accent-rgb),0.08) 0%, rgba(var(--panel-accent2-rgb),0.04) 100%)',
        border: `1px solid ${isCritical ? 'rgba(239,68,68,0.28)' : isWarning ? 'rgba(245,158,11,0.22)' : 'rgba(var(--panel-accent-rgb),0.18)'}`,
        boxShadow: isCritical
          ? '0 6px 20px rgba(239,68,68,0.10), inset 0 1px 0 rgba(255,255,255,0.9)'
          : '0 2px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)',
      }}
    >
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: sev.color, boxShadow: `0 0 10px ${sev.color}80` }} />

      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center relative"
            style={{
              background: isCritical
                ? 'linear-gradient(145deg, rgba(239,68,68,0.18), rgba(239,68,68,0.06))'
                : isWarning
                ? 'linear-gradient(145deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))'
                : 'linear-gradient(145deg, rgba(var(--panel-accent-rgb),0.15), rgba(var(--panel-accent-rgb),0.05))',
              border: `1px solid ${isCritical ? 'rgba(239,68,68,0.28)' : isWarning ? 'rgba(245,158,11,0.22)' : 'rgba(var(--panel-accent-rgb),0.2)'}`,
            }}
          >
            <Icon className="w-5 h-5" style={{ color: sev.color }} />
            {isCritical && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{ background: '#ef4444', boxShadow: '0 0 8px rgba(239,68,68,0.6)', animation: 'live-pulse 1.6s infinite' }} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-sm font-bold text-foreground truncate">{alert.title}</p>
              {isCritical && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.14)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.28)' }}>Critical</span>
              )}
              {isWarning && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.14)', color: '#d97706', border: '1px solid rgba(245,158,11,0.28)' }}>Warning</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{alert.sub}</p>
            {alert.meta && (
              <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono uppercase tracking-wider">{alert.meta}</p>
            )}
            {/* Solution advisor */}
            <div className="mt-2.5 flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.06]">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-foreground/80 leading-snug"><span className="font-semibold text-amber-600 dark:text-amber-400">Recommended:</span> {solution}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <button
              onClick={() => onOpen(alert.to)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all hover:translate-x-0.5"
              style={{ background: 'linear-gradient(135deg, rgb(var(--panel-accent-rgb)), rgb(var(--panel-accent2-rgb)))', color: '#fff', boxShadow: '0 2px 8px rgba(var(--panel-accent-rgb),0.25)' }}
            >
              Open <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => onResolve(alert.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all hover:bg-muted/50"
              style={{ borderColor: 'rgba(0,0,0,0.08)', color: 'hsl(var(--muted-foreground))' }}
              title="Mark as resolved"
            >
              <CheckCircle2 className="w-3 h-3" /> Resolve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}