import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRIP_STATUSES, STATUS_META, canTransition } from '@/lib/tripStatusWorkflow';

/**
 * Inline status badge + dropdown for the Trips table.
 * Calls onSelectStatus(trip, newStatus) — the parent decides
 * whether to save immediately or open a modal.
 */
export default function TripStatusDropdown({ trip, onSelectStatus, size = 'sm' }) {
  const meta = STATUS_META[trip.status] || STATUS_META.scheduled;

  const padCls = size === 'sm' ? 'text-[10px] px-2 py-1' : 'text-xs px-2.5 py-1.5';
  const iconCls = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'font-bold rounded-full border inline-flex items-center gap-1 transition-colors hover:brightness-125 whitespace-nowrap',
            padCls,
            meta.textClass,
            meta.borderClass,
            meta.bgClass
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
          {meta.label}
          <ChevronDown className={cn(iconCls, 'opacity-60')} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[170px]">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Set Status
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TRIP_STATUSES.map((st) => {
          const m = STATUS_META[st];
          const isCurrent = trip.status === st;
          const allowed = canTransition(trip.status, st) || isCurrent;
          return (
            <DropdownMenuItem
              key={st}
              onClick={() => !isCurrent && onSelectStatus?.(trip, st)}
              disabled={isCurrent}
              className={cn(
                'gap-2 text-xs',
                isCurrent && 'bg-primary/10 font-semibold',
                !allowed && !isCurrent && 'opacity-40'
              )}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
              <span className="flex-1">{m.label}</span>
              {isCurrent && <Check className="w-3 h-3 ml-auto" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}