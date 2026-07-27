import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Truck, Receipt, FileBarChart, Calculator as CalcIcon, Settings as SettingsIcon } from 'lucide-react';
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
  { key: 'trip', label: 'New Trip', hex: '#0ea5e9', icon: Truck, to: '/trips' },
  { key: 'expense', label: 'Expense', hex: '#f97316', icon: Receipt, to: '/expenses' },
  { key: 'reports', label: 'Reports', hex: '#8b5cf6', icon: FileBarChart, to: '/reports/daily' },
];

/* ── Sound ── */
function readSound() {
  try {
    const en = localStorage.getItem('qa_sound_enabled');
    const vol = localStorage.getItem('qa_sound_volume');
    return { enabled: en === null ? true : en === '1', volume: vol === null ? 0.5 : Number(vol) };
  } catch { return { enabled: true, volume: 0.5 }; }
}

let audioCtx;
export function playBell() {
  const { enabled, volume } = readSound();
  if (!enabled || !volume) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    // Cool bell — three decaying sine partials
    [[4000, 1, 0.5], [6000, 0.35, 0.35]].forEach(([f, g, d]) => {
      const o = audioCtx.createOscillator();
      const gn = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      gn.gain.setValueAtTime(0, now);
      gn.gain.linearRampToValueAtTime(g * volume * 0.28, now + 0.004);
      gn.gain.exponentialRampToValueAtTime(0.0001, now + d);
      o.connect(gn); gn.connect(audioCtx.destination);
      o.start(now); o.stop(now + d + 0.05);
    });
  } catch {}
}

export default function EdgeQuickRail() {
  const [hovered, setHovered] = useState(null);
  const [calcOpen, setCalcOpen] = useState(false);

  const apps = [
    ...APPS,
    { key: 'calc', label: 'Calculator', hex: '#64748b', icon: CalcIcon, action: () => setCalcOpen(true) },
    { key: 'settings', label: 'Settings', hex: '#94a3b8', icon: SettingsIcon, to: '/settings' },
  ];

  const onEnter = (a) => { setHovered(a.key); playBell(); };
  const onLeave = () => setHovered(null);

  const renderItem = (a) => {
    const tile = (
      <span
        className="relative w-11 h-11 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95"
        style={{
          background: `linear-gradient(145deg, ${a.hex}, ${a.hex}cc)`,
          borderRadius: '0.85rem',
          border: `1px solid ${a.hex}99`,
          boxShadow: `inset 0 2px 3px rgba(255,255,255,0.45), inset 0 -3px 5px rgba(0,0,0,0.22), 0 6px 14px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.06)`,
          color: '#fff',
        }}
      >
        <a.icon className="w-5 h-5" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }} />
      </span>
    );
    const label = hovered === a.key && (
      <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white z-10 glass-sm border border-white/10 animate-slide-in-right">
        {a.label}
      </span>
    );
    const cls = "group relative flex items-center justify-center";
    return a.to ? (
      <Link key={a.key} to={a.to} className={cls} onMouseEnter={() => onEnter(a)} onMouseLeave={onLeave} title={a.label}>{tile}{label}</Link>
    ) : (
      <button key={a.key} type="button" onClick={() => a.action?.()} className={cls} onMouseEnter={() => onEnter(a)} onMouseLeave={onLeave} title={a.label}>{tile}{label}</button>
    );
  };

  return (
    <>
      <div className="fixed left-1.5 md:left-2 top-[70px] md:top-[92px] z-[55] flex flex-col gap-2.5">
        {apps.map(renderItem)}
      </div>
      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </>
  );
}