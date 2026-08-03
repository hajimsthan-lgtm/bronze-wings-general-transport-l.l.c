import { useState, useEffect } from 'react';

export default function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(now.getHours() % 12 || 12).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const date = now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase();
  const sec = now.getSeconds();
  const secOffset = 2 * Math.PI * 10 * (1 - sec / 60);

  return (
    <div
      className="hidden lg:flex items-center gap-2.5 h-9 pl-2 pr-3 rounded-full transition-all duration-300"
      style={{
        background: 'linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 55%, rgba(255,255,255,0.06) 100%)',
        backdropFilter: 'blur(14px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.5)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(0,0,0,0.25), 0 5px 16px rgba(0,0,0,0.30)',
      }}
    >
      {/* circular seconds ring */}
      <svg width="20" height="20" viewBox="0 0 24 24" className="flex-shrink-0">
        <circle cx="12" cy="12" r="10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
        <circle cx="12" cy="12" r="10" fill="none" stroke="rgb(var(--panel-accent2-rgb))" strokeWidth="2" strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 10} strokeDashoffset={secOffset} transform="rotate(-90 12 12)"
          style={{ filter: 'drop-shadow(0 0 3px rgba(var(--panel-accent2-rgb),0.7))', transition: 'stroke-dashoffset 0.95s linear' }} />
        <circle cx="12" cy="12" r="1.5" fill="rgb(var(--panel-accent2-rgb))" />
      </svg>
      {/* time */}
      <span className="font-mono text-[13px] font-bold tabular-nums tracking-tight text-white/90">{hh}:{mm}</span>
      {/* AM/PM badge */}
      <span className="text-[9px] font-bold tracking-[0.16em] px-1.5 py-0.5 rounded-full"
        style={{ background: 'rgba(var(--panel-accent-rgb),0.15)', color: 'rgb(var(--panel-accent2-rgb))', border: '1px solid rgba(var(--panel-accent-rgb),0.25)' }}>
        {ampm}
      </span>
      <span className="w-px h-3.5 bg-white/12" />
      <span className="text-[9px] font-medium tracking-[0.14em] text-white/45">{date}</span>
    </div>
  );
}