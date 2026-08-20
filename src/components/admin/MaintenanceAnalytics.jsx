import { Wrench, Wallet, CalendarClock, CheckCircle2, Clock, Truck, ArrowRight, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import ProgressBar from '@/components/reports/ProgressBar';
import TrendChart from '@/components/reports/TrendChart';
import DonutChart from '@/components/reports/DonutChart';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const TYPE_COLORS = {
  oil_change: '#f97316',
  tire: '#1ED760',
  brake: '#ef4444',
  engine: '#a855f7',
  electrical: '#eab308',
  body: '#ec4899',
  inspection: '#14b8a6',
  other: '#94a3b8',
};

const TYPE_LABEL = (k) => (k || 'other').replace(/_/g, ' ');

export default function MaintenanceAnalytics({ records = [], loading, onBrowse }) {
  const navigate = useNavigate();
  if (loading && records.length === 0) return <LoadingSpinner />;

  const totalCost = records.reduce((s, r) => s + (Number(r.cost) || 0), 0);
  const scheduled = records.filter((r) => r.status === 'scheduled').length;
  const inProgress = records.filter((r) => r.status === 'in_progress').length;
  const completed = records.filter((r) => r.status === 'completed').length;

  // Cost by service type
  const costByType = {};
  records.forEach((r) => { const k = r.service_type || 'other'; costByType[k] = (costByType[k] || 0) + (Number(r.cost) || 0); });
  const donutData = Object.entries(costByType)
    .map(([k, v]) => ({ name: TYPE_LABEL(k), value: v, color: TYPE_COLORS[k] || '#94a3b8' }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const donutTotal = totalCost;

  // Status donut
  const statusData = [
    { name: 'Completed', value: completed, color: '#34d399' },
    { name: 'In Progress', value: inProgress, color: '#f59e0b' },
    { name: 'Scheduled', value: scheduled, color: '#1ED760' },
  ].filter((d) => d.value > 0);
  const statusTotal = completed + inProgress + scheduled;

  // Top vehicles by maintenance cost
  const costByVehicle = {};
  const countByVehicle = {};
  records.forEach((r) => { if (r.vehicle_plate) { costByVehicle[r.vehicle_plate] = (costByVehicle[r.vehicle_plate] || 0) + (Number(r.cost) || 0); countByVehicle[r.vehicle_plate] = (countByVehicle[r.vehicle_plate] || 0) + 1; } });
  const topVehicles = Object.entries(costByVehicle)
    .map(([name, cost]) => ({ name, cost, count: countByVehicle[name] }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 6);
  const maxCost = Math.max(1, ...topVehicles.map((v) => v.cost));

  // Monthly trend (6 months)
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('en', { month: 'short' }) }); }
  const trendData = months.map((m) => ({ label: m.label, cost: records.filter((r) => r.date && r.date.startsWith(m.key)).reduce((s, r) => s + (Number(r.cost) || 0), 0) }));

  // Upcoming scheduled services
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = records
    .filter((r) => r.next_service_date)
    .map((r) => ({ ...r, d: new Date(r.next_service_date) }))
    .filter((r) => r.d >= today)
    .sort((a, b) => a.d - b.d)
    .slice(0, 7);

  // Recent records
  const recent = [...records].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <ReportStatCard index={1} label="Total Records" value={records.length} icon={Wrench} color="#3b82f6" onClick={onBrowse} />
        <ReportStatCard index={2} label="Total Cost" value={totalCost} format={formatCurrency} icon={Wallet} color="#ef4444" onClick={onBrowse} />
        <ReportStatCard index={3} label="Scheduled" value={scheduled} icon={CalendarClock} color="#1ED760" onClick={onBrowse} />
        <ReportStatCard index={4} label="In Progress" value={inProgress} icon={Clock} color="#f59e0b" onClick={onBrowse} />
        <ReportStatCard index={5} label="Completed" value={completed} icon={CheckCircle2} color="#34d399" onClick={onBrowse} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ReportSectionCard index={6} color="#f97316" title="Cost by Service Type">
          {donutData.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No data yet.</p> : (
            <div className="flex items-center gap-6 flex-wrap">
              <DonutChart data={donutData} total={formatCurrency(donutTotal)} height={180} />
              <div className="space-y-2 flex-1 min-w-[140px]">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-white/70 capitalize">{d.name}</span>
                    <span className="text-xs font-semibold text-white ml-auto tabular-nums">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard index={7} color="#1ED760" title="Service Status Distribution">
          {statusData.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No data yet.</p> : (
            <div className="flex items-center gap-6 flex-wrap">
              <DonutChart data={statusData} total={statusTotal} height={180} />
              <div className="space-y-2 flex-1 min-w-[140px]">
                {statusData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-white/70">{d.name}</span>
                    <span className="text-xs font-semibold text-white ml-auto tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ReportSectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ReportSectionCard index={8} color="#f97316" title="Maintenance Cost Trend">
          <TrendChart data={trendData} series={[{ key: 'cost', name: 'Cost', color: '#f97316' }]} type="area" height={220} />
        </ReportSectionCard>

        <ReportSectionCard index={9} color="#1ED760" title="Top Vehicles by Maintenance Cost"
          action={<button onClick={onBrowse} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors">View All <ArrowRight className="w-3 h-3" /></button>}>
          {topVehicles.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No data yet.</p> : (
            <div className="space-y-3">
              {topVehicles.map((v) => {
                const pct = maxCost > 0 ? (v.cost / maxCost) * 100 : 0;
                return (
                  <div key={v.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70 truncate flex items-center gap-1.5"><Truck className="w-3 h-3 text-white/40" />{v.name}</span>
                      <span className="text-white/80 tabular-nums">{formatCurrency(v.cost)} · {v.count} svc</span>
                    </div>
                    <ProgressBar pct={pct} color="#1ED760" />
                  </div>
                );
              })}
            </div>
          )}
        </ReportSectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportSectionCard index={10} color="#34d399" title="Upcoming Scheduled Services"
          action={<button onClick={onBrowse} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors">View All <ArrowRight className="w-3 h-3" /></button>}>
          {upcoming.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No upcoming services.</p> : (
            <div className="space-y-1">
              {upcoming.map((r, i) => {
                const tone = TYPE_COLORS[r.service_type] || '#94a3b8';
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.02] rounded-lg px-1 transition-colors" onClick={onBrowse}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(tone, 0.12), border: `1px solid ${hexToRgba(tone, 0.3)}` }}>
                      <CalendarClock className="w-4 h-4" style={{ color: tone }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.vehicle_plate}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{TYPE_LABEL(r.service_type)} · {formatDate(r.next_service_date)}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300">Scheduled</span>
                  </div>
                );
              })}
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard index={11} color="#a855f7" title="Recent Maintenance">
          {recent.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No records yet.</p> : (
            <div className="space-y-1">
              {recent.map((r, i) => {
                const tone = TYPE_COLORS[r.service_type] || '#94a3b8';
                return (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.02] rounded-lg px-1 transition-colors" onClick={onBrowse}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(tone, 0.12), border: `1px solid ${hexToRgba(tone, 0.3)}` }}>
                      <Wrench className="w-4 h-4" style={{ color: tone }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate capitalize">{TYPE_LABEL(r.service_type)} · {r.vehicle_plate}</p>
                      <p className="text-[11px] text-muted-foreground">{r.vendor_name || '—'} · {formatDate(r.date)}</p>
                    </div>
                    <span className="text-xs font-semibold text-white tabular-nums">{formatCurrency(r.cost)}</span>
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