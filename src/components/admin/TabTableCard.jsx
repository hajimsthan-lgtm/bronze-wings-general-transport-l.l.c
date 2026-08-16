import { useState } from 'react';
import { Inbox, ChevronDown } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';

/**
 * Reusable card wrapping a 12-col grid table.
 * Collapsible cards default to collapsed, expand on header click.
 * Compact header matches RecordSectionCard style.
 */
export default function TabTableCard({
  title,
  subtitle,
  actions,
  icon: Icon = Inbox,
  accent = 'hsl(var(--destructive))',
  columns,
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = 'No records found for selected period',
  emptyHint = 'Try adjusting the date filter above',
  loading,
  headerExtra,
  collapsible = false,
  defaultOpen = false,
  children
}) {
  const [open, setOpen] = useState(defaultOpen);
  const rows = Array.isArray(children) ? children : children ? [children] : [];
  const hasRows = rows.length > 0;
  const panelId = `ttc-${(title || 'card').replace(/\s/g, '-').toLowerCase()}`;
  const isOpen = !collapsible || open;

  const handleToggle = () => setOpen(!open);
  const isHex = accent.startsWith('#');
  const tileBg = isHex ? hexToRgba(accent, 0.12) : 'rgba(255,255,255,0.05)';
  const tileBorder = isHex ? `1px solid ${hexToRgba(accent, 0.25)}` : '1px solid rgba(255,255,255,0.08)';
  const iconColor = isHex ? accent : 'hsl(var(--foreground))';

  return (
    <div
      onClick={() => collapsible && handleToggle()}
      className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 animate-fade-in-up ${collapsible ? 'cursor-pointer' : ''}`}
      style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="flex items-center justify-between p-4 border-b border-border gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tileBg, border: tileBorder }}>
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">{title}</h3>
            {subtitle ? <p className="text-xs text-muted-foreground truncate">{subtitle}</p> : <p className="text-xs text-muted-foreground">{hasRows ? `${rows.length} record${rows.length === 1 ? '' : 's'}` : '0 records'}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {isOpen && actions && <div className="flex items-center gap-1.5">{actions}</div>}
          {collapsible && (
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-[400ms] ${open ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>
      <div
        id={panelId}
        role="region"
        aria-label={title}
        className="overflow-hidden transition-[max-height,opacity] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ maxHeight: isOpen ? '5000px' : '0', opacity: isOpen ? 1 : 0 }}>
        <div className="p-4">
          {headerExtra}
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-muted/30 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              {columns.map((c, i) =>
                <div key={i} className={c.className}>{c.label}</div>
              )}
            </div>
            {loading ?
              <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div> :
              hasRows ?
                <div className="divide-y divide-border">{children}</div> :
                <div className="py-10 text-center">
                  {EmptyIcon && <EmptyIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />}
                  <p className="text-sm text-muted-foreground">{emptyTitle}</p>
                  {emptyHint && <p className="text-xs text-muted-foreground/70 mt-1">{emptyHint}</p>}
                </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}