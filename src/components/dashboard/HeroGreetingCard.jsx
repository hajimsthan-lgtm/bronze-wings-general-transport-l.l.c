import { useState, useEffect } from 'react';
import { Sun, Moon, Cloud, Sparkles } from 'lucide-react';
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
  const displayName = userName || '';

  const stats = [
    { label: 'Active Trips', value: activeTrips, hex: '#34d399' },
    { label: 'Revenue', value: formatCurrency(totalRevenue), hex: '#60a5fa' },
    { label: 'Pending Invoices', value: pendingInvoices, hex: '#fbbf24' },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl animate-fade-in-up" style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border-color)', boxShadow: 'var(--panel-inner-highlight), inset 0 0 80px rgba(var(--panel-accent-rgb),0.04), 0 0 0 1px rgba(var(--panel-accent-rgb),0.06), 0 24px 70px rgba(0,0,0,0.5)', backdropFilter: 'var(--panel-blur)', WebkitBackdropFilter: 'var(--panel-blur)' }}>
      {/* ambient glows */}
      <div className="pointer-events-none absolute -top-24 -right-10 w-72 h-72 rounded-full" style={{ background: `radial-gradient(circle, ${tone}26, transparent 70%)` }} />
      <div className="pointer-events-none absolute -bottom-28 -left-10 w-72 h-72 rounded-full" style={{ background: 'radial-gradient(circle, rgba(var(--panel-accent2-rgb),0.16), transparent 70%)' }} />
      <div className="pointer-events-none absolute inset-0 dot-grid-overlay opacity-30" />

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Greeting */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${tone}22`, border: `1px solid ${tone}55` }}>
                <GreetIcon className="w-4 h-4" style={{ color: tone }} />
              </span>
              <span className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#a0a5b8]">{dateStr}</span>
              <span className="hidden sm:inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white/70" style={{ background: 'rgba(var(--panel-accent-rgb),0.12)', border: '1px solid rgba(var(--panel-accent-rgb),0.25)' }}>
                <Sparkles className="w-2.5 h-2.5" /> Live
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-heading text-white mt-3 leading-tight">
              {greet}{displayName ? <>, <span className="text-gradient">{displayName}</span></> : null}
            </h1>
            <p className="text-[13px] sm:text-sm text-[#a0a5b8] mt-2 max-w-md">
              Here's your business snapshot for today — tap any metric to dive in.
            </p>

            {/* Inline glass stat chips */}
            <div className="flex flex-wrap items-center gap-2.5 mt-4">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-2.5 px-3 py-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.hex, boxShadow: `0 0 8px ${s.hex}` }} />
                  <span className="text-[10px] uppercase tracking-wider text-white/45 font-semibold">{s.label}</span>
                  <span className="text-sm font-bold text-white tabular-nums">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live clock */}
          <div className="flex items-center gap-4 self-start lg:self-auto lg:text-right">
            <div>
              <div className="text-3xl sm:text-5xl font-mono font-medium tabular-nums text-white leading-none">{timeStr}</div>
              <div className="text-[11px] uppercase tracking-wider text-[#6b7280] mt-2">Local Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}