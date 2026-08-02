import { useMemo, useState } from 'react';
import { BarChart3, ExternalLink, ChevronDown } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const weekIdx = (d) => (d.getDay() + 6) % 7;

export default function WeeklyActivityChart({ trips = [] }) {
  const [open, setOpen] = useState(false);
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
    <div
      className="glass-card rounded-2xl p-5 animate-fade-in-up transition-all duration-300"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-left">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba('#3b82f6', 0.14), border: `1px solid ${hexToRgba('#3b82f6', 0.3)}` }}>
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <h3 className="text-base font-semibold text-foreground">Weekly Activity</h3>
              <p className="text-xs text-muted-foreground">{total} trips this week</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
          </div>
        </button>
        <ExternalLink className="w-4 h-4 text-muted-foreground" />
      </div>

      {open && (
      <>
      <div className="rounded-xl border border-border overflow-hidden p-4">
        <div className="relative flex items-end justify-between gap-2 h-36">
          {counts.map((c, i) => {
            const isPeak = i === peakIdx;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                <span className="text-[10px] text-muted-foreground tabular-nums">{c || ''}</span>
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${Math.max(c ? 6 : 2, (c / max) * 96)}px`,
                    background: isPeak ? 'linear-gradient(180deg,#60a5fa,#3b82f6)' : hexToRgba('#3b82f6', 0.22),
                    boxShadow: isPeak ? '0 0 12px rgba(59,130,246,0.5)' : 'none',
                  }}
                />
                <span className={`text-[10px] ${isPeak ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{DAYS[i]}</span>
              </div>
            );
          })}
        </div>

        {peakIdx >= 0 && (
          <p className="relative text-[11px] text-muted-foreground mt-3">
            Peak: <span className="text-foreground font-semibold">{DAYS[peakIdx]}</span> · {counts[peakIdx]} trips
          </p>
        )}
      </div>
      </>
      )}
    </div>
  );
}