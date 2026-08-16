import { useMemo, useState } from 'react';
import { BarChart3, Eye } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import { formatCurrency, formatDate } from '@/lib/formatters';
import QuickViewModal from './QuickViewModal';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const weekIdx = (d) => (d.getDay() + 6) % 7;

export default function WeeklyActivityChart({ trips = [] }) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
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
    <div className="glass-card rounded-2xl flex flex-col animate-fade-in-up transition-all duration-200" style={{ borderLeft: '4px solid #1ED760' }}>
      <div className="flex items-center justify-between h-12 px-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba('#1ED760', 0.10), border: `1px solid ${hexToRgba('#1ED760', 0.25)}` }}>
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Weekly Activity</h3>
            <p className="text-xs text-muted-foreground truncate">{total} trips this week</p>
          </div>
        </div>
        <button onClick={() => setQuickViewOpen(true)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0" title="Quick View">
          <Eye className="w-4 h-4" />
        </button>
      </div>

      <div className="h-[280px] flex flex-col items-center justify-center p-5">
        <div className="relative flex items-end justify-between gap-2 h-36 w-full">
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

      <QuickViewModal
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        title="Weekly Activity — Quick View"
        icon={BarChart3}
        accent="#1ED760"
        records={trips}
        dateField="trip_date"
        filename="weekly-activity"
        columns={[
          { label: 'Date', key: 'trip_date' },
          { label: 'Route', key: 'route' },
          { label: 'Vehicle', key: 'vehicle_plate' },
          { label: 'Revenue', key: 'revenue', numeric: true },
          { label: 'Status', key: 'status' },
        ]}
        bodyRender={(filtered) => {
          const byDay = {};
          filtered.forEach((t) => {
            const d = t.trip_date || '';
            if (!d) return;
            if (!byDay[d]) byDay[d] = { count: 0, revenue: 0 };
            byDay[d].count += 1;
            byDay[d].revenue += Number(t.revenue) || 0;
          });
          const days = Object.keys(byDay).sort();
          const maxCount = Math.max(1, ...days.map((d) => byDay[d].count));
          return (
            <div className="space-y-3">
              {days.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No trips in this period</p>
              ) : (
                <>
                  <div className="flex items-end gap-1 h-40">
                    {days.slice(-30).map((d) => (
                      <div key={d} className="flex-1 flex flex-col items-center justify-end gap-1 h-full min-w-0">
                        <span className="text-[9px] text-muted-foreground tabular-nums">{byDay[d].count}</span>
                        <div className="w-full rounded-t-md" style={{ height: `${(byDay[d].count / maxCount) * 120}px`, background: 'linear-gradient(180deg,#4ADE80,#1ED760)' }} />
                        <span className="text-[8px] text-muted-foreground truncate w-full text-center">{d.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-2 space-y-1">
                    {days.map((d) => (
                      <div key={d} className="flex items-center justify-between text-xs px-2 py-1 rounded-lg hover:bg-muted/30">
                        <span className="text-muted-foreground">{formatDate(d)}</span>
                        <span className="text-foreground font-medium">{byDay[d].count} trips · {formatCurrency(byDay[d].revenue)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        }}
        summaryFooter={(filtered) => {
          const totalTrips = filtered.length;
          const totalRev = filtered.reduce((s, t) => s + (Number(t.revenue) || 0), 0);
          return (
            <div className="flex items-center justify-between">
              <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Trips</p><p className="text-lg font-bold text-foreground tabular-nums">{totalTrips}</p></div>
              <div className="text-right"><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Revenue</p><p className="text-lg font-bold text-foreground tabular-nums">{formatCurrency(totalRev)}</p></div>
            </div>
          );
        }}
      />
    </div>
  );
}