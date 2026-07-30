import { useState } from 'react';
import { QUICK_APPS } from '@/components/layout/quickApps.jsx';
import CalculatorModal from '@/components/dashboard/CalculatorModal';

/* Top header — four core comms tools as premium frosted-glass tiles
   with glowing icon chips and flashing sheen-text labels. */
const TOP_KEYS = ['whatsapp', 'gmail', 'call', 'message'];

export default function TopQuickIcons() {
  const [calcOpen, setCalcOpen] = useState(false);
  const apps = QUICK_APPS.filter((a) => TOP_KEYS.includes(a.key));

  const handleAction = (a) => {
    if (a.action === 'calc') setCalcOpen(true);
    else if (typeof a.action === 'function') a.action();
  };

  return (
    <>
      <div className="hidden xl:flex items-center gap-2">
        {apps.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => handleAction(a)}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
                e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
              }}
              title={a.label}
              aria-label={a.label}
              className="group relative flex items-center gap-2 h-10 pl-2 pr-3 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)',
                backdropFilter: 'blur(16px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
                border: '1px solid rgba(255,255,255,0.16)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.30), 0 6px 18px rgba(0,0,0,0.38)',
              }}
            >
              {/* cursor-follow glow */}
              <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(circle 50px at var(--mx,50%) var(--my,50%), ${a.hex}44, transparent 70%)` }} />
              {/* accent edge glow on hover */}
              <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: `inset 0 0 0 1px ${a.hex}66, 0 0 22px -6px ${a.hex}aa` }} />
              {/* top specular highlight */}
              <span className="pointer-events-none absolute inset-x-1 top-0 h-1/2 rounded-t-2xl" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.20), transparent)' }} />
              {/* icon chip */}
              <span className="relative flex items-center justify-center w-7 h-7 rounded-xl" style={{ background: `linear-gradient(145deg, ${a.hex}33, ${a.hex}14)`, border: `1px solid ${a.hex}55`, boxShadow: `inset 0 1px 0 ${a.hex}66, 0 0 12px -4px ${a.hex}99` }}>
                <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" style={{ color: a.hex, filter: `drop-shadow(0 0 5px ${a.hex}cc)` }} />
              </span>
              {/* flashing sheen text label */}
              <span
                className="brand-shine relative text-[11px] font-bold tracking-wide whitespace-nowrap"
                style={{ backgroundImage: `linear-gradient(90deg, #ffffff 0%, ${a.hex} 50%, #ffffff 100%)` }}
              >
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