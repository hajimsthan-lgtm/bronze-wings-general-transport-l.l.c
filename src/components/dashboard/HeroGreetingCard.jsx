import { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, Sparkles, Activity, Wallet, FileWarning, TrendingUp, Truck, CalendarDays } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import { formatDate } from '@/lib/formatters';

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return { text: 'Good Morning', Icon: Sun, tone: '#fbbf24', gradient: 'rgba(251,191,36,0.10)' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', Icon: Sun, tone: '#f97316', gradient: 'rgba(249,115,22,0.10)' };
  if (hour >= 17 && hour < 20) return { text: 'Good Evening', Icon: Cloud, tone: '#a78bfa', gradient: 'rgba(167,139,250,0.10)' };
  return { text: 'Good Night', Icon: Moon, tone: '#60a5fa', gradient: 'rgba(96,165,250,0.10)' };
}

export default function HeroGreetingCard({ activeTrips = 0, totalRevenue = 0, pendingInvoices = 0 }) {
  const [now, setNow] = useState(new Date());
  const [userName, setUserName] = useState('');
  const { dateFrom, dateTo } = useGlobalDate();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    import('@/api/base44Client').then(({ base44 }) =>
      base44.auth.me().then(u => setUserName(u?.full_name || '')).catch(() => {})
    );
  }, []);

  const hour = now.getHours();
  const { text: greet, Icon: GreetIcon, tone, gradient } = getGreeting(hour);
  const dateStr = now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true });

  const stats = [
    { label: 'Active Trips', value: activeTrips, hex: '#34d399', Icon: Activity, sub: 'in progress' },
    { label: 'Revenue', value: formatCurrency(totalRevenue), hex: '#60a5fa', Icon: Wallet, sub: 'period total' },
    { label: 'Pending Invoices', value: pendingInvoices, hex: '#fbbf24', Icon: FileWarning, sub: 'awaiting' },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl animate-fade-in-up"
      style={{
        background: 'var(--panel-bg)',
        border: '1px solid var(--panel-border-color)',
        boxShadow: 'var(--panel-inner-highlight), 0 24px 70px rgba(0,0,0,0.45)',
        backdropFilter: 'var(--panel-blur)',
        WebkitBackdropFilter: 'var(--panel-blur)',
      }}>
      {/* top accent strip */}
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${tone}, rgb(var(--panel-accent-rgb)), ${tone}, transparent)` }} />
      {/* ambient mesh */}
      <div className="pointer-events-none absolute -top-20 right-10 w-64 h-64 rounded-full opacity-60" style={{ background: `radial-gradient(circle, ${gradient}, transparent 70%)` }} />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 w-48 h-48 rounded-full opacity-40" style={{ background: `radial-gradient(circle, rgba(var(--panel-accent-rgb),0.08), transparent 70%)` }} />
      <div className="pointer-events-none absolute inset-0 dot-grid-overlay opacity-10" />

      <div className="relative p-5 sm:p-7">
        {/* Row 1 — greeting + live badge */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div className="flex items-center gap-4 min-w-0">
            <span className="flex items-center justify-center w-14 h-14 rounded-2xl flex-shrink-0 transition-transform duration-500 hover:scale-105" style={{ background: `${tone}18`, border: `1px solid ${tone}40`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px -6px ${tone}66` }}>
              <GreetIcon className="w-6 h-6" style={{ color: tone }} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40">Fleet Command Center</span>
                <span className="w-1 h-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-mono uppercase tracking-[0.12em]" style={{ color: tone }}>{greet}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading text-white leading-tight truncate">
                {userName || 'Welcome back'}
                {userName && <span className="text-white/45 font-body font-medium text-lg sm:text-xl"> · {greet}</span>}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-white/35" />
                <p className="text-[12px] text-white/45">{dateStr} · {timeStr}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold text-white/70" style={{ background: 'rgba(var(--panel-accent-rgb),0.10)', border: '1px solid rgba(var(--panel-accent-rgb),0.22)' }}>
              <span className="relative flex">
                <span className="absolute inline-flex h-2 w-2 rounded-full opacity-75 animate-ping" style={{ background: 'rgb(var(--panel-accent-rgb))' }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: 'rgb(var(--panel-accent-rgb))' }} />
              </span>
              Live
            </span>
          </div>
        </div>

        {/* Row 2 — date range indicator */}
        <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <CalendarDays className="w-3.5 h-3.5 text-white/35 flex-shrink-0" />
          <span className="text-[11px] text-white/45 font-medium">Data range</span>
          <span className="text-[11px] text-white/70 font-mono tabular-nums">{formatDate(dateFrom)}</span>
          <span className="text-white/25 text-[10px]">→</span>
          <span className="text-[11px] text-white/70 font-mono tabular-nums">{formatDate(dateTo)}</span>
        </div>

        {/* Row 3 — professional stat tiles */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map((s, i) => (
            <div key={s.label} className="relative rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-up"
              style={{
                animationDelay: `${0.1 + i * 0.06}s`,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
              <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl" style={{ background: s.hex, opacity: 0.8, boxShadow: `0 0 12px ${s.hex}55` }} />
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none opacity-20 blur-2xl" style={{ background: `radial-gradient(circle, ${s.hex}40 0%, transparent 70%)` }} />
              <div className="flex items-center justify-between mb-2 relative">
                <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.1em] text-white/45 font-semibold truncate">{s.label}</span>
                <span className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: `${s.hex}1a`, border: `1px solid ${s.hex}33` }}>
                  <s.Icon className="w-3.5 h-3.5" style={{ color: s.hex }} />
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-white tabular-nums tracking-tight truncate leading-none">{s.value}</p>
              <p className="text-[9px] text-white/35 mt-1 truncate">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}