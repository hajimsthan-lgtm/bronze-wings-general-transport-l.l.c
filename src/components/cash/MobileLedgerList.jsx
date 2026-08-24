import { Pencil, Trash2, ArrowDownLeft, ArrowUpRight, Hash, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const fmt = (n) => new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);

/**
 * Mobile-only card list for ledger entries (petty cash + bank rec).
 * Replaces the horizontal-scroll table on mobile with breathable transaction cards.
 */
export default function MobileLedgerList({
  rows,
  refKey,
  refLabel,
  hasRecipient,
  inflowLabel,
  outflowLabel,
  onEdit,
  onDelete,
  showActions,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDescription,
}) {
  if (!rows || rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[280px] py-12 text-center px-6">
        <div className="empty-orb w-16 h-16 rounded-full flex items-center justify-center mb-4">
          {EmptyIcon ? <EmptyIcon className="w-7 h-7 text-primary/70" strokeWidth={1.5} /> : null}
        </div>
        <p className="text-sm font-semibold text-foreground/90">{emptyTitle || 'No entries'}</p>
        <p className="text-xs text-muted-foreground/70 mt-1.5 max-w-[280px] leading-relaxed">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-3 py-3">
      {rows.map((r, idx) => {
        const hasInflow = Number(r.in) > 0;
        const hasOutflow = Number(r.out) > 0;
        const isFlow = hasInflow ? 'in' : hasOutflow ? 'out' : 'neutral';
        const refVal = r[refKey] || r.ref || '';

        return (
          <div
            key={r.id || idx}
            className={cn(
              'relative rounded-2xl overflow-hidden border transition-all',
              isFlow === 'in' && 'border-emerald-500/25',
              isFlow === 'out' && 'border-rose-500/25',
              isFlow === 'neutral' && 'border-border/50'
            )}
            style={{
              background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.55) 0%, rgba(var(--surf-2-rgb),0.70) 100%)',
              backdropFilter: 'blur(20px) saturate(1.3)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 14px rgba(0,0,0,0.15)',
            }}
          >
            {/* Left accent stripe */}
            <div
              className={cn(
                'absolute left-0 top-0 bottom-0 w-1',
                isFlow === 'in' && 'bg-emerald-500/60',
                isFlow === 'out' && 'bg-rose-500/60',
                isFlow === 'neutral' && 'bg-muted-foreground/30'
              )}
            />

            <div className="p-4 pl-5">
              {/* Top row: date + flow badge */}
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      isFlow === 'in' && 'bg-emerald-500/15 text-emerald-400',
                      isFlow === 'out' && 'bg-rose-500/15 text-rose-400',
                      isFlow === 'neutral' && 'bg-muted/40 text-muted-foreground'
                    )}
                  >
                    {hasInflow ? <ArrowDownLeft className="w-4 h-4" /> : hasOutflow ? <ArrowUpRight className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-semibold text-foreground/90 tabular-nums truncate">{r.date || '—'}</p>
                    {refVal && (
                      <p className="text-[10px] text-muted-foreground/70 font-mono truncate flex items-center gap-1 mt-0.5">
                        <Hash className="w-2.5 h-2.5" />{refVal}
                      </p>
                    )}
                  </div>
                </div>
                {/* Amount badge */}
                <div className="text-right flex-shrink-0">
                  {hasInflow && (
                    <p className="text-base font-bold font-mono tabular-nums text-emerald-400 leading-tight">
                      +{fmt(r.in)}
                    </p>
                  )}
                  {hasOutflow && (
                    <p className="text-base font-bold font-mono tabular-nums text-rose-400 leading-tight">
                      −{fmt(r.out)}
                    </p>
                  )}
                  {!hasInflow && !hasOutflow && (
                    <p className="text-sm font-mono text-muted-foreground/50">0.00</p>
                  )}
                </div>
              </div>

              {/* Description */}
              {r.description && (
                <p className="text-sm text-foreground/85 font-medium leading-snug mb-1.5 break-words">
                  {r.description}
                </p>
              )}

              {/* Recipient */}
              {hasRecipient && r.recipient && (
                <p className="text-xs text-muted-foreground/80 mb-2 truncate">
                  <span className="text-muted-foreground/50">To/From: </span>
                  {r.recipient}
                </p>
              )}

              {/* Bottom row: running balance + actions */}
              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-border/30">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Balance</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-blue-400">
                    {fmt(r.running_balance)}
                  </span>
                </div>
                {showActions && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEdit?.(r)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-500/10 border border-amber-500/25 text-amber-400 active:scale-90 transition-transform"
                      aria-label="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(r.id)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/10 border border-red-500/25 text-red-400 active:scale-90 transition-transform"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}