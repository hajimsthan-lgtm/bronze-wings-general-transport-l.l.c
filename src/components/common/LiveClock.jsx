import { useState, useEffect } from 'react';

export default function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(now.getHours() % 12 || 12).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const date = now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();

  return (
    <div
      className="hidden lg:flex items-center gap-2.5 h-9 pl-2.5 pr-3 rounded-full transition-all duration-300"
      style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.06) 100%)',
        backdropFilter: 'blur(14px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.5)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(0,0,0,0.25), 0 5px 16px rgba(0,0,0,0.30)',
      }}
    >
      {/* live dot with ping halo */}
      <span className="relative flex items-center justify-center w-2.5 h-2.5">
        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
        <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-300" style={{ boxShadow: '0 0 8px rgba(52,211,153,0.9)' }} />
      </span>
      {/* time */}
      <span className="flex items-baseline gap-0.5">
        <span
          className="font-mono text-[13px] font-bold tabular-nums tracking-tight"
          style={{
            backgroundImage: 'linear-gradient(180deg, #ffffff 0%, rgb(var(--panel-accent2-rgb)) 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 5px rgba(var(--panel-accent2-rgb),0.35))',
          }}
        >
          {hh}
        </span>
        <span className="animate-pulse text-white/30 font-mono text-[13px] font-bold">:</span>
        <span className="font-mono text-[13px] font-bold tabular-nums tracking-tight text-white/90">{mm}</span>
        <span className="font-mono text-[9px] font-semibold text-white/30 tabular-nums ml-0.5">{ss}</span>
      </span>
      {/* AM/PM badge */}
      <span
        className="text-[9px] font-bold tracking-[0.16em] px-1.5 py-0.5 rounded-full"
        style={{ background: 'rgba(var(--panel-accent-rgb),0.15)', color: 'rgb(var(--panel-accent2-rgb))', border: '1px solid rgba(var(--panel-accent-rgb),0.25)' }}
      >
        {ampm}
      </span>
      <span className="w-px h-3.5 bg-white/12" />
      <span className="text-[9px] font-medium tracking-[0.14em] text-white/45">{date}</span>
    </div>
  );
}