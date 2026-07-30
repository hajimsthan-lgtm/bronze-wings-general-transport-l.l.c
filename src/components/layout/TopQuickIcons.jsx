import { useState } from 'react';
import { QUICK_APPS } from '@/components/layout/quickApps.jsx';
import CalculatorModal from '@/components/dashboard/CalculatorModal';

/* Top header — all quick app icons auto-reveal with an equal staggered
   duration on mount. Calm claymorphic tiles with brand-colored icons. */
export default function TopQuickIcons() {
  const [calcOpen, setCalcOpen] = useState(false);
  const apps = QUICK_APPS;

  const handleAction = (a) => {
    if (a.action === 'calc') setCalcOpen(true);
    else if (typeof a.action === 'function') a.action();
  };

  return (
    <>
      <div className="hidden xl:flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[52vw]">
        {apps.map((a, i) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => handleAction(a)}
              title={a.label}
              aria-label={a.label}
              className="group relative flex items-center gap-2 h-10 pl-2.5 pr-3 rounded-xl flex-shrink-0 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--background-elevated)))',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '-3px -3px 7px rgba(255,255,255,0.04), 4px 4px 10px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.05)',
                animation: `fan-pop 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s both`,
              }}
            >
              <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: `inset 0 0 0 1px ${a.hex}40` }} />
              <span className="relative flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: `${a.hex}1a`, border: `1px solid ${a.hex}33` }}>
                <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" style={{ color: a.hex }} />
              </span>
              <span className="relative text-[12px] font-semibold tracking-wide text-white/75 whitespace-nowrap group-hover:text-white transition-colors">
                {a.label}
              </span>
            </button>
          );
        })}
      </div>

      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </>
  );
}