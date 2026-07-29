import { useState, useRef } from 'react';
import { Phone, MapPin, Calculator as CalcIcon, Plus } from 'lucide-react';
import CalculatorModal from '@/components/dashboard/CalculatorModal';

/* Real brand glyphs (inline SVG, brand colors) */
const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
const GmailIcon = (props) => (
  <svg viewBox="0 0 48 48" {...props}>
    <path fill="#4caf50" d="M45 16v20c0 1.7-1.3 3-3 3h-5V21.5L24 30 11 21.5V39H6c-1.7 0-3-1.3-3-3V16c0-3.5 4-5.5 7-3.5l14 10.5L38 12.5c3-2 7 .5 7 3.5z" />
    <path fill="#fbc02d" d="M11 21.5V39H6c-1.7 0-3-1.3-3-3V16c0-3.5 4-5.5 7-3.5l1 .75z" />
    <path fill="#4285f4" d="M37 21.5V39h5c1.7 0 3-1.3 3-3V16c0-3.5-4-5.5-7-3.5l-1 .75z" />
    <path fill="#ea4335" d="M11 39V21.5L24 30l13-8.5V39H11z" />
  </svg>
);

const APPS = [
  { key: 'whatsapp', label: 'WhatsApp', hex: '#25D366', icon: WhatsAppIcon, action: () => window.open('https://wa.me/', '_blank') },
  { key: 'gmail', label: 'Gmail', hex: '#EA4335', icon: GmailIcon, action: () => { window.location.href = 'mailto:?subject=Transport%20Update'; } },
  { key: 'call', label: 'Call', hex: '#10b981', icon: Phone, action: () => { window.location.href = 'tel:'; } },
  { key: 'maps', label: 'Maps', hex: '#3b82f6', icon: MapPin, action: () => window.open('https://maps.google.com', '_blank') },
  { key: 'calc', label: 'Calculator', hex: '#64748b', icon: CalcIcon, action: 'calc' },
];

const RADIUS = 84;
const SHOW_MS = 4000;

export default function QuickFanMenu() {
  const [open, setOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const timer = useRef(null);

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
    else a.action();
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

        {/* faint dotted semicircle guide */}
        {open && (
          <svg
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            width={(RADIUS + 30) * 2}
            height={(RADIUS + 30) * 2}
            style={{ overflow: 'visible' }}
          >
            <path
              d={`M ${RADIUS + 30} 30 A ${RADIUS + 30} ${RADIUS + 30} 0 0 1 ${RADIUS + 30} ${2 * (RADIUS + 30) - 30}`}
              fill="none"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="1"
              strokeDasharray="2 5"
            />
          </svg>
        )}

        {/* rotating conic light ring */}
        {open && (
          <span
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{
              width: (RADIUS + 22) * 2,
              height: (RADIUS + 22) * 2,
              borderRadius: '9999px',
              background:
                'conic-gradient(from 0deg, transparent 0deg, rgba(244,63,94,0.55) 40deg, transparent 95deg, transparent 180deg, rgba(244,63,94,0.45) 220deg, transparent 275deg)',
              WebkitMask: 'radial-gradient(circle, transparent 47%, #000 48%, #000 49.5%, transparent 50.5%)',
              mask: 'radial-gradient(circle, transparent 47%, #000 48%, #000 49.5%, transparent 50.5%)',
              animation: 'fan-ring-spin 3s linear infinite',
            }}
          />
        )}

        {/* fan icons — right-facing semicircle */}
        {open && APPS.map((a, i) => {
          const angle = (-90 + (180 / (APPS.length - 1)) * i) * (Math.PI / 180);
          const x = RADIUS * Math.cos(angle);
          const y = RADIUS * Math.sin(angle);
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => handleAction(a)}
              onMouseEnter={poke}
              title={a.label}
              className="absolute left-1/2 top-1/2 z-40"
              style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
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
                {/* sheen sweep */}
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