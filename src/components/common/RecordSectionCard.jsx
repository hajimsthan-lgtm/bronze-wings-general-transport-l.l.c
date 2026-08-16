import { useState } from 'react';
import { FileText, Eye, Plus, ChevronDown } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function RecordSectionCard({ title, icon: Icon, accent = '#1ED760', count, onView, onPdf, onNew, newLabel, loading, emptyIcon, emptyLabel, columns, className = '', collapsible = true, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const [viewOpen, setViewOpen] = useState(false);
  const isOpen = !collapsible || open;
  const hasColumns = Array.isArray(columns) && columns.length > 0;

  const handleView = () => {
    setViewOpen(true);
    onView?.();
  };

  const isHex = accent.startsWith('#');
  const tileBg = isHex ? `linear-gradient(135deg, ${hexToRgba(accent, 0.14)}, ${hexToRgba(accent, 0.08)})` : 'rgba(255,255,255,0.05)';
  const tileBorder = isHex ? `1px solid ${hexToRgba(accent, 0.25)}` : '1px solid rgba(255,255,255,0.08)';
  const iconColor = isHex ? accent : 'hsl(var(--foreground))';

  const iconBtn = 'inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors';

  const actions = (
    <>
      {onNew && (
        <button onClick={onNew} title={newLabel || 'Add new'} className={iconBtn}>
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
      {onPdf && (
        <button onClick={onPdf} title="Download PDF" className={iconBtn}>
          <FileText className="w-3.5 h-3.5" />
        </button>
      )}
      {onView && (
        <button onClick={handleView} title="Quick view" className={iconBtn}>
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}
    </>
  );

  const tableContent = loading
    ? <LoadingSpinner />
    : count === 0
      ? <EmptyState icon={emptyIcon || Icon} title={emptyLabel || 'No records'} />
      : hasColumns
        ? (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-muted/30 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              {columns.map((c, i) => <div key={i} className={c.className}>{c.label}</div>)}
            </div>
            <div className="divide-y divide-border">{children}</div>
          </div>
        )
        : children;

  return (
    <div
      onClick={() => collapsible && setOpen(!open)}
      className={`glass-card rounded-2xl overflow-hidden transition-all duration-200 animate-fade-in-up ${collapsible ? 'cursor-pointer hover:-translate-y-px hover:shadow-lg' : ''} ${className}`}
      style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="flex items-center justify-between p-4 border-b border-border gap-3 transition-colors duration-200 hover:bg-muted/30">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tileBg, border: tileBorder }}>
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
            <p className="text-xs text-muted-foreground">{count != null ? `${count} record${count === 1 ? '' : 's'}` : '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {actions}
          {collapsible && (
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-[400ms] ${open ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>
      <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <div className="p-4">{tableContent}</div>
        </div>
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center justify-between gap-2 pr-8">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(accent, 0.10), border: `1px solid ${hexToRgba(accent, 0.25)}` }}>
                  <Icon className="w-4 h-4" style={{ color: accent }} />
                </div>
                <span className="truncate">{title}</span>
                {count != null && <span className="text-xs font-normal text-muted-foreground flex-shrink-0">· {count} record{count === 1 ? '' : 's'}</span>}
              </div>
              <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {onNew && (
                  <button onClick={onNew} title={newLabel || 'Add new'} className={iconBtn}>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                {onPdf && (
                  <button onClick={onPdf} title="Download PDF" className={iconBtn}>
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-border overflow-hidden p-4">{tableContent}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}