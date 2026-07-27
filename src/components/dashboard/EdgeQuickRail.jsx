import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MapPin, Truck, Receipt, FileBarChart, Calculator as CalcIcon, ChevronLeft } from 'lucide-react';
import CalculatorModal from '@/components/dashboard/CalculatorModal';

/* Real brand glyphs (inline SVG, brand colors) */
const WhatsAppIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);
const GmailIcon = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path fill="#EAEAEA" d="M22 6.2v11.6c0 .82-.66 1.48-1.48 1.48H17V9.36L12 13.1 7 9.36v9.92H3.48C2.66 19.28 2 18.62 2 17.8V6.2c0-1.83 2.08-2.95 3.58-1.94l1.1.74L12 8.9l5.32-3.9 1.1-.74C19.92 3.25 22 4.37 22 6.2z" />
    <path fill="#34A853" d="M7 9.36L17 19.28h3.52c.82 0 1.48-.66 1.48-1.48V6.2L7 9.36z" opacity="0.85" />
    <path fill="#EA4335" d="M22 6.2L7 9.36v0L2 6.2c0-1.83 2.08-2.95 3.58-1.94l1.1.74L12 8.9l5.32-3.9 1.1-.74C19.92 3.25 22 4.37 22 6.2z" opacity="0.9" />
    <path fill="#FBBC04" d="M2 6.2L7 9.36v9.92H3.48C2.66 19.28 2 18.62 2 17.8V6.2z" opacity="0.9" />
  </svg>
);

const APPS = [
  { key: 'whatsapp', label: 'WhatsApp', bg: 'linear-gradient(135deg,#25D366,#128C7E)', glow: 'rgba(37,211,102,0.35)', icon: WhatsAppIcon, action: () => window.open('https://wa.me/', '_blank') },
  { key: 'gmail', label: 'Gmail', bg: 'linear-gradient(135deg,#EA4335,#C5221F)', glow: 'rgba(234,67,53,0.35)', icon: GmailIcon, action: () => { window.location.href = 'mailto:?subject=Transport%20Update'; } },
  { key: 'call', label: 'Call', bg: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.35)', icon: Phone, action: () => { window.location.href = 'tel:'; } },
  { key: 'maps', label: 'Maps', bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', glow: 'rgba(59,130,246,0.35)', icon: MapPin, action: () => window.open('https://maps.google.com', '_blank') },
  { key: 'trip', label: 'New Trip', bg: 'linear-gradient(135deg,#0ea5e9,#0369a1)', glow: 'rgba(14,165,233,0.35)', icon: Truck, to: '/trips' },
  { key: 'expense', label: 'Expense', bg: 'linear-gradient(135deg,#f97316,#ea580c)', glow: 'rgba(249,115,22,0.35)', icon: Receipt, to: '/expenses' },
  { key: 'reports', label: 'Reports', bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', glow: 'rgba(139,92,246,0.35)', icon: FileBarChart, to: '/reports/daily' },
];

export default function EdgeQuickRail() {
  const [open, setOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const closeTimer = useRef(null);

  const cancelClose = () => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; } };
  const handleEnter = () => { cancelClose(); setOpen(true); };
  const handleLeave = () => { cancelClose(); closeTimer.current = setTimeout(() => setOpen(false), 3000); };

  useEffect(() => () => cancelClose(), []);

  const apps = [
    ...APPS,
    { key: 'calc', label: 'Calculator', bg: 'linear-gradient(135deg,#374151,#111827)', glow: 'rgba(55,65,81,0.4)', icon: CalcIcon, action: () => setCalcOpen(true) },
  ];

  const renderRow = (a) => {
    const cls = "group relative flex items-center justify-center w-12 h-12 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-110";
    const iconSpan = (
      <span
        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110"
        style={{ background: a.bg, boxShadow: `0 6px 16px ${a.glow}, inset 0 1px 0 rgba(255,255,255,0.15)` }}
      >
        <a.icon className="w-5 h-5" />
      </span>
    );
    return a.to ? (
      <Link key={a.key} to={a.to} className={cls} onClick={() => setOpen(false)} title={a.label}>{iconSpan}</Link>
    ) : (
      <button key={a.key} type="button" onClick={() => { a.action?.(); }} className={cls} title={a.label}>{iconSpan}</button>
    );
  };

  return (
    <>
      {/* Invisible left-edge hover trigger — opens the rail on cursor reach */}
      <div
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={handleEnter}
        className="fixed left-0 top-14 md:top-20 bottom-0 w-3 z-[55] cursor-pointer"
        aria-hidden
      />

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
            className="fixed left-0 top-14 md:top-20 bottom-0 w-16 z-[65] glass-panel rounded-none rounded-r-2xl p-2 flex flex-col items-center gap-2 overflow-y-auto no-scrollbar"
            style={{ borderLeft: 'none' }}
          >
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors mb-1"
              aria-label="Close"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {apps.map(renderRow)}
          </motion.aside>
        )}
      </AnimatePresence>

      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </>
  );
}