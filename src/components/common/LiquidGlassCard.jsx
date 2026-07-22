import React from 'react';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  active: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  completed: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  paid: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  partial: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  maintenance: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  on_leave: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  inactive: 'bg-white/5 border-white/10 text-white/40',
  cancelled: 'bg-red-500/10 border-red-500/20 text-red-400',
  rejected: 'bg-red-500/10 border-red-500/20 text-red-400',
  default: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
};

/**
 * 2026 Liquid Glass Card — premium dark glassmorphism surface.
 * Optional header (icon badge, title, status pill), body, and footer actions.
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
        'group relative rounded-[20px] border border-white/5 p-5 backdrop-blur-xl',
        'bg-gradient-to-b from-blue-500/5 via-slate-900/40 to-slate-950/60',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.35)]',
        'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        'hover:-translate-y-0.5 hover:border-blue-500/20',
        'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_40px_rgba(0,0,0,0.45),0_0_24px_-6px_rgba(59,130,246,0.18)]',
        onClick && 'cursor-pointer',
        className
      )}
      {...rest}
    >
      {/* subtle left accent that activates on hover */}
      <span className="pointer-events-none absolute left-0 top-1/2 h-2/3 w-px -translate-y-1/2 rounded-full bg-blue-400 opacity-0 shadow-[0_0_8px_rgba(59,130,246,0.7)] transition-opacity duration-300 group-hover:opacity-100" />

      {(Icon || title || status) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div
                className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
                  border: '1px solid rgba(59,130,246,0.3)',
                }}
              >
                <Icon className="w-4 h-4 text-blue-400" />
              </div>
            )}
            {title && (
              <h3 className="font-bold text-white/90 text-[15px] tracking-tight truncate">{title}</h3>
            )}
          </div>
          {status && (
            <span className={cn('flex-shrink-0 rounded-full border px-3 py-0.5 text-xs font-medium', statusClass)}>
              {statusLabel || status}
            </span>
          )}
        </div>
      )}

      {children && <div className="text-white/60 text-sm space-y-1.5">{children}</div>}

      {footer && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          {footer}
        </div>
      )}
    </div>
  );
}