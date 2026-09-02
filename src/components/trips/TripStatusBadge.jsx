import { cn } from '@/lib/utils';
import { STATUS_META } from '@/lib/tripStatusWorkflow';

/**
 * Read-only status pill for trips. Color-coded per status.
 * No dropdown, no click-to-edit — status only changes via the
 * automated engine (or admin override, handled elsewhere).
 */
export default function TripStatusBadge({ trip, size = 'sm', className = '' }) {
  const meta = STATUS_META[trip?.status] || STATUS_META.scheduled;
  const padCls = size === 'sm' ? 'text-[10px] px-2 py-1' : 'text-xs px-2.5 py-1.5';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold rounded-full border whitespace-nowrap select-none',
        padCls,
        meta.textClass,
        meta.borderClass,
        meta.bgClass,
        className
      )}
      title={meta.label}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}