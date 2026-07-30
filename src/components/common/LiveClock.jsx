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

  return (
    <div
      className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-full transition-all hover:border-white/20"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 8px rgba(52,211,153,0.8)' }} />
      <span className="font-mono text-[13px] font-semibold tabular-nums tracking-tight text-white/90">
        {hh}<span className="animate-pulse text-white/40">:</span>{mm}
      </span>
      <span className="text-[9px] font-bold tracking-[0.15em] text-white/40">{ampm}</span>
      <span className="w-px h-3.5 bg-white/12" />
      <span className="text-[9px] font-medium tracking-[0.14em] text-white/40">{date}</span>
    </div>
  );
}