import { useState } from 'react';
import { Clock, ChevronDown } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';

export default function HoursGauge({ hours = 0, target = 40 }) {
  const [open, setOpen] = useState(false);
  const pct = Math.min(100, (hours / target) * 100);
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div
      className="glass-card rounded-2xl p-5 animate-fade-in-up transition-all duration-300 relative overflow-hidden"
      style={{ borderTop: '3px solid #a855f7' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="absolute -top-16 -right-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.18), transparent 70%)' }} />
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-left">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba('#a855f7', 0.14), border: `1px solid ${hexToRgba('#a855f7', 0.3)}` }}>
            <Clock className="w-4 h-4" style={{ color: '#a855f7' }} />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <h3 className="text-base font-semibold text-foreground">Time Tracker</h3>
              <p className="text-xs text-muted-foreground">Hours this period</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
          </div>
        </button>
      </div>

      {open && (
      <div className="rounded-xl border border-border overflow-hidden p-4">
        <div className="relative flex items-center justify-center my-2">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle cx="70" cy="70" r={r} fill="none" stroke="url(#hg-grad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            <defs>
              <linearGradient id="hg-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground tabular-nums">{String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Work Time</span>
          </div>
        </div>

        <p className="relative text-[11px] text-muted-foreground text-center">
          {hours.toFixed(1)} h of {target}h target
        </p>
      </div>
      )}
    </div>
  );
}