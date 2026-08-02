import { useState } from 'react';
import { Inbox, ChevronDown } from 'lucide-react';

/**
 * Reusable card wrapping a 12-col grid table.
 * Collapsible cards default to collapsed and expand on hover.
 */
export default function TabTableCard({
  title,
  subtitle,
  actions,
  columns,
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = 'No records found for selected period',
  emptyHint = 'Try adjusting the date filter above',
  loading,
  headerExtra,
  collapsible = false,
  defaultOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rows = Array.isArray(children) ? children : children ? [children] : [];
  const hasRows = rows.length > 0;

  return (
    <div
      className="glass-card rounded-2xl p-5 transition-all duration-300"
      onMouseEnter={collapsible ? () => setOpen(true) : undefined}
      onMouseLeave={collapsible ? () => setOpen(false) : undefined}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          {collapsible && (
            <button onClick={() => setOpen((o) => !o)} className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0" aria-label="Toggle table">
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
            </button>
          )}
          <div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {(!collapsible || open) && (
        <>
          {headerExtra}

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-muted/30 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              {columns.map((c, i) => (
                <div key={i} className={c.className}>{c.label}</div>
              ))}
            </div>
            {loading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
            ) : hasRows ? (
              <div className="divide-y divide-border">{children}</div>
            ) : (
              <div className="py-10 text-center">
                {EmptyIcon && <EmptyIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />}
                <p className="text-sm text-muted-foreground">{emptyTitle}</p>
                {emptyHint && <p className="text-xs text-muted-foreground/70 mt-1">{emptyHint}</p>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}