import { useState } from 'react';
import { QUICK_APPS } from '@/components/layout/quickApps.jsx';
import CalculatorModal from '@/components/dashboard/CalculatorModal';

/* Compact icon row for the top header — same 5 apps and features as QuickFanMenu,
   rendered inline instead of as a radial fan. */
export default function TopQuickIcons() {
  const [calcOpen, setCalcOpen] = useState(false);

  const handleAction = (a) => {
    if (a.action === 'calc') setCalcOpen(true);
    else a.action();
  };

  return (
    <>
      <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
        {QUICK_APPS.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => handleAction(a)}
              title={a.label}
              aria-label={a.label}
              className="group relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
              style={{
                background: `linear-gradient(145deg, ${a.hex}33, ${a.hex}1a)`,
                border: `1px solid ${a.hex}55`,
                color: a.hex,
              }}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: `0 0 12px -2px ${a.hex}aa, inset 0 0 8px -2px ${a.hex}66` }}
              />
              <Icon className="relative w-4 h-4" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }} />
            </button>
          );
        })}
      </div>

      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </>
  );
}