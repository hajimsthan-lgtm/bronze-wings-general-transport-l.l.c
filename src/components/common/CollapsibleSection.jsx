import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';

export default function CollapsibleSection({ title, icon: Icon, accent = '#1ED760', count, actions, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const isHex = accent.startsWith('#');
  const tileBg = isHex ? `linear-gradient(135deg, ${hexToRgba(accent, 0.14)}, ${hexToRgba(accent, 0.08)})` : 'rgba(255,255,255,0.05)';
  const tileBorder = isHex ? `1px solid ${hexToRgba(accent, 0.25)}` : '1px solid rgba(255,255,255,0.08)';
  const iconColor = isHex ? accent : 'hsl(var(--foreground))';

  return (
    <div
      onClick={() => setOpen(!open)}
      className="glass-card rounded-2xl overflow-hidden transition-all duration-200 animate-fade-in-up cursor-pointer hover:-translate-y-px hover:shadow-lg"
      style={{ borderLeft: `4px solid ${accent}` }}>
      <div className="flex items-center justify-between p-5 border-b border-border gap-3 transition-colors duration-200 hover:bg-muted/30">
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
          {open && actions && <div className="flex items-center gap-1.5">{actions}</div>}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-[400ms] ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>
      <div className="grid transition-[grid-template-rows] duration-200 ease-out" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
        <div className="overflow-hidden">
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}