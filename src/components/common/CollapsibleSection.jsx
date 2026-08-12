import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';

export default function CollapsibleSection({ title, icon: Icon, accent = '#1ED760', count, actions, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-card rounded-2xl p-5 animate-fade-in-up relative overflow-hidden" style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="absolute -top-16 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${hexToRgba(accent, 0.18)} 0%, transparent 70%)` }} />
      <div className="flex items-center justify-between gap-3 relative">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-[400ms] flex-shrink-0 ${open ? '' : '-rotate-90'}`} />
          {Icon && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(accent, 0.14), border: `1px solid ${hexToRgba(accent, 0.3)}` }}>
              <Icon className="w-4 h-4" style={{ color: accent }} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">{title}</h3>
            {count != null && <p className="text-xs text-muted-foreground">{count} record{count === 1 ? '' : 's'}</p>}
          </div>
        </button>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
      <div className="grid transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <div className="pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}