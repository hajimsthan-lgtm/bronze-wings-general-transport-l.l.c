import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';

/**
 * Fleet Utilization Gauge — adapted from the storage gauge mockup.
 * Uses real fleet data: assigned vehicles / total vehicles.
 * Restyled to the app's dark theme with glassmorphism + neon accent.
 */
export default function FleetUtilizationGauge({ assigned, total, loading }) {
  const pct = total > 0 ? Math.round((assigned / total) * 100) : 0;
  const [displayPct, setDisplayPct] = useState(0);

  // Count-up animation
  useEffect(() => {
    if (loading) return;
    const duration = 1400;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplayPct(Math.round(eased * pct));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct, loading]);

  // SVG ring geometry
  const r = 92;
  const circ = 2 * Math.PI * r;
  const filled = circ * (pct / 100);
  const offset = circ - filled;
  // Knob angle: 0% = top, 100% = full circle clockwise
  const knobAngle = (pct / 100) * 360;

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'rgba(var(--panel-accent-rgb),0.16)',
            border: '1px solid rgba(var(--panel-accent-rgb),0.35)',
            color: 'rgb(var(--panel-accent-rgb))',
          }}>
          <Truck className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Fleet Utilization</h3>
      </div>
      <p className="text-[11px] text-muted-foreground mb-4">Assigned vehicles out of total fleet</p>

      {/* Dial */}
      <div className="relative w-full" style={{ maxWidth: 280, margin: '0 auto' }}>
        <svg viewBox="0 0 240 240" className="w-full h-full block" aria-hidden="true">
          {/* Track ring */}
          <circle cx="120" cy="120" r={r} fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="20" />
          {/* Progress arc */}
          <circle cx="120" cy="120" r={r} fill="none"
            stroke="rgb(var(--panel-accent-rgb))" strokeWidth="20" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={loading ? circ : offset}
            transform="rotate(-90 120 120)"
            style={{
              transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
              filter: 'drop-shadow(0 0 8px rgba(var(--panel-accent-rgb),0.4))',
            }} />
          {/* Scale labels */}
          <text x="120" y="58" textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="var(--font-mono)">0</text>
          <text x="182" y="120" textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="var(--font-mono)">25</text>
          <text x="120" y="182" textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="var(--font-mono)">50</text>
          <text x="58" y="120" textAnchor="middle" dominantBaseline="middle"
            fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="var(--font-mono)">75</text>
        </svg>

        {/* Fine radial ticks — conic gradient masked to thin ring */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.08) 0deg 0.7deg, transparent 0.7deg 3.6deg)',
            WebkitMask: 'radial-gradient(circle, transparent 0 66%, #000 66% 86%, transparent 86%)',
            mask: 'radial-gradient(circle, transparent 0 66%, #000 66% 86%, transparent 86%)',
          }} />

        {/* Knob at arc end */}
        {!loading && (
          <div className="absolute inset-0"
            style={{ transform: `rotate(${knobAngle}deg)`, transition: 'transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="absolute"
              style={{
                top: '11.7%',
                left: '50%',
                width: '11%',
                aspectRatio: '1 / 1',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: 'rgb(var(--panel-accent-rgb))',
                boxShadow: '0 0 12px rgba(var(--panel-accent-rgb),0.6), 0 1px 3px rgba(0,0,0,0.3)',
              }} />
          </div>
        )}
      </div>

      {/* Readout */}
      <div className="flex flex-row items-end gap-2.5 mt-5 justify-center">
        <span className="font-display font-light leading-none text-foreground tabular-nums"
          style={{ fontSize: 'clamp(44px, 14vw, 64px)', letterSpacing: '-0.04em' }}>
          {displayPct}
          <span className="text-[0.5em] text-muted-foreground">%</span>
        </span>
        <span className="text-sm text-muted-foreground pb-1.5">
          {assigned} of {total} vehicles
        </span>
      </div>
    </div>
  );
}