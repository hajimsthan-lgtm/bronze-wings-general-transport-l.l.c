import { Truck, Gauge, Fuel as FuelIcon, Wrench, Wallet, CalendarClock, ShieldCheck, TrendingUp } from 'lucide-react';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import ProgressBar from '@/components/reports/ProgressBar';
import TrendChart from '@/components/reports/TrendChart';
import DonutChart from '@/components/reports/DonutChart';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

export default function VehiclesAnalytics({ vehicles = [], trips = [], fuelRecords = [], expenses = [], loading }) {
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
      if (v.registration_expiry) items.push({ type: 'Registration', date: v.registration_expiry, plate: v.plate_number });
      if (v.insurance_expiry) items.push({ type: 'Insurance', date: v.insurance_expiry, plate: v.plate_number });
      return items;
    })
    .map((x) => ({ ...x, d: new Date(x.date) }))
    .filter((x) => x.d <= soon60)
    .sort((a, b) => a.d - b.d);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <ReportStatCard index={0} label="Total Vehicles" value={vehicles.length} icon={Truck} color="#3b82f6" />
        <ReportStatCard index={1} label="Active Fleet" value={active} icon={Truck} color="#34d399" />
        <ReportStatCard index={2} label="In Maintenance" value={maintenance} icon={Wrench} color="#f59e0b" />
        <ReportStatCard index={3} label="Fuel Efficiency" value={fuelEff} format={(v) => `${v.toFixed(1)} KM/L`} icon={FuelIcon} color="#f97316" />
        <ReportStatCard index={4} label="Fleet Expenses" value={fleetExpenses} format={formatCurrency} icon={Wallet} color="#ef4444" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ReportSectionCard index={5} color="#3b82f6" title="Fleet Status Distribution">
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

        <ReportSectionCard index={6} color="#22c55e" title="Top Vehicles by Revenue">
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
        <ReportSectionCard index={7} color="#f97316" title="Fleet Expenses & Fuel Trend">
          <TrendChart data={trendData} series={[{ key: 'fuel', name: 'Fuel', color: '#f97316' }, { key: 'expenses', name: 'Expenses', color: '#ef4444' }]} type="area" height={220} />
        </ReportSectionCard>

        <ReportSectionCard index={8} color="#ef4444" title="Upcoming Inspections & Expiries">
          {expiries.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No upcoming expiries.</p>
          ) : (
            <div className="space-y-1">
              {expiries.slice(0, 7).map((e, i) => {
                const isExp = e.d < today;
                const tone = isExp ? '#ef4444' : '#f59e0b';
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04]">
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
      </div>
    </div>
  );
}