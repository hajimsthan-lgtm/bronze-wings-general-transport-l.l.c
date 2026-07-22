import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared premium surface for Settings sections.
 * Layered depth: subtle border + multi-stop gradient + backdrop blur.
 * Optional accent ("danger") shifts the icon halo to rose.
 */
export default function SettingsCard({
  icon: Icon,
  title,
  description,
  action,
  accent,
  children,
  className = '',
}) {
  const isDanger = accent === 'danger';
  const rgb = isDanger ? '244,63,94' : '59,130,246';

  return (
    <section
      className={cn('relative rounded-[20px] border border-white/[0.06] overflow-hidden', className)}
      style={{
        background: 'linear-gradient(180deg, rgba(18,22,34,0.72) 0%, rgba(12,16,26,0.90) 100%)',
        backdropFilter: 'blur(24px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 16px 44px -14px rgba(0,0,0,0.7)',
      }}
    >
      {/* top hairline */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb},0.30), transparent)` }}
      />

      {(Icon || title || action) && (
        <header className="flex items-center justify-between gap-3 p-5 md:p-6 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `radial-gradient(circle, rgba(${rgb},0.18) 0%, transparent 70%)`,
                  border: `1px solid rgba(${rgb},0.25)`,
                }}
              >
                <Icon className="w-5 h-5" style={{ color: `rgb(${rgb})` }} />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-display font-semibold text-white text-[15px] tracking-tight truncate">{title}</h2>
              {description && <p className="text-xs text-white/40 mt-0.5 truncate">{description}</p>}
            </div>
          </div>
          {action}
        </header>
      )}

      <div className="px-5 md:px-6 pb-5 md:pb-6">{children}</div>
    </section>
  );
}