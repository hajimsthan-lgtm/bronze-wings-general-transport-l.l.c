import { Pencil, Trash2, ArrowDownLeft, ArrowUpRight, Hash, Link2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const fmt = (n) => new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);

/**
 * Mobile-only card list for ledger entries (petty cash + bank rec).
 * Clean, structured transaction cards with colored accent stripes.
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
    <div className="space-y-2.5 px-3 py-3">
      {rows.map((r, idx) => {
        const hasInflow = Number(r.in) > 0;
        const hasOutflow = Number(r.out) > 0;
        const isFlow = hasInflow ? 'in' : hasOutflow ? 'out' : 'neutral';
        const refVal = r[refKey] || r.ref || '';

        const accentColor = isFlow === 'in' ? '#34d399' : isFlow === 'out' ? '#f43f5e' : '#64748b';
        const accentBg = isFlow === 'in' ? 'rgba(52,211,153,0.12)' : isFlow === 'out' ? 'rgba(244,63,94,0.12)' : 'rgba(100,116,139,0.12)';
        const accentBorder = isFlow === 'in' ? 'rgba(52,211,153,0.25)' : isFlow === 'out' ? 'rgba(244,63,94,0.25)' : 'rgba(100,116,139,0.20)';

        return (
          <div
            key={r.id || idx}
            className="relative rounded-2xl overflow-hidden border border-border/40"
            style={{
              background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.65) 0%, rgba(var(--surf-2-rgb),0.80) 100%)',
              backdropFilter: 'blur(16px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 3px 12px rgba(0,0,0,0.12)',
            }}
          >
            {/* Left accent stripe */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5"
              style={{ background: accentColor, opacity: 0.7 }}
            />

            <div className="p-3.5 pl-5">
              {/* Top row: icon + date/ref + amount */}
              <div className="flex items-start justify-between gap-2.5 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: accentBg, border: `1px solid ${accentBorder}` }}
                  >
                    {hasInflow ? (
                      <ArrowDownLeft className="w-4.5 h-4.5" style={{ color: accentColor }} />
                    ) : hasOutflow ? (
                      <ArrowUpRight className="w-4.5 h-4.5" style={{ color: accentColor }} />
                    ) : (
                      <Hash className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-mono font-semibold text-foreground/90 tabular-nums truncate leading-tight">
                      {r.date || '—'}
                    </p>
                    {refVal && (
                      <p className="text-[10px] text-muted-foreground/60 font-mono truncate mt-0.5">
                        #{refVal}
                      </p>
                    )}
                  </div>
                </div>
                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  {hasInflow && (
                    <p className="text-lg font-bold font-mono tabular-nums leading-tight" style={{ color: accentColor }}>
                      +{fmt(r.in)}
                    </p>
                  )}
                  {hasOutflow && (
                    <p className="text-lg font-bold font-mono tabular-nums leading-tight" style={{ color: accentColor }}>
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
                <p className="text-sm text-foreground font-semibold leading-snug mb-1 break-words">
                  {r.description}
                </p>
              )}

              {/* Recipient */}
              {hasRecipient && r.recipient && (
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-xs text-muted-foreground/70 truncate flex-1">
                    <span className="text-muted-foreground/50">To/From: </span>
                    {r.recipient}
                  </p>
                  {r.recipient_type && (
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide flex-shrink-0 ${
                      r.recipient_type === 'driver'
                        ? 'bg-primary/15 text-primary border border-primary/25'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {r.recipient_type === 'driver' ? <Link2 className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                      {r.recipient_type === 'driver' ? 'Driver' : 'Manual'}
                    </span>
                  )}
                </div>
              )}

              {/* Divider + Balance + Actions */}
              <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-border/25">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-bold">Balance</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-primary truncate">
                    {fmt(r.running_balance)}
                  </span>
                </div>
                {showActions && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onEdit?.(r)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
                      style={{
                        background: 'rgba(245,158,11,0.10)',
                        border: '1px solid rgba(245,158,11,0.20)',
                        color: '#f59e0b',
                      }}
                      aria-label="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete?.(r.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
                      style={{
                        background: 'rgba(244,63,94,0.10)',
                        border: '1px solid rgba(244,63,94,0.20)',
                        color: '#f43f5e',
                      }}
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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