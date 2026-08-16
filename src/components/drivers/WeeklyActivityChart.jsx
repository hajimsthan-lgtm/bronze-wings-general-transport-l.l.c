import { useMemo } from 'react';
import { BarChart3, ExternalLink } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const weekIdx = (d) => (d.getDay() + 6) % 7;

export default function WeeklyActivityChart({ trips = [] }) {
  const { counts, peakIdx, total } = useMemo(() => {
    const arr = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(now.getDate() - weekIdx(now));
    const end = new Date(start.getTime() + 7 * 86400000);
    trips.forEach((tt) => {
      if (!tt.trip_date) return;
      const dt = new Date(tt.trip_date);
      if (dt >= start && dt < end) arr[weekIdx(dt)] += 1;
    });
    const max = Math.max(...arr);
    return { counts: arr, peakIdx: max > 0 ? arr.indexOf(max) : -1, total: arr.reduce((a, b) => a + b, 0) };
  }, [trips]);

  const max = Math.max(1, ...counts);

  return (
    <div className="glass-card rounded-2xl overflow-hidden animate-fade-in-up transition-all duration-200" style={{ borderLeft: '4px solid #1ED760' }}>
      <div className="flex items-center justify-between h-12 px-4 border-b border-border">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba('#1ED760', 0.10), border: `1px solid ${hexToRgba('#1ED760', 0.25)}` }}>
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Weekly Activity</h3>
            <p className="text-xs text-muted-foreground truncate">{total} trips this week</p>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </div>

      <div className="p-5">
        <div className="relative flex items-end justify-between gap-2 h-36">
          {counts.map((c, i) => {
            const isPeak = i === peakIdx;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                <span className="text-[10px] text-muted-foreground tabular-nums">{c || ''}</span>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(c ? 6 : 4, (c / max) * 96)}px`,
                    background: total === 0 ? hexToRgba('#1ED760', 0.10) : isPeak ? 'linear-gradient(180deg,#4ADE80,#1ED760)' : `linear-gradient(180deg, ${hexToRgba('#1ED760', 0.35)}, ${hexToRgba('#1ED760', 0.5)})`,
                    boxShadow: isPeak && total > 0 ? '0 0 12px rgba(30,215,96,0.5)' : 'none',
                  }}
                />
                <span className={`text-[10px] ${isPeak ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{DAYS[i]}</span>
              </div>
            );
          })}
        </div>
        {peakIdx >= 0 && (
          <p className="text-[11px] text-muted-foreground mt-3">
            Peak: <span className="text-foreground font-semibold">{DAYS[peakIdx]}</span> · {counts[peakIdx]} trips
          </p>
        )}
      </div>
    </div>
  );
}