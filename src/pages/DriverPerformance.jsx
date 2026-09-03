import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, Users, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function DriverPerformance() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [loading, setLoading] = useState(true);
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [trips, setTrips] = useState([]);

  const monthStart = useMemo(() => new Date(year, month, 1), [year, month]);
  const monthEnd = useMemo(() => new Date(year, month + 1, 0), [year, month]);
  const monthStartStr = monthStart.toISOString().slice(0, 10);
  const monthEndStr = monthEnd.toISOString().slice(0, 10);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [ot, tr] = await Promise.all([
          base44.entities.DriverOvertime.list('-created_date', 500),
          base44.entities.Trip.list('-created_date', 500),
        ]);
        if (cancelled) return;
        setOvertimeRecords(ot || []);
        setTrips(tr || []);
      } catch {
        if (!cancelled) { setOvertimeRecords([]); setTrips([]); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const goPrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const goNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Filter overtime records for this month
  const monthOvertime = useMemo(() => {
    return (overtimeRecords || []).filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [overtimeRecords, year, month]);

  // Filter completed trips for this month
  const monthTrips = useMemo(() => {
    return (trips || []).filter(t => {
      if (t.status !== 'completed') return false;
      const ref = t.trip_date || t.load_datetime || t.created_date;
      if (!ref) return false;
      const d = new Date(ref);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [trips, year, month]);

  // Aggregate by driver name
  const driverStats = useMemo(() => {
    const map = {};
    // Overtime hours
    for (const r of monthOvertime) {
      const name = r.driver_name || 'Unknown';
      if (!map[name]) map[name] = { driver_name: name, overtime_hours: 0, overtime_amount: 0, completed_trips: 0 };
      map[name].overtime_hours += Number(r.hours) || 0;
      map[name].overtime_amount += Number(r.amount) || 0;
    }
    // Completed trips
    for (const t of monthTrips) {
      const name = t.driver_name || 'Unknown';
      if (!map[name]) map[name] = { driver_name: name, overtime_hours: 0, overtime_amount: 0, completed_trips: 0 };
      map[name].completed_trips += 1;
    }
    return Object.values(map).sort((a, b) => b.completed_trips - a.completed_trips || b.overtime_hours - a.overtime_hours);
  }, [monthOvertime, monthTrips]);

  const totals = useMemo(() => ({
    drivers: driverStats.length,
    overtimeHours: driverStats.reduce((s, d) => s + d.overtime_hours, 0),
    overtimeAmount: driverStats.reduce((s, d) => s + d.overtime_amount, 0),
    completedTrips: driverStats.reduce((s, d) => s + d.completed_trips, 0),
  }), [driverStats]);

  return (
    <div className="professional-page-bg p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="hud-icon-tile w-11 h-11">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">Driver Performance</h1>
            <p className="text-xs text-muted-foreground">Monthly overtime hours & completed trips per driver</p>
          </div>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goPrev} className="h-9 w-9">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="glass-card px-4 py-2 min-w-[160px] text-center">
            <span className="text-sm font-bold text-foreground">{MONTHS[month]} {year}</span>
          </div>
          <Button variant="outline" size="icon" onClick={goNext} className="h-9 w-9">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-tile p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="eyebrow">Active Drivers</span>
            <Users className="w-4 h-4 text-primary/60" />
          </div>
          <span className="text-2xl font-bold text-foreground tabular-nums">{totals.drivers}</span>
        </div>
        <div className="stat-tile p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="eyebrow">Overtime Hours</span>
            <Clock className="w-4 h-4 text-amber-500/60" />
          </div>
          <span className="text-2xl font-bold text-foreground tabular-nums">{totals.overtimeHours.toFixed(1)}</span>
        </div>
        <div className="stat-tile p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="eyebrow">Completed Trips</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500/60" />
          </div>
          <span className="text-2xl font-bold text-foreground tabular-nums">{totals.completedTrips}</span>
        </div>
        <div className="stat-tile p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="eyebrow">Overtime Cost</span>
            <TrendingUp className="w-4 h-4 text-primary/60" />
          </div>
          <span className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(totals.overtimeAmount)}</span>
        </div>
      </div>

      {/* Driver table */}
      <Card className="glass-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40">
          <h2 className="text-sm font-bold text-foreground">
            Driver Breakdown — {MONTHS[month]} {year}
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : driverStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <div className="empty-orb w-14 h-14 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No driver activity in {MONTHS[month]} {year}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Driver</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Overtime Hours</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Overtime Amount</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Completed Trips</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Trips / Overtime Hr</th>
                </tr>
              </thead>
              <tbody>
                {driverStats.map((d, i) => {
                  const ratio = d.overtime_hours > 0 ? (d.completed_trips / d.overtime_hours).toFixed(2) : '—';
                  return (
                    <tr key={i} className="border-b border-border/20 hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{d.driver_name}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-amber-500 font-semibold">{d.overtime_hours.toFixed(1)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">{formatCurrency(d.overtime_amount)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-500 font-semibold">{d.completed_trips}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{ratio}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border/60 bg-muted/20 font-bold">
                  <td className="px-4 py-3 text-foreground">TOTAL</td>
                  <td className="px-4 py-3 text-right tabular-nums text-amber-500">{totals.overtimeHours.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{formatCurrency(totals.overtimeAmount)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-500">{totals.completedTrips}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}