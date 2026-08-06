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
      {/* ambient mesh */}
      <div className="pointer-events-none absolute -top-24 right-0 w-72 h-72 rounded-full opacity-50" style={{ background: `radial-gradient(circle, ${gradient}, transparent 70%)` }} />

      <div className="relative p-6 sm:p-8">
        {/* Row 1 — greeting + live badge */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-5 min-w-0">
            {/* gradient-ring icon */}
            <span className="relative flex items-center justify-center w-16 h-16 rounded-full flex-shrink-0">
              <span className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 180deg, rgb(var(--panel-accent-rgb)), rgb(var(--panel-accent2-rgb)), rgb(var(--panel-accent-rgb)))', padding: '2px', WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))', mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))', boxShadow: `0 0 24px -4px ${tone}55` }} />
              <span className="relative flex items-center justify-center w-full h-full rounded-full" style={{ background: 'rgba(10,10,15,0.9)' }}>
                <GreetIcon className="w-6 h-6" style={{ color: tone }} />
              </span>
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 mb-1.5">Fleet Command Center</p>
              <h1 className="text-2xl sm:text-3xl font-heading text-white leading-tight truncate">
                {greet}
              </h1>
              <p className="text-sm text-white/45 font-body mt-1 truncate">
                {userName ? `${userName} · ${greet}` : 'Welcome back'}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-white/35" />
                <p className="text-[12px] text-white/45">{dateStr} · {timeStr}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold text-white/70" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <span className="relative flex">
                <span className="absolute inline-flex h-2 w-2 rounded-full opacity-75 animate-ping" style={{ background: '#f43f5e' }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: '#f43f5e' }} />
              </span>
              Live
            </span>
          </div>
        </div>

        {/* Row 2 — date range indicator */}
        <div className="flex items-center gap-2 mb-6 px-3.5 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <CalendarDays className="w-3.5 h-3.5 text-white/35 flex-shrink-0" />
          <span className="text-[11px] text-white/45 font-medium">Data range:</span>
          <span className="text-[11px] text-white/70 font-mono tabular-nums">{formatDate(dateFrom)}</span>
          <span className="text-white/25 text-[10px]">→</span>
          <span className="text-[11px] text-white/70 font-mono tabular-nums">{formatDate(dateTo)}</span>
        </div>

        {/* Row 3 — minimal stat cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map((s, i) => (
            <div key={s.label} className="relative rounded-2xl px-4 py-4 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-up"
              style={{
                animationDelay: `${0.1 + i * 0.06}s`,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
              <p className="text-sm font-semibold text-white truncate mb-2">{s.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-white tabular-nums tracking-tight truncate leading-none">{s.value}</p>
              <p className="text-[11px] text-white/40 mt-1.5 truncate">({s.sub})</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}