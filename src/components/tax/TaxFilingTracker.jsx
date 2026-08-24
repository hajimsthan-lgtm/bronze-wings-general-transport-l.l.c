import { Landmark, Building2, CheckCircle2, Clock, AlertTriangle, CalendarClock } from 'lucide-react';
import { FILING_STATUS_META } from '@/lib/taxCalculations';
import { formatDate } from '@/lib/formatters';

export default function TaxFilingTracker({ periods, filedRecords }) {
  if (!periods.length) {
    return <p className="text-xs text-muted-foreground py-6 text-center">No filing periods.</p>;
  }

  return (
    <div className="space-y-1.5">
      {periods.map((period, i) => {
        const status = period._status;
        const meta = FILING_STATUS_META[status] || FILING_STATUS_META.upcoming;
        const isVat = period.filing_type === 'vat201';
        const Icon = isVat ? Landmark : Building2;
        const tone = isVat ? '#6366f1' : '#a855f7';
        const filed = filedRecords.find(
          (r) =>
            r.filing_type === period.filing_type &&
            r.period_label === period.period_label &&
            r.filed_date
        );

        const StatusIcon =
          status === 'filed' ? CheckCircle2 :
          status === 'due_soon' ? Clock :
          status === 'overdue' ? AlertTriangle :
          CalendarClock;

        return (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${tone}1a`, border: `1px solid ${tone}55` }}
            >
              <Icon className="w-4 h-4" style={{ color: tone }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{period.period_label}</p>
              <p className="text-xs text-muted-foreground">
                Due {formatDate(period.due_date)}
                {filed && ` · Filed ${formatDate(filed.filed_date)}`}
                {filed?.reference_number && ` · Ref: ${filed.reference_number}`}
              </p>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.bg} ${meta.text} ${meta.border} border`}>
              <StatusIcon className="w-3 h-3" />
              {meta.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}