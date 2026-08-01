import { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, Sparkles, Activity, Wallet, FileWarning, TrendingUp, Truck } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return { text: 'Good Morning', Icon: Sun, tone: '#fbbf24' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', Icon: Sun, tone: '#f97316' };
  if (hour >= 17 && hour < 20) return { text: 'Good Evening', Icon: Cloud, tone: '#a78bfa' };
  return { text: 'Good Night', Icon: Moon, tone: '#60a5fa' };
}

export default function HeroGreetingCard({ activeTrips = 0, totalRevenue = 0, pendingInvoices = 0, dateFrom, dateTo, onDateChange }) {
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
  const timeStr = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true });

  const stats = [
    { label: 'Active Trips', value: activeTrips, hex: '#34d399', Icon: Activity },
    { label: 'Revenue', value: formatCurrency(totalRevenue), hex: '#60a5fa', Icon: Wallet },
    { label: 'Pending Invoices', value: pendingInvoices, hex: '#fbbf24', Icon: FileWarning },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl animate-fade-in-up"
      style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border-color)', boxShadow: 'var(--panel-inner-highlight), 0 24px 70px rgba(0,0,0,0.45)', backdropFilter: 'var(--panel-blur)', WebkitBackdropFilter: 'var(--panel-blur)' }}>
      {/* top accent strip */}
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${tone}, rgb(var(--panel-accent-rgb)), ${tone}, transparent)` }} />
      {/* ambient mesh */}
      <div className="pointer-events-none absolute -top-16 right-20 w-56 h-56 rounded-full opacity-50" style={{ background: `radial-gradient(circle, ${tone}1a, transparent 70%)` }} />
      <div className="pointer-events-none absolute inset-0 dot-grid-overlay opacity-15" />

      <div className="relative p-5 sm:p-6">
        {/* Row 1 — greeting + date/time */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex items-center justify-center w-11 h-11 rounded-2xl flex-shrink-0" style={{ background: `${tone}18`, border: `1px solid ${tone}40` }}>
              <GreetIcon className="w-5 h-5" style={{ color: tone }} />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-heading text-white leading-tight truncate">
                {greet}{userName ? <>, <span className="text-white/55 font-body font-medium text-base sm:text-lg">{userName}</span></> : null}
              </h1>
              <p className="text-[11px] text-white/40 mt-0.5">{dateStr} · {timeStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold text-white/65" style={{ background: 'rgba(var(--panel-accent-rgb),0.10)', border: '1px solid rgba(var(--panel-accent-rgb),0.22)' }}>
              <Sparkles className="w-2.5 h-2.5" /> Live
            </span>
          </div>
        </div>

        {/* Row 2 — inline stat pills */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {stats.map((s) => (
            <div key={s.label} className="relative rounded-2xl px-3 py-2.5 overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: s.hex, opacity: 0.7 }} />
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-wider text-white/45 font-semibold truncate">{s.label}</span>
                <span className="flex items-center justify-center w-5 h-5 rounded-md" style={{ background: `${s.hex}1a`, border: `1px solid ${s.hex}33` }}>
                  <s.Icon className="w-2.5 h-2.5" style={{ color: s.hex }} />
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-white tabular-nums truncate">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}