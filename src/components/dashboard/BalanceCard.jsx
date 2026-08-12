import { useId } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { TrendingUp, TrendingDown, Truck, FileText, Wallet } from 'lucide-react';

export default function BalanceCard({ healthPct, totalRevenue, activeTrips, pendingInvoices, avgTripValue, revData }) {
  const gid = useId().replace(/[:]/g, '');
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.max(0, Math.min(100, healthPct)) / 100) * circ;

  const last = revData[revData.length - 1]?.revenue || 0;
  const prev = revData[revData.length - 2]?.revenue || 0;
  const change = last - prev;
  const up = change >= 0;

  const stats = [
    { icon: Truck, label: 'Active Trips', value: activeTrips, color: '#34d399' },
    { icon: FileText, label: 'Pending Inv.', value: pendingInvoices, color: '#fbbf24' },
    { icon: Wallet, label: 'Avg Trip', value: formatCurrency(avgTripValue), color: '#4ADE80' },
  ];

  return (
    <div className="rounded-3xl p-5 sm:p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.82) 0%, rgba(var(--surf-2-rgb),0.92) 100%)', border: '1px solid rgba(var(--panel-accent-rgb),0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 12px 36px rgba(0,0,0,0.08)', backdropFilter: 'blur(20px) saturate(1.3)', WebkitBackdropFilter: 'blur(20px) saturate(1.3)' }}>
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(var(--panel-accent-rgb),0.6) 0%, transparent 70%)' }} />
      <div className="relative flex flex-col sm:flex-row items-center gap-6">
        {/* circular gauge */}
        <div className="relative flex-shrink-0" style={{ width: 130, height: 130 }}>
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgb(var(--panel-accent-rgb))" />
                <stop offset="100%" stopColor="rgb(var(--panel-accent2-rgb))" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
            <circle cx="60" cy="60" r={r} fill="none" stroke={`url(#${gid})`} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 60 60)"
              style={{ filter: 'drop-shadow(0 0 6px rgba(var(--panel-accent-rgb),0.6))', transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white tabular-nums leading-none">{healthPct}%</span>
            <span className="text-[9px] uppercase tracking-wider text-white/45 mt-1">Fleet Health</span>
          </div>
        </div>

        {/* right: revenue + change + mini stats */}
        <div className="flex-1 min-w-0 w-full">
          <p className="text-[10px] uppercase tracking-[0.1em] text-white/45 font-semibold">Total Revenue</p>
          <p className="text-3xl sm:text-4xl font-light text-white tabular-nums tracking-tight leading-tight mt-1">{formatCurrency(totalRevenue)}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full text-[11px] font-bold"
              style={{ background: up ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)', border: `1px solid ${up ? 'rgba(52,211,153,0.35)' : 'rgba(248,113,113,0.35)'}`, color: up ? '#34d399' : '#f87171' }}>
              {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {up ? '+' : ''}{formatCurrency(change)}
            </span>
            <span className="text-[11px] text-white/40">vs yesterday</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-4">
             {stats.map((s) => (
               <div key={s.label} className="rounded-xl p-2 sm:p-2.5" style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}>
                 <div className="flex items-center gap-1 mb-1">
                   <s.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" style={{ color: s.color }} />
                   <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/40 truncate">{s.label}</span>
                 </div>
                 <p className="text-xs sm:text-sm font-bold text-white tabular-nums truncate">{s.value}</p>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}