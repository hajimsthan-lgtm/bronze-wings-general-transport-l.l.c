import React from 'react';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  active: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
  completed: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
  paid: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
  pending: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
  partial: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
  maintenance: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
  on_leave: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
  inactive: 'bg-muted border-border text-muted-foreground',
  cancelled: 'bg-red-500/10 border-red-500/20 text-red-600',
  rejected: 'bg-red-500/10 border-red-500/20 text-red-600',
  default: 'bg-blue-500/10 border-blue-500/20 text-blue-600',
};

/**
 * Premium glass surface — theme-aware (white card on light theme).
 */
export default function LiquidGlassCard({
  icon: Icon,
  title,
  status,
  statusLabel,
  footer,
  children,
  className = '',
  onClick,
  ...rest
}) {
  const statusClass = STATUS_STYLES[status] || STATUS_STYLES.default;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative rounded-[20px] border border-border p-5 bg-card',
        'shadow-[0_4px_16px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)]',
        'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        'hover:-translate-y-0.5 hover:border-primary/20',
        'hover:shadow-[0_8px_24px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.9)]',
        onClick && 'cursor-pointer',
        className
      )}
      {...rest}
    >
      <span className="pointer-events-none absolute left-0 top-1/2 h-2/3 w-px -translate-y-1/2 rounded-full bg-primary opacity-0 shadow-[0_0_8px_rgba(var(--panel-accent-rgb),0.7)] transition-opacity duration-300 group-hover:opacity-100" />

      {(Icon || title || status) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div
                className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                style={{
                  background: 'rgba(var(--panel-accent-rgb),0.10)',
                  border: '1px solid rgba(var(--panel-accent-rgb),0.25)',
                }}
              >
                <Icon className="w-4 h-4 text-primary" />
              </div>
            )}
            {title && (
              <h3 className="font-bold text-foreground text-[15px] tracking-tight truncate">{title}</h3>
            )}
          </div>
          {status && (
            <span className={cn('flex-shrink-0 rounded-full border px-3 py-0.5 text-xs font-medium', statusClass)}>
              {statusLabel || status}
            </span>
          )}
        </div>
      )}

      {children && <div className="text-muted-foreground text-sm space-y-1.5">{children}</div>}

      {footer && (
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
          {footer}
        </div>
      )}
    </div>
  );
}