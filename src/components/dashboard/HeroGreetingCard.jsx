import { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, Sparkles, Activity, Wallet, FileWarning } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return { text: 'Good Morning', Icon: Sun, tone: '#fbbf24' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', Icon: Sun, tone: '#f97316' };
  if (hour >= 17 && hour < 20) return { text: 'Good Evening', Icon: Cloud, tone: '#a78bfa' };
  return { text: 'Good Night', Icon: Moon, tone: '#60a5fa' };
}

export default function HeroGreetingCard({ activeTrips = 0, totalRevenue = 0, pendingInvoices = 0 }) {
  const [now, setNow] = useState(new Date());
  const [userName, setUserName] = useState('');

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
  const { text: greet, Icon: GreetIcon, tone } = getGreeting(hour);
  const dateStr = now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });
  const hh = String(now.getHours() % 12 || 12).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const secProgress = (now.getSeconds() + now.getMilliseconds() / 1000) / 60;

  const stats = [
    { label: 'Active Trips', value: activeTrips, hex: '#34d399', Icon: Activity },
    { label: 'Revenue', value: formatCurrency(totalRevenue), hex: '#60a5fa', Icon: Wallet },
    { label: 'Pending Invoices', value: pendingInvoices, hex: '#fbbf24', Icon: FileWarning },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl animate-fade-in-up"
      style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border-color)', boxShadow: 'var(--panel-inner-highlight), 0 24px 70px rgba(0,0,0,0.45)', backdropFilter: 'var(--panel-blur)', WebkitBackdropFilter: 'var(--panel-blur)' }}>
      {/* subtle ambient mesh */}
      <div className="pointer-events-none absolute -top-20 right-10 w-64 h-64 rounded-full opacity-60" style={{ background: `radial-gradient(circle, ${tone}1f, transparent 70%)` }} />
      <div className="pointer-events-none absolute inset-0 dot-grid-overlay opacity-20" />

      <div className="relative p-6 sm:p-8 grid lg:grid-cols-[1.5fr_1fr] gap-8 items-center">
        {/* Left — greeting + modern stat tiles */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white/70" style={{ background: `${tone}1a`, border: `1px solid ${tone}40` }}>
              <GreetIcon className="w-3.5 h-3.5" style={{ color: tone }} />
              {dateStr}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold text-white/65" style={{ background: 'rgba(var(--panel-accent-rgb),0.10)', border: '1px solid rgba(var(--panel-accent-rgb),0.22)' }}>
              <Sparkles className="w-2.5 h-2.5" /> Live
            </span>
          </div>

          <h1 className="mt-3 text-3xl sm:text-4xl font-heading text-white leading-tight">
            {greet}{userName ? <>, <span className="text-white/55 font-body font-medium text-xl sm:text-2xl">{userName}</span></> : null}
          </h1>
          <p className="mt-1.5 text-[13px] sm:text-sm text-white/45 max-w-md">
            Your business snapshot for today — tap any metric to dive in.
          </p>

          <div className="grid grid-cols-3 gap-3 mt-5">
            {stats.map((s) => (
              <div key={s.label} className="relative rounded-2xl px-3.5 py-3 overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: s.hex, opacity: 0.7 }} />
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-wider text-white/45 font-semibold truncate">{s.label}</span>
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg" style={{ background: `${s.hex}1a`, border: `1px solid ${s.hex}33` }}>
                    <s.Icon className="w-3 h-3" style={{ color: s.hex }} />
                  </span>
                </div>
                <p className="mt-1.5 text-base sm:text-lg font-bold text-white tabular-nums truncate">{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — minimalist clock with seconds progress */}
        <div className="relative rounded-2xl px-5 py-5 flex flex-col items-center justify-center text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
              <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-300" />
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">Local Time</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-4xl sm:text-5xl font-medium tabular-nums text-white tracking-tight">{hh}:{mm}</span>
            <span className="font-mono text-lg text-white/40 tabular-nums">:{ss}</span>
            <span className="ml-1 text-xs font-bold text-white/50">{ampm}</span>
          </div>
          <div className="mt-3 w-full max-w-[180px] h-[3px] rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${secProgress * 100}%`, background: 'linear-gradient(90deg, rgb(var(--panel-accent-rgb)), rgb(var(--panel-accent2-rgb)))' }} />
          </div>
        </div>
      </div>
    </div>
  );
}