import { useState, useEffect } from 'react';
import { Sun, Moon, Cloud } from 'lucide-react';
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
  const firstName = userName ? userName.split(' ')[0] : '';

  return (
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
          <h1 className="text-2xl sm:text-4xl font-heading text-white mt-2.5 leading-tight">
            <span>{greet}</span>
            {firstName ? <span>, <span className="text-gradient">{firstName}</span></span> : null}
            <span className="inline-block ml-1 animate-float">👋</span>
          </h1>
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
    </div>
  );
}