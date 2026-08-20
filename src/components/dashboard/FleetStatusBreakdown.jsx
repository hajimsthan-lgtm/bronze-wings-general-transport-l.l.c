import { Truck, Wrench, PowerOff } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import PremiumCard from '@/components/dashboard/premium/PremiumCard';

/**
 * Fleet Status Breakdown — shows active / maintenance / off-duty counts
 * with colored icon chips and a compact donut, matching the Dashboard's
 * PremiumCard aesthetic.
 */
export default function FleetStatusBreakdown({ vehicles = [] }) {
  const active = vehicles.filter((v) => v.status === 'active').length;
  const maintenance = vehicles.filter((v) => v.status === 'maintenance').length;
  const inactive = vehicles.filter((v) => v.status === 'inactive').length;
  const total = vehicles.length;

  const segments = [
    { label: 'Active', value: active, color: '#34d399', icon: Truck },
    { label: 'Maintenance', value: maintenance, color: '#f59e0b', icon: Wrench },
    { label: 'Off-Duty', value: inactive, color: '#94a3b8', icon: PowerOff },
  ];

  // SVG donut geometry
  const r = 52;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const totalForDonut = total || 1;

  return (
    <PremiumCard>
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: hexToRgba('#3b82f6', 0.16), border: `1px solid ${hexToRgba('#3b82f6', 0.35)}` }}>
          <Truck className="w-4 h-4" style={{ color: '#3b82f6' }} />
        </div>
        <h2 className="text-sm font-semibold text-white">Fleet Status Breakdown</h2>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">{total} vehicles</span>
      </div>

      <div className="flex items-center gap-5 flex-wrap">
        {/* Donut */}
        <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
          <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
            <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
            {segments.map((s) => {
              if (s.value === 0) return null;
              const len = (s.value / totalForDonut) * circ;
              const el = (
                <circle key={s.label} cx="70" cy="70" r={r} fill="none"
                  stroke={s.color} strokeWidth="14" strokeLinecap="round"
                  strokeDasharray={`${len} ${circ - len}`}
                  strokeDashoffset={-offset}
                  style={{ filter: `drop-shadow(0 0 4px ${hexToRgba(s.color, 0.5)})` }}
                />
              );
              offset += len;
              return el;
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-white tabular-nums leading-none">{total}</span>
            <span className="text-[9px] uppercase tracking-wider text-white/40 mt-1">Total</span>
          </div>
        </div>

        {/* Legend + counts */}
        <div className="flex-1 space-y-3 min-w-[160px]">
          {segments.map((s) => {
            const I = s.icon;
            const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
            return (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: hexToRgba(s.color, 0.14), border: `1px solid ${hexToRgba(s.color, 0.3)}` }}>
                  <I className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] text-white/70">{s.label}</p>
                    <p className="text-[13px] font-semibold text-white tabular-nums">{s.value}</p>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden mt-1.5">
                    <div className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${pct}%`, background: s.color, boxShadow: `0 0 6px ${hexToRgba(s.color, 0.5)}` }} />
                  </div>
                </div>
                <span className="text-xs text-white/40 w-8 text-right tabular-nums">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </PremiumCard>
  );
}