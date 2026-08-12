import { Truck, Gauge, Fuel as FuelIcon, Wrench, Wallet, CalendarClock, ShieldCheck, ArrowRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import ProgressBar from '@/components/reports/ProgressBar';
import TrendChart from '@/components/reports/TrendChart';
import DonutChart from '@/components/reports/DonutChart';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

export default function VehiclesAnalytics({ vehicles = [], trips = [], fuelRecords = [], expenses = [], loading, onBrowseVehicles }) {
  const navigate = useNavigate();
  if (loading && vehicles.length === 0) return <LoadingSpinner />;

  const active = vehicles.filter((v) => v.status === 'active').length;
  const maintenance = vehicles.filter((v) => v.status === 'maintenance').length;
  const inactive = vehicles.filter((v) => v.status === 'inactive').length;

  const revMap = {};
  const tripCountMap = {};
  trips.forEach((tt) => {
    if (tt.vehicle_plate) {
      revMap[tt.vehicle_plate] = (revMap[tt.vehicle_plate] || 0) + (Number(tt.revenue) || 0);
      tripCountMap[tt.vehicle_plate] = (tripCountMap[tt.vehicle_plate] || 0) + 1;
    }
  });
  const totalRevenue = Object.values(revMap).reduce((a, b) => a + b, 0);

  const fuelByVehicle = {};
  fuelRecords.forEach((r) => { if (r.vehicle_plate) { (fuelByVehicle[r.vehicle_plate] = fuelByVehicle[r.vehicle_plate] || []).push(r); } });
  let effSum = 0, effCount = 0;
  Object.values(fuelByVehicle).forEach((recs) => {
    const odo = recs.map((r) => Number(r.odometer_reading) || 0).filter((n) => n > 0);
    const liters = recs.reduce((s, r) => s + (Number(r.liters) || 0), 0);
    if (odo.length >= 2 && liters > 0) { effSum += (Math.max(...odo) - Math.min(...odo)) / liters; effCount++; }
  });
  const fuelEff = effCount > 0 ? effSum / effCount : 0;

  const totalFuelCost = fuelRecords.reduce((s, r) => s + (Number(r.total_cost) || 0), 0);
  const totalExpenses = expenses.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const fleetExpenses = totalFuelCost + totalExpenses;

  const donutData = [
    { name: 'Active', value: active, color: '#34d399' },
    { name: 'Maintenance', value: maintenance, color: '#f59e0b' },
    { name: 'Inactive', value: inactive, color: '#94a3b8' },
  ].filter((d) => d.value > 0);
  const donutTotal = active + maintenance + inactive;

  const topVehicles = vehicles
    .map((v) => ({ name: v.plate_number, revenue: revMap[v.plate_number] || 0, trips: tripCountMap[v.plate_number] || 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // Vehicle utilization — trips per vehicle
  const utilization = vehicles
    .map((v) => ({ name: v.plate_number, trips: tripCountMap[v.plate_number] || 0, revenue: revMap[v.plate_number] || 0, status: v.status }))
    .sort((a, b) => b.trips - a.trips)
    .slice(0, 6);
  const maxTrips = Math.max(1, ...utilization.map((u) => u.trips));

  // Fuel cost by vehicle
  const fuelCostByVehicle = {};
  fuelRecords.forEach((r) => { if (r.vehicle_plate) fuelCostByVehicle[r.vehicle_plate] = (fuelCostByVehicle[r.vehicle_plate] || 0) + (Number(r.total_cost) || 0); });
  const topFuelVehicles = Object.entries(fuelCostByVehicle)
    .map(([name, cost]) => ({ name, cost }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);
  const totalFuelByTop = topFuelVehicles.reduce((s, v) => s + v.cost, 0);

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('en', { month: 'short' }) }); }
  const fuelSeries = months.map((m) => fuelRecords.filter((r) => r.date && r.date.startsWith(m.key)).reduce((s, r) => s + (Number(r.total_cost) || 0), 0));
  const expSeries = months.map((m) => expenses.filter((r) => r.date && r.date.startsWith(m.key)).reduce((s, r) => s + (Number(r.amount) || 0), 0));
  const trendData = months.map((m, i) => ({ label: m.label, fuel: fuelSeries[i], expenses: expSeries[i] }));

  const today = new Date();
  const soon60 = new Date(today.getTime() + 60 * 86400000);
  const expiries = vehicles
    .flatMap((v) => {
      const items = [];
      if (v.registration_expiry) items.push({ type: 'Registration', date: v.registration_expiry, plate: v.plate_number, id: v.id });
      if (v.insurance_expiry) items.push({ type: 'Insurance', date: v.insurance_expiry, plate: v.plate_number, id: v.id });
      return items;
    })
    .map((x) => ({ ...x, d: new Date(x.date) }))
    .filter((x) => x.d <= soon60)
    .sort((a, b) => a.d - b.d);

  return (
    <div>
      {/* Upcoming Inspections & Expiries — moved to top */}
      <ReportSectionCard index={0} color="#ef4444" title="Upcoming Inspections & Expiries" className="mb-6"
        action={<button onClick={() => navigate('/admin/vehicles')} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors">View All <ArrowRight className="w-3 h-3" /></button>}>
        {expiries.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No upcoming expiries.</p>
        ) : (
          <div className="space-y-1">
            {expiries.slice(0, 7).map((e, i) => {
              const isExp = e.d < today;
              const tone = isExp ? '#ef4444' : '#f59e0b';
              return (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.02] rounded-lg px-1 transition-colors" onClick={() => navigate(`/admin/vehicles/${e.id}`)}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(tone, 0.12), border: `1px solid ${hexToRgba(tone, 0.3)}` }}>
                    {e.type === 'Registration' ? <CalendarClock className="w-4 h-4" style={{ color: tone }} /> : <ShieldCheck className="w-4 h-4" style={{ color: tone }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.plate}</p>
                    <p className="text-[11px] text-muted-foreground">{e.type} · {formatDate(e.date)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isExp ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>{isExp ? 'Expired' : 'Soon'}</span>
                </div>
              );
            })}
          </div>
        )}
      </ReportSectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <ReportStatCard index={1} label="Total Vehicles" value={vehicles.length} icon={Truck} color="#1ED760" onClick={onBrowseVehicles} />
        <ReportStatCard index={2} label="Active Fleet" value={active} icon={Truck} color="#34d399" onClick={onBrowseVehicles} />
        <ReportStatCard index={3} label="In Maintenance" value={maintenance} icon={Wrench} color="#f59e0b" onClick={onBrowseVehicles} />
        <ReportStatCard index={4} label="Fuel Efficiency" value={fuelEff} format={(v) => `${v.toFixed(1)} KM/L`} icon={FuelIcon} color="#f97316" onClick={onBrowseVehicles} />
        <ReportStatCard index={5} label="Fleet Expenses" value={fleetExpenses} format={formatCurrency} icon={Wallet} color="#ef4444" to="/expenses" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ReportSectionCard index={6} color="#1ED760" title="Fleet Status Distribution">
          <div className="flex items-center gap-6 flex-wrap">
            <DonutChart data={donutData.length ? donutData : [{ name: 'None', value: 1, color: '#334155' }]} total={donutTotal} height={180} />
            <div className="space-y-2 flex-1 min-w-[140px]">
              {donutData.length === 0 && <p className="text-xs text-muted-foreground">No vehicles yet.</p>}
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs text-white/70">{d.name}</span>
                  <span className="text-xs font-semibold text-white ml-auto tabular-nums">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ReportSectionCard>

        <ReportSectionCard index={7} color="#22c55e" title="Top Vehicles by Revenue"
          action={<button onClick={() => navigate('/admin/vehicles')} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors">View All <ArrowRight className="w-3 h-3" /></button>}>
          {topVehicles.length === 0 || topVehicles[0].revenue === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No revenue data yet.</p>
          ) : (
            <div className="space-y-3">
              {topVehicles.map((v) => {
                const pct = totalRevenue > 0 ? (v.revenue / totalRevenue) * 100 : 0;
                return (
                  <div key={v.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70 truncate">{v.name}</span>
                      <span className="text-white/80 tabular-nums">{formatCurrency(v.revenue)} · {v.trips} trips</span>
                    </div>
                    <ProgressBar pct={pct} color="#22c55e" />
                  </div>
                );
              })}
            </div>
          )}
        </ReportSectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportSectionCard index={8} color="#f97316" title="Fleet Expenses & Fuel Trend">
          <TrendChart data={trendData} series={[{ key: 'fuel', name: 'Fuel', color: '#f97316' }, { key: 'expenses', name: 'Expenses', color: '#ef4444' }]} type="area" height={220} />
        </ReportSectionCard>

        <ReportSectionCard index={9} color="#1ED760" title="Vehicle Utilization"
          action={<button onClick={() => navigate('/admin/vehicles')} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors">View All <ArrowRight className="w-3 h-3" /></button>}>
          {utilization.length === 0 || utilization[0].trips === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No trip data yet.</p> : (
            <div className="space-y-3">
              {utilization.map((u) => {
                const pct = maxTrips > 0 ? (u.trips / maxTrips) * 100 : 0;
                const tone = u.status === 'active' ? '#34d399' : u.status === 'maintenance' ? '#f59e0b' : '#94a3b8';
                return (
                  <div key={u.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70 truncate flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: tone }} />
                        {u.name}
                      </span>
                      <span className="text-white/80 tabular-nums">{u.trips} trips · {formatCurrency(u.revenue)}</span>
                    </div>
                    <ProgressBar pct={pct} color="#1ED760" />
                  </div>
                );
              })}
            </div>
          )}
        </ReportSectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ReportSectionCard index={10} color="#f97316" title="Fuel Cost by Vehicle">
          {topFuelVehicles.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No fuel records yet.</p> : (
            <div className="space-y-3">
              {topFuelVehicles.map((v) => {
                const pct = totalFuelByTop > 0 ? (v.cost / totalFuelByTop) * 100 : 0;
                return (
                  <div key={v.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70 truncate">{v.name}</span>
                      <span className="text-white/80 tabular-nums">{formatCurrency(v.cost)}</span>
                    </div>
                    <ProgressBar pct={pct} color="#f97316" />
                  </div>
                );
              })}
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard index={11} color="#a855f7" title="Fleet Revenue vs Expenses">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/45 font-semibold">Total Revenue</p>
                  <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <Wallet className="w-4 h-4 text-red-400" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/45 font-semibold">Fleet Expenses</p>
                  <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(fleetExpenses)}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                  <TrendingUp className="w-4 h-4 text-violet-400" />
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/45 font-semibold">Net Profit</p>
                  <p className="text-lg font-bold text-white tabular-nums">{formatCurrency(totalRevenue - fleetExpenses)}</p>
                </div>
              </div>
            </div>
          </div>
        </ReportSectionCard>
      </div>
    </div>
  );
}