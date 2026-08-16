import { useState } from 'react';
import { FileText, Eye, Plus, ChevronDown } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function RecordSectionCard({ title, icon: Icon, accent = '#1ED760', count, onView, onPdf, onNew, newLabel, loading, emptyIcon, emptyLabel, className = '', collapsible = true, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const [viewOpen, setViewOpen] = useState(false);
  const isOpen = !collapsible || open;

  const isHex = accent.startsWith('#');
  const tileBg = isHex ? hexToRgba(accent, 0.12) : 'rgba(255,255,255,0.05)';
  const tileBorder = isHex ? `1px solid ${hexToRgba(accent, 0.25)}` : '1px solid rgba(255,255,255,0.08)';
  const iconColor = isHex ? accent : 'hsl(var(--foreground))';

  const handleView = () => {
    setViewOpen(true);
    onView?.();
  };

  const actions = (
    <>
      {onNew && (
        <button onClick={onNew} title={newLabel || 'Add new'} className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-foreground hover:bg-white/10 transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
      <button onClick={onPdf} title="Download PDF" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold text-white transition-transform active:scale-95" style={{ background: accent, boxShadow: `0 4px 14px -4px ${accent}` }}>
        <FileText className="w-3 h-3" /> PDF
      </button>
      {onView && (
        <button onClick={handleView} title="View all" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-foreground hover:bg-white/10 transition-colors">
          <Eye className="w-3 h-3" /> View
        </button>
      )}
    </>
  );

  return (
    <div
      onClick={() => collapsible && setOpen(!open)}
      className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 animate-fade-in-up ${collapsible ? 'cursor-pointer' : ''} ${className}`}
      style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="flex items-center justify-between p-4 border-b border-border gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: tileBg, border: tileBorder }}>
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">{title}</h3>
            <p className="text-xs text-muted-foreground">{count != null ? `${count} record${count === 1 ? '' : 's'}` : '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {collapsible && (
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-[400ms] ${open ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>
      <div className="grid transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-end gap-1.5 mb-3" onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
            {loading ? <LoadingSpinner /> : count === 0 ? <EmptyState icon={emptyIcon || Icon} title={emptyLabel || 'No records'} /> : children}
          </div>
        </div>
      </div>

      {/* Quick View Popup */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center justify-between gap-2 pr-8">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(accent, 0.14), border: `1px solid ${hexToRgba(accent, 0.3)}` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
                </div>
                <span className="truncate">{title}</span>
                {count != null && <span className="text-xs font-normal text-muted-foreground flex-shrink-0">· {count} record{count === 1 ? '' : 's'}</span>}
              </div>
              <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {onNew && (
                  <button onClick={onNew} title={newLabel || 'Add new'} className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-foreground hover:bg-white/10 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={onPdf} title="Download PDF" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold text-white transition-transform active:scale-95" style={{ background: accent, boxShadow: `0 4px 14px -4px ${accent}` }}>
                  <FileText className="w-3 h-3" /> PDF
                </button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-border overflow-hidden p-4">
            {loading ? <LoadingSpinner /> : count === 0 ? <EmptyState icon={emptyIcon || Icon} title={emptyLabel || 'No records'} /> : children}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}