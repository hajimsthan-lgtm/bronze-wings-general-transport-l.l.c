import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Cloud, Sparkles, Activity, Wallet, FileWarning, TrendingUp, Truck, CalendarDays, ArrowUpRight } from 'lucide-react';
import WhatsAppIcon from '@/components/icons/WhatsAppIcon';
import { whatsappUrl } from '@/lib/whatsapp';
import { formatCurrency } from '@/lib/formatters';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import { formatDate } from '@/lib/formatters';

function getGreeting(hour) {
  if (hour >= 5 && hour < 12) return { text: 'Good Morning', Icon: Sun, tone: '#fbbf24', gradient: 'rgba(251,191,36,0.10)' };
  if (hour >= 12 && hour < 17) return { text: 'Good Afternoon', Icon: Sun, tone: '#f97316', gradient: 'rgba(249,115,22,0.10)' };
  if (hour >= 17 && hour < 20) return { text: 'Good Evening', Icon: Cloud, tone: '#5eead4', gradient: 'rgba(167,139,250,0.10)' };
  return { text: 'Good Night', Icon: Moon, tone: '#4ADE80', gradient: 'rgba(110,231,183,0.10)' };
}

export default function HeroGreetingCard({ activeTrips = 0, totalRevenue = 0, pendingInvoices = 0 }) {
  const [now, setNow] = useState(new Date());
  const [userName, setUserName] = useState('');
  const { dateFrom, dateTo } = useGlobalDate();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });

  const handlePanelMove = (e) => {
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleCardMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

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
    { label: 'Active Trips', value: activeTrips, hex: '#34d399', Icon: Activity, sub: 'in progress', path: '/trips' },
    { label: 'Revenue', value: formatCurrency(totalRevenue), hex: '#4ADE80', Icon: Wallet, sub: 'period total', path: '/reports/pnl' },
    { label: 'Pending Invoices', value: pendingInvoices, hex: '#fbbf24', Icon: FileWarning, sub: 'awaiting', path: '/reports/soa' },
  ];

  return (
    <div ref={panelRef} onMouseMove={handlePanelMove} className="relative overflow-hidden rounded-3xl animate-fade-in-up"
      style={{
        background: 'var(--panel-bg)',
        border: '1px solid var(--panel-border-color)',
        boxShadow: 'var(--panel-inner-highlight), 0 24px 70px rgba(0,0,0,0.45)',
        backdropFilter: 'var(--panel-blur)',
        WebkitBackdropFilter: 'var(--panel-blur)',
      }}>
      {/* cursor-following spotlight */}
      <div className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-500" style={{ background: `radial-gradient(500px circle at ${mouse.x}% ${mouse.y}%, rgba(var(--panel-accent-rgb),0.10), transparent 65%)` }} />
      {/* ambient mesh */}
      <div className="pointer-events-none absolute -top-24 right-0 w-72 h-72 rounded-full opacity-50" style={{ background: `radial-gradient(circle, ${gradient}, transparent 70%)` }} />

      <div className="relative p-6 sm:p-8">
        {/* Row 1 — WeRate-style welcome header: avatar + greeting + name */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-4 min-w-0">
            {/* profile avatar — gradient ring with initial */}
            <span className="relative flex items-center justify-center w-14 h-14 rounded-full flex-shrink-0">
              <span className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 180deg, rgb(var(--panel-accent-rgb)), rgb(var(--panel-accent2-rgb)), rgb(var(--panel-accent-rgb)))', padding: '2px', WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))', mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))', boxShadow: `0 0 24px -4px ${tone}55` }} />
              <span className="relative flex items-center justify-center w-full h-full rounded-full" style={{ background: 'rgba(10,10,15,0.9)' }}>
                <span className="text-lg font-bold" style={{ color: 'rgb(var(--panel-accent-rgb))' }}>{userName ? userName.charAt(0).toUpperCase() : 'B'}</span>
              </span>
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-white/40 mb-0.5">Welcome back</p>
              <h1 className="text-xl sm:text-2xl font-heading text-white leading-tight truncate">
                {userName || 'Bronze Wings'}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <GreetIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: tone }} />
                <p className="text-[12px] text-white/45 truncate">{greet} · {dateStr} · {timeStr}</p>
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

        {/* Row 3 — clickable stat cards with cursor spotlight + WhatsApp share */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
           {stats.map((s, i) => (
             <div
               key={s.label}
               onClick={() => navigate(s.path)}
               onMouseMove={handleCardMove}
               role="button"
               tabIndex={0}
               onKeyDown={(e) => { if (e.key === 'Enter') navigate(s.path); }}
               className="group relative rounded-2xl px-4 py-3 sm:py-4 overflow-hidden text-left transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] animate-fade-in-up cursor-pointer flex items-center gap-3 sm:block"
               style={{
                 animationDelay: `${0.1 + i * 0.06}s`,
                 background: `linear-gradient(165deg, ${s.hex}0d 0%, rgba(255,255,255,0.025) 100%)`,
                 border: '1px solid rgba(255,255,255,0.08)',
               }}
             >
               {/* per-card cursor spotlight */}
               <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(200px circle at var(--mx,50%) var(--my,50%), ${s.hex}22, transparent 70%)` }} />
               {/* top accent line on hover */}
               <div className="pointer-events-none absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(90deg, transparent, ${s.hex}, transparent)` }} />
               <div className="relative flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: `${s.hex}1a`, border: `1px solid ${s.hex}40`, boxShadow: `0 0 14px -4px ${s.hex}55` }}>
                 <s.Icon className="w-4 h-4" style={{ color: s.hex }} />
               </div>
               <div className="relative flex-1 min-w-0">
                 <div className="flex items-center justify-between gap-2">
                   <p className="text-[11px] font-semibold text-white/55 truncate uppercase tracking-wide">{s.label}</p>
                   <ArrowUpRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0 hidden sm:block" />
                 </div>
                 <p className="text-lg sm:text-xl font-bold text-white tabular-nums tracking-tight truncate leading-tight mt-0.5">{s.value}</p>
                 <div className="relative flex items-center justify-between mt-0.5">
                   <p className="text-[10px] text-white/35 truncate">({s.sub})</p>
                   <a
                     href={whatsappUrl('', `${s.label}: ${s.value} (${s.sub}) — Bronze Wings Fleet Dashboard`)}
                     target="_blank"
                     rel="noopener noreferrer"
                     onClick={(e) => e.stopPropagation()}
                     className="flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0 transition-all duration-300 hover:scale-110"
                     style={{ background: 'rgba(37,211,102,0.10)', border: '1px solid rgba(37,211,102,0.25)', color: '#25d366' }}
                     aria-label={`Share ${s.label} via WhatsApp`}
                   >
                     <WhatsAppIcon size={12} />
                   </a>
                 </div>
               </div>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}