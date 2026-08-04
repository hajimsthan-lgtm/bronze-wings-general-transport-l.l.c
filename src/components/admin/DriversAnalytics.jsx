import { Users, UserCheck, CalendarClock, TrendingUp, ArrowRight, Truck, Wallet, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import ProgressBar from '@/components/reports/ProgressBar';
import TrendChart from '@/components/reports/TrendChart';
import Sparkline from '@/components/reports/Sparkline';
import DonutChart from '@/components/reports/DonutChart';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function DriversAnalytics({ drivers = [], trips = [], loading }) {
  const navigate = useNavigate();
  if (loading && drivers.length === 0) return <LoadingSpinner />;

  const active = drivers.filter((d) => d.status === 'active').length;
  const onLeave = drivers.filter((d) => d.status === 'on_leave').length;
  const inactive = drivers.filter((d) => d.status === 'inactive').length;
  const tripsByDriver = {};
  trips.forEach((tt) => { if (tt.driver_name) tripsByDriver[tt.driver_name] = (tripsByDriver[tt.driver_name] || 0) + 1; });
  const totalTrips = Object.values(tripsByDriver).reduce((a, b) => a + b, 0);
  const topDrivers = drivers.map((d) => ({ name: d.name, trips: tripsByDriver[d.name] || 0 })).sort((a, b) => b.trips - a.trips).slice(0, 6);

  // Revenue by driver
  const revByDriver = {};
  trips.forEach((tt) => { if (tt.driver_name) revByDriver[tt.driver_name] = (revByDriver[tt.driver_name] || 0) + (Number(tt.revenue) || 0); });
  const topRevDrivers = drivers.map((d) => ({ name: d.name, revenue: revByDriver[d.name] || 0, trips: tripsByDriver[d.name] || 0 })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const totalDriverRev = topRevDrivers.reduce((s, d) => s + d.revenue, 0);

  // Status donut
  const statusDonut = [
    { name: 'Active', value: active, color: '#34d399' },
    { name: 'On Leave', value: onLeave, color: '#f59e0b' },
    { name: 'Inactive', value: inactive, color: '#94a3b8' },
  ].filter((d) => d.value > 0);

  // Assigned vs unassigned
  const assigned = drivers.filter((d) => d.assigned_vehicle).length;
  const unassigned = drivers.length - assigned;

  const today = new Date(); const soon = new Date(); soon.setDate(today.getDate() + 30);
  const expiring = drivers.filter((d) => d.license_expiry && new Date(d.license_expiry) <= soon).sort((a, b) => (a.license_expiry || '').localeCompare(b.license_expiry || '')).slice(0, 6);

  const months = []; const now = new Date();
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('en', { month: 'short' }) }); }
  const tripSeries = months.map((m) => trips.filter((tt) => tt.trip_date && tt.trip_date.startsWith(m.key)).length);
  const trendData = months.map((m, i) => ({ label: m.label, trips: tripSeries[i] }));

  return (
    <div>
      {/* License Expiring Soon — moved to top */}
      <ReportSectionCard index={0} color="#f59e0b" title="License Expiring Soon" className="mb-6"
        action={<button onClick={() => navigate('/admin/drivers')} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors">View All <ArrowRight className="w-3 h-3" /></button>}>
        {expiring.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">All licenses valid.</p> : (
          <div className="space-y-1">
            {expiring.map((d) => {
              const expired = new Date(d.license_expiry) < today;
              return (
                <div key={d.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.02] rounded-lg px-1 transition-colors" onClick={() => navigate(`/admin/drivers/${d.id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                    <p className="text-[11px] text-muted-foreground">{d.license_number || '—'}</p>
                  </div>
                  <span className={`text-xs font-semibold tabular-nums ${expired ? 'text-rose-300' : 'text-amber-300'}`}>{formatDate(d.license_expiry)}</span>
                </div>
              );
            })}
          </div>
        )}
      </ReportSectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ReportStatCard index={1} label="Total Drivers" value={drivers.length} icon={Users} color="#3b82f6" to="/admin/drivers" />
        <ReportStatCard index={2} label="Active" value={active} icon={UserCheck} color="#34d399" to="/admin/drivers" />
        <ReportStatCard index={3} label="On Leave" value={onLeave} icon={CalendarClock} color="#f59e0b" to="/admin/drivers" />
        <ReportStatCard index={4} label="Total Trips" value={totalTrips} icon={TrendingUp} color="#a855f7" to="/trips" extra={<Sparkline data={tripSeries} type="bar" color="#a855f7" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ReportSectionCard index={5} color="#3b82f6" title="Top Drivers by Trips"
          action={<button onClick={() => navigate('/admin/drivers')} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors">View All <ArrowRight className="w-3 h-3" /></button>}>
          {topDrivers.length === 0 || topDrivers[0].trips === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No trip data yet.</p> : (
            <div className="space-y-3">
              {topDrivers.map((d) => {
                const pct = totalTrips > 0 ? (d.trips / totalTrips) * 100 : 0;
                return (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70 truncate">{d.name}</span>
                      <span className="text-white/80 tabular-nums">{d.trips} trips · {pct.toFixed(0)}%</span>
                    </div>
                    <ProgressBar pct={pct} color="#3b82f6" />
                  </div>
                );
              })}
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard index={6} color="#34d399" title="Driver Status & Availability">
          <div className="flex items-center gap-5 flex-wrap">
            <DonutChart data={statusDonut.length ? statusDonut : [{ name: 'None', value: 1, color: '#334155' }]} total={drivers.length} height={160} />
            <div className="space-y-2.5 flex-1 min-w-[140px]">
              {statusDonut.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-white/70">{d.name}</span>
                  <span className="text-xs font-semibold text-white ml-auto tabular-nums">{d.value}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-xs text-white/70">Assigned Vehicle</span>
                  <span className="text-xs font-semibold text-white ml-auto tabular-nums">{assigned}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-xs text-white/70">Unassigned</span>
                  <span className="text-xs font-semibold text-white ml-auto tabular-nums">{unassigned}</span>
                </div>
              </div>
            </div>
          </div>
        </ReportSectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ReportSectionCard index={7} color="#22c55e" title="Top Drivers by Revenue"
          action={<button onClick={() => navigate('/admin/drivers')} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors">View All <ArrowRight className="w-3 h-3" /></button>}>
          {topRevDrivers.length === 0 || topRevDrivers[0].revenue === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No revenue data yet.</p> : (
            <div className="space-y-3">
              {topRevDrivers.map((d) => {
                const pct = totalDriverRev > 0 ? (d.revenue / totalDriverRev) * 100 : 0;
                return (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70 truncate">{d.name}</span>
                      <span className="text-white/80 tabular-nums">{formatCurrency(d.revenue)} · {d.trips} trips</span>
                    </div>
                    <ProgressBar pct={pct} color="#22c55e" />
                  </div>
                );
              })}
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard index={8} color="#a855f7" title="Trips Trend">
          <TrendChart data={trendData} series={[{ key: 'trips', name: 'Trips', color: '#a855f7' }]} type="area" height={200} />
        </ReportSectionCard>
      </div>

    </div>
  );
}