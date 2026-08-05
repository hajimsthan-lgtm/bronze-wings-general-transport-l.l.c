import { useState } from 'react';
import { FileText, Eye, Plus, ChevronDown } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

export default function RecordSectionCard({ title, icon: Icon, accent = '#3b82f6', count, onView, onPdf, onNew, newLabel, loading, emptyIcon, emptyLabel, className = '', collapsible = false, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = !collapsible || open;

  return (
    <div className={`glass-card rounded-2xl p-5 animate-fade-in-up relative overflow-hidden flex flex-col h-full ${className}`} style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="absolute -top-16 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${hexToRgba(accent, 0.18)} 0%, transparent 70%)` }} />
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-2">
          {collapsible && (
            <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Toggle ${title}`} className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-[400ms] ${open ? '' : '-rotate-90'}`} />
            </button>
          )}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(accent, 0.14), border: `1px solid ${hexToRgba(accent, 0.3)}` }}>
            <Icon className="w-4 h-4" style={{ color: accent }} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{count != null ? `${count} record${count === 1 ? '' : 's'}` : '—'}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {onNew && (
            <button onClick={onNew} title={newLabel || 'Add new'} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-foreground hover:bg-white/10 transition-colors">
              <Plus className="w-3 h-3" /> {newLabel || 'New'}
            </button>
          )}
          <button onClick={onPdf} title="Download PDF" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold text-white transition-transform active:scale-95" style={{ background: accent, boxShadow: `0 4px 14px -4px ${accent}` }}>
            <FileText className="w-3 h-3" /> PDF
          </button>
          <button onClick={onView} title="View all" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-foreground hover:bg-white/10 transition-colors">
            <Eye className="w-3 h-3" /> View
          </button>
        </div>
      </div>
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] relative"
        style={{ maxHeight: isOpen ? '5000px' : '0', opacity: isOpen ? 1 : 0 }}
      >
        <div className="rounded-xl border border-border overflow-hidden p-4">
          {loading ? <LoadingSpinner /> : count === 0 ? <EmptyState icon={emptyIcon || Icon} title={emptyLabel || 'No records'} /> : children}
        </div>
      </div>
    </div>
  );
}