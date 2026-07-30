import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import CalculatorModal from '@/components/dashboard/CalculatorModal';
import { QUICK_APPS as APPS, QUICK_APPS_NAV as NAV } from '@/components/layout/quickApps.jsx';

const SHOW_MS = 4000;

export default function QuickFanMenu() {
  const [open, setOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const timer = useRef(null);
  const navigate = useNavigate();

  // hover reveals the fan; it auto-hides SHOW_MS after the last interaction
  const poke = () => {
    clearTimeout(timer.current);
    setOpen(true);
    timer.current = setTimeout(() => setOpen(false), SHOW_MS);
  };

  const handleAction = (a) => {
    clearTimeout(timer.current);
    setOpen(false);
    if (a.action === 'calc') setCalcOpen(true);
    else if (typeof a.action === 'function') a.action();
  };

  const handleNav = (item) => {
    clearTimeout(timer.current);
    setOpen(false);
    navigate(item.to);
  };

  return (
    <>
      <div
        className="relative flex justify-center"
        onMouseEnter={poke}
        onMouseLeave={poke}
      >
        {/* expanding light halo when open */}
        {open && (
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: 48,
              height: 48,
              background: 'radial-gradient(circle, rgba(244,63,94,0.5) 0%, rgba(244,63,94,0.14) 45%, transparent 70%)',
              animation: 'fan-halo 1.8s ease-out infinite',
            }}
          />
        )}

        {/* ══ Horizontal utility apps — spread to the right ══ */}
        {open && APPS.map((a, i) => {
          const GAP = 54;
          const x = 34 + i * GAP;
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => handleAction(a)}
              onMouseEnter={poke}
              title={a.label}
              className="absolute left-1/2 top-1/2 z-40"
              style={{ transform: `translate(calc(-50% + ${x}px), -50%)` }}
            >
              <span
                className="group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                  animation: `fan-pop 0.45s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s both`,
                  background: `linear-gradient(145deg, ${a.hex}, ${a.hex}cc)`,
                  border: `1px solid ${a.hex}99`,
                  boxShadow: `0 0 18px -4px ${a.hex}cc, inset 0 2px 3px rgba(255,255,255,0.45), inset 0 -3px 5px rgba(0,0,0,0.22), 0 6px 16px rgba(0,0,0,0.42)`,
                  color: '#fff',
                }}
              >
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                  <span
                    className="absolute top-0 h-full w-1/2 skew-x-[-20deg]"
                    style={{
                      left: '-120%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
                      animation: `fan-sheen 1.9s ease-in-out ${i * 0.1 + 0.25}s infinite`,
                    }}
                  />
                </span>
                <Icon className="relative w-5 h-5" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))' }} />
              </span>
            </button>
          );
        })}

        {/* ══ Vertical in-app modules — column rising upward ══ */}
        {open && NAV.map((a, i) => {
          const GAP = 50;
          const y = -(34 + i * GAP);
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => handleNav(a)}
              onMouseEnter={poke}
              title={a.label}
              className="absolute left-1/2 top-1/2 z-40"
              style={{ transform: `translate(-50%, calc(-50% + ${y}px))` }}
            >
              <span
                className="group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                  animation: `fan-pop 0.45s cubic-bezier(0.16,1,0.3,1) ${i * 0.05 + 0.1}s both`,
                  background: `linear-gradient(145deg, ${a.hex}, ${a.hex}cc)`,
                  border: `1px solid ${a.hex}99`,
                  boxShadow: `0 0 16px -4px ${a.hex}cc, inset 0 2px 3px rgba(255,255,255,0.4), inset 0 -3px 5px rgba(0,0,0,0.22), 0 6px 16px rgba(0,0,0,0.42)`,
                  color: '#fff',
                }}
              >
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                  <span
                    className="absolute top-0 h-full w-1/2 skew-x-[-20deg]"
                    style={{
                      left: '-120%',
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
                      animation: `fan-sheen 1.9s ease-in-out ${i * 0.08 + 0.2}s infinite`,
                    }}
                  />
                </span>
                <Icon className="relative w-[18px] h-[18px]" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.35))' }} />
              </span>
            </button>
          );
        })}

        {/* launcher — hover to reveal fan */}
        <button
          type="button"
          onClick={poke}
          title="Quick tools"
          className="group relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 z-50"
        >
          <span
            className="relative flex items-center justify-center w-[42px] h-[42px] rounded-[13px] transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
            style={{
              background: 'linear-gradient(150deg, #f43f5e 0%, #be123c 100%)',
              border: '1px solid rgba(244,63,94,0.55)',
              boxShadow: open
                ? 'inset 0 1.5px 1px rgba(255,255,255,0.5), 0 8px 24px rgba(244,63,94,0.6), 0 0 0 1px rgba(244,63,94,0.45), 0 0 34px -4px rgba(244,63,94,0.85)'
                : 'inset 0 1.5px 1px rgba(255,255,255,0.45), inset 0 -3px 5px rgba(0,0,0,0.3), 0 5px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
              color: '#fff',
              transform: open ? 'rotate(135deg)' : 'rotate(0deg)',
            }}
          >
            <span className="pointer-events-none absolute inset-x-[3px] top-[2px] h-1/2 rounded-t-[10px]" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.42), transparent)' }} />
            <Plus className="relative w-[18px] h-[18px]" style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.45))' }} />
          </span>
        </button>
      </div>

      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </>
  );
}