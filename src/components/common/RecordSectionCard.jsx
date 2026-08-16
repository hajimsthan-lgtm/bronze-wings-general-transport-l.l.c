import { useState } from 'react';
import { FileText, Eye, Plus } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function RecordSectionCard({ title, icon: Icon, accent = '#1ED760', count, onView, onPdf, onNew, newLabel, loading, emptyIcon, emptyLabel, className = '', children }) {
  const [viewOpen, setViewOpen] = useState(false);

  const handleView = () => {
    setViewOpen(true);
    onView?.();
  };

  return (
    <div
      className={`glass-card rounded-2xl p-4 animate-fade-in-up relative overflow-hidden flex flex-col items-center text-center gap-2 ${className}`}
      style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="absolute -top-12 -right-8 w-28 h-28 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${hexToRgba(accent, 0.18)} 0%, transparent 70%)` }} />
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 relative" style={{ background: hexToRgba(accent, 0.14), border: `1px solid ${hexToRgba(accent, 0.3)}` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div className="min-w-0 w-full">
        <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
        <p className="text-[11px] text-muted-foreground">{count != null ? `${count} record${count === 1 ? '' : 's'}` : '—'}</p>
      </div>
      <button onClick={handleView} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-foreground hover:bg-white/10 transition-colors w-full justify-center">
        <Eye className="w-3.5 h-3.5" /> Quick View
      </button>

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