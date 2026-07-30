import { useState } from 'react';
import { QUICK_APPS } from '@/components/layout/quickApps.jsx';
import CalculatorModal from '@/components/dashboard/CalculatorModal';

/* Top header — four core comms tools as frosted-glass pills with
   flashing sheen-text labels. */
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
      <div className="hidden xl:flex items-center gap-1.5">
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
              className="group relative flex items-center gap-1.5 h-9 pl-2 pr-3 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.07) 100%)',
                backdropFilter: 'blur(14px) saturate(1.5)',
                WebkitBackdropFilter: 'blur(14px) saturate(1.5)',
                border: '1px solid rgba(255,255,255,0.14)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.28), 0 5px 16px rgba(0,0,0,0.35)',
              }}
            >
              {/* cursor-follow glow */}
              <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(circle 42px at var(--mx,50%) var(--my,50%), ${a.hex}55, transparent 70%)` }} />
              {/* top specular highlight */}
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.16), transparent)' }} />
              {/* icon in a frosted chip */}
              <span className="relative flex items-center justify-center w-6 h-6 rounded-lg" style={{ background: `${a.hex}1f`, border: `1px solid ${a.hex}44` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: a.hex, filter: `drop-shadow(0 0 4px ${a.hex}aa)` }} />
              </span>
              {/* flashing sheen text label */}
              <span
                className="brand-shine relative text-[11px] font-semibold tracking-wide whitespace-nowrap"
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