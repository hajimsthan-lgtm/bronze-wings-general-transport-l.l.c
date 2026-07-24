import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' });
  return (
    <div className="hidden lg:flex items-center gap-2.5 h-9 px-3.5 rounded-full bg-white/5 border border-white/10 text-white/70 transition-all hover:border-blue-500/30 hover:bg-white/10">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.7)]" />
      <Clock className="w-3.5 h-3.5 text-blue-400" />
      <span className="text-xs font-semibold tabular-nums text-white/90">{time}</span>
      <span className="w-px h-3.5 bg-white/15" />
      <span className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-medium">{date}</span>
    </div>
  );
}