import { useState } from 'react';
import { QUICK_APPS } from '@/components/layout/quickApps.jsx';
import CalculatorModal from '@/components/dashboard/CalculatorModal';

/* Top header keeps only the four core communication tools:
   WhatsApp, Mail, Call, Message. */
const TOP_KEYS = ['whatsapp', 'gmail', 'call', 'message'];

export default function TopQuickIcons() {
  const [calcOpen, setCalcOpen] = useState(false);
  const apps = QUICK_APPS.filter((a) => TOP_KEYS.includes(a.key));

  const handleAction = (a) => {
    if (a.action === 'calc') setCalcOpen(true);
    else a.action();
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
              className="group relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(160deg, ${a.hex}33 0%, ${a.hex}12 55%, rgba(0,0,0,0.30) 100%)`,
                border: `1px solid ${a.hex}44`,
                boxShadow: `inset 0 1px 0 ${a.hex}66, inset 0 -2px 4px rgba(0,0,0,0.4), 0 4px 10px rgba(0,0,0,0.35), 0 0 0 1px ${a.hex}1a`,
              }}
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl opacity-70" style={{ background: `linear-gradient(180deg, ${a.hex}40, transparent)` }} />
              <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(circle 50px at var(--mx,50%) var(--my,50%), ${a.hex}66, transparent 70%)` }} />
              <Icon className="relative w-4 h-4 transition-transform duration-200 group-hover:scale-110" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))' }} />
            </button>
          );
        })}
      </div>

      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </>
  );
}