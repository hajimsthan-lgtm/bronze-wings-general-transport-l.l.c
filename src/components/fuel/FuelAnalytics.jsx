import { useMemo } from 'react';
import { formatCurrency, formatDateShort } from '@/lib/formatters';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import TrendChart from '@/components/reports/TrendChart';
import DonutChart from '@/components/reports/DonutChart';
import BarTrendChart from '@/components/reports/BarTrendChart';
import { Droplets, Fuel, TrendingUp, MapPin } from 'lucide-react';

const PALETTE = ['#14b8a6', '#f97316', '#3b82f6', '#a855f7', '#ef4444', '#eab308', '#ec4899', '#22c55e'];

export default function FuelAnalytics({ records, dateFrom, dateTo }) {
  const analytics = useMemo(() => {
    const totalCost = records.reduce((s, r) => s + (r.total_cost || 0), 0);
    const totalLiters = records.reduce((s, r) => s + (r.liters || 0), 0);
    const avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;
    const vehiclesFueled = new Set(records.map(r => r.vehicle_plate).filter(Boolean)).size;

    // Daily trend
    const days = [];
    const _cf = dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const _ct = dateTo || new Date().toISOString().split('T')[0];
    let d = new Date(_cf);
    const end = new Date(_ct);
    while (d <= end) {
      days.push(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() + 1);
    }
    const trendData = days.map((day) => ({
      label: formatDateShort(day),
      cost: records.filter(r => r.date === day).reduce((s, r) => s + (r.total_cost || 0), 0),
      liters: records.filter(r => r.date === day).reduce((s, r) => s + (r.liters || 0), 0),
    }));

    // By vehicle (top 6)
    const byVehicle = {};
    records.forEach(r => {
      if (!r.vehicle_plate) return;
      byVehicle[r.vehicle_plate] = (byVehicle[r.vehicle_plate] || 0) + (r.total_cost || 0);
    });
    const vehicleData = Object.entries(byVehicle)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }));

    // By station (top 5)
    const byStation = {};
    records.forEach(r => {
      if (!r.station_name) return;
      byStation[r.station_name] = (byStation[r.station_name] || 0) + (r.total_cost || 0);
    });
    const stationData = Object.entries(byStation)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));

    // By fuel type
    const byType = {};
    records.forEach(r => {
      const type = r.fuel_type || 'diesel';
      byType[type] = (byType[type] || 0) + (r.total_cost || 0);
    });
    const typeData = Object.entries(byType).map(([name, value], i) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: name === 'diesel' ? '#f97316' : '#14b8a6',
    }));

    return { totalCost, totalLiters, avgPrice, vehiclesFueled, trendData, vehicleData, stationData, typeData };
  }, [records, dateFrom, dateTo]);

  return (
    <>
      {/* Trend chart */}
      <ReportSectionCard color="#14b8a6" title="Fuel Consumption Trend" className="mb-6">
        <TrendChart
          data={analytics.trendData}
          series={[
            { key: 'cost', name: 'Cost', color: '#14b8a6' },
            { key: 'liters', name: 'Liters', color: '#f97316' },
          ]}
          type="area"
          height={240}
        />
      </ReportSectionCard>

      {/* Two-column: By Vehicle (donut) + By Station (bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ReportSectionCard color="#f97316" title="Cost by Vehicle (Top 6)">
          {analytics.vehicleData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <DonutChart data={analytics.vehicleData} total={formatCurrency(analytics.totalCost).replace('AED ', '')} height={180} />
              <div className="flex-1 space-y-2 w-full">
                {analytics.vehicleData.map((v) => (
                  <div key={v.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: v.color }} />
                    <span className="text-foreground font-medium truncate flex-1">{v.name}</span>
                    <span className="text-muted-foreground tabular-nums">{formatCurrency(v.value).replace('AED ', '')}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground text-sm py-8">No vehicle data</div>
          )}
        </ReportSectionCard>

        <ReportSectionCard color="#3b82f6" title="Cost by Station (Top 5)">
          {analytics.stationData.length > 0 ? (
            <BarTrendChart data={analytics.stationData} dataKey="value" color="#3b82f6" height={240} horizontal />
          ) : (
            <div className="text-center text-muted-foreground text-sm py-8">No station data</div>
          )}
        </ReportSectionCard>
      </div>

      {/* Fuel type breakdown */}
      {analytics.typeData.length > 0 && (
        <ReportSectionCard color="#a855f7" title="Fuel Type Breakdown" className="mb-6">
          <div className="flex flex-wrap items-center gap-6">
            {analytics.typeData.map((t) => {
              const pct = analytics.totalCost > 0 ? (t.value / analytics.totalCost) * 100 : 0;
              return (
                <div key={t.name} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${t.color}20`, border: `1px solid ${t.color}40` }}>
                    <Droplets className="w-5 h-5" style={{ color: t.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(t.value)} · {pct.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ReportSectionCard>
      )}
    </>
  );
}