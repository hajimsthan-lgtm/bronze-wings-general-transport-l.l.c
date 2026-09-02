import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { ChevronDown, Check, Lock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRIP_STATUSES, STATUS_META, canTransition } from '@/lib/tripStatusWorkflow';

/**
 * Status selector rendered inside the Trip form.
 * Mirrors the outside TripStatusDropdown visual style and transition rules,
 * but operates on form state (form.status) with automation + validation hooks.
 *
 * onStatusChange(newStatus) — parent decides whether to accept (after validation).
 */
export default function TripFormStatusSelector({ status, onStatusChange, size = 'md' }) {
  const meta = STATUS_META[status] || STATUS_META.scheduled;

  const padCls = size === 'sm' ? 'text-[10px] px-2 py-1' : 'text-xs px-2.5 py-1.5';
  const iconCls = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'font-bold rounded-full border inline-flex items-center gap-1.5 transition-colors hover:brightness-125 whitespace-nowrap',
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
      <DropdownMenuContent align="start" className="min-w-[200px]">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Set Status
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TRIP_STATUSES.map((st) => {
          const m = STATUS_META[st];
          const isCurrent = status === st;
          // For a new trip (no status yet), allow selecting scheduled freely
          const allowed = !status ? st === 'scheduled' : canTransition(status, st);
          const disabled = isCurrent || !allowed;
          return (
            <DropdownMenuItem
              key={st}
              onClick={() => !disabled && onStatusChange?.(st)}
              disabled={disabled}
              className={cn(
                'gap-2 text-xs',
                isCurrent && 'bg-primary/10 font-semibold',
                disabled && !isCurrent && 'opacity-35 cursor-not-allowed'
              )}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
              <span className="flex-1">{m.label}</span>
              {isCurrent && <Check className="w-3 h-3 ml-auto" />}
              {!isCurrent && disabled && <Lock className="w-2.5 h-2.5 ml-auto opacity-50" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}