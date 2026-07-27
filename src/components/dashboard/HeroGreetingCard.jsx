import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Cloud, Phone, MapPin, Truck, Receipt, FileBarChart, Calculator as CalcIcon } from 'lucide-react';
import CalculatorModal from '@/components/dashboard/CalculatorModal';
import { formatCurrency } from '@/lib/formatters';

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

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return { text: 'Good Morning', Icon: Sun, tone: '#fbbf24' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', Icon: Sun, tone: '#f97316' };
  if (hour >= 17 && hour < 20) return { text: 'Good Evening', Icon: Cloud, tone: '#a78bfa' };
  return { text: 'Good Night', Icon: Moon, tone: '#60a5fa' };
}

const APPS = [
  { key: 'whatsapp', label: 'WhatsApp', bg: 'linear-gradient(135deg,#25D366,#128C7E)', glow: 'rgba(37,211,102,0.35)', icon: WhatsAppIcon, action: () => window.open('https://wa.me/', '_blank') },
  { key: 'gmail', label: 'Gmail', bg: 'linear-gradient(135deg,#EA4335,#C5221F)', glow: 'rgba(234,67,53,0.35)', icon: GmailIcon, action: () => { window.location.href = 'mailto:?subject=Transport%20Update'; } },
  { key: 'call', label: 'Call', bg: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.35)', icon: Phone, action: () => { window.location.href = 'tel:'; } },
  { key: 'maps', label: 'Maps', bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', glow: 'rgba(59,130,246,0.35)', icon: MapPin, action: () => window.open('https://maps.google.com', '_blank') },
  { key: 'trip', label: 'New Trip', bg: 'linear-gradient(135deg,#0ea5e9,#0369a1)', glow: 'rgba(14,165,233,0.35)', icon: Truck, to: '/trips' },
  { key: 'expense', label: 'Expense', bg: 'linear-gradient(135deg,#f97316,#ea580c)', glow: 'rgba(249,115,22,0.35)', icon: Receipt, to: '/expenses' },
  { key: 'reports', label: 'Reports', bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', glow: 'rgba(139,92,246,0.35)', icon: FileBarChart, to: '/reports/daily' },
];

export default function HeroGreetingCard({ activeTrips = 0, totalRevenue = 0, pendingInvoices = 0 }) {
  const [now, setNow] = useState(new Date());
  const [userName, setUserName] = useState('');
  const [calcOpen, setCalcOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    import('@/api/base44Client').then(({ base44 }) =>
      base44.auth.me().then(u => setUserName(u?.full_name || '')).catch(() => {})
    );
  }, []);

  const hour = now.getHours();
  const { text: greet, Icon: GreetIcon, tone } = getGreeting(hour);
  const dateStr = now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  const firstName = userName ? userName.split(' ')[0] : '';

  const apps = [
    ...APPS,
    { key: 'calc', label: 'Calculator', bg: 'linear-gradient(135deg,#374151,#111827)', glow: 'rgba(55,65,81,0.4)', icon: CalcIcon, action: () => setCalcOpen(true) },
  ];

  const greetingNode = (
    <h1 className="text-2xl sm:text-4xl font-heading text-white mt-2.5 leading-tight">
      <span>{greet}</span>
      {firstName ? <span>, <span className="text-gradient">{firstName}</span></span> : null}
      <span className="inline-block ml-1 animate-float">👋</span>
    </h1>
  );

  return (
    <>
      <div className="glass-card relative overflow-hidden p-6 sm:p-8 animate-fade-in-up">
        {/* ambient glows */}
        <div className="pointer-events-none absolute -top-24 -right-10 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(var(--panel-accent-rgb),0.20), transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-28 -left-10 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(var(--panel-accent2-rgb),0.16), transparent 70%)' }} />
        <div className="pointer-events-none absolute inset-0 dot-grid-overlay opacity-30" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Greeting */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${tone}22`, border: `1px solid ${tone}55` }}>
                <GreetIcon className="w-4 h-4" style={{ color: tone }} />
              </span>
              <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#a0a5b8]">{dateStr}</span>
            </div>
            {greetingNode}
            <p className="text-[13px] sm:text-sm text-[#a0a5b8] mt-2">
              Here's your business snapshot — <span className="text-white font-semibold tabular-nums">{activeTrips}</span> active trips · <span className="text-white font-semibold tabular-nums">{formatCurrency(totalRevenue)}</span> revenue · <span className="text-amber-400 font-semibold tabular-nums">{pendingInvoices}</span> pending invoices
            </p>
          </div>

          {/* Live clock */}
          <div className="flex items-center gap-4 self-start lg:self-auto">
            <div className="text-right">
              <div className="text-3xl sm:text-4xl font-mono font-medium tabular-nums text-white leading-none">{timeStr}</div>
              <div className="text-[11px] uppercase tracking-wider text-[#6b7280] mt-1.5">Local Time</div>
            </div>
            <div className="w-px h-12 bg-white/10 hidden sm:block" />
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="live-dot" />
                <span className="text-[11px] uppercase tracking-wider text-[#10b981] font-semibold">Live</span>
              </div>
              <div className="text-[11px] text-[#6b7280] mt-1.5">Synced just now</div>
            </div>
          </div>
        </div>

        {/* App shortcuts */}
        <div className="relative mt-6 pt-5 border-t border-white/[0.06]">
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow">Quick Apps</p>
            <span className="text-[10px] text-[#6b7280]">{apps.length} shortcuts</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 sm:gap-3">
            {apps.map((a) => {
              const inner = (
                <>
                  <span
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
                    style={{ background: a.bg, boxShadow: `0 6px 16px ${a.glow}, inset 0 1px 0 rgba(255,255,255,0.15)` }}
                  >
                    <a.icon className="w-5 h-5" />
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[#a0a5b8] group-hover:text-white transition-colors truncate">{a.label}</span>
                </>
              );
              const cls = "group flex flex-col items-center gap-2 min-w-0";
              return a.to ? (
                <Link key={a.key} to={a.to} className={cls}>{inner}</Link>
              ) : (
                <button key={a.key} type="button" onClick={a.action} className={cls}>{inner}</button>
              );
            })}
          </div>
        </div>
      </div>

      <CalculatorModal open={calcOpen} onClose={() => setCalcOpen(false)} />
    </>
  );
}