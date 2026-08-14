import { Store, Wrench, Fuel, Shield, Package, Users, TrendingDown, Receipt, Truck } from 'lucide-react';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import ProgressBar from '@/components/reports/ProgressBar';
import TrendChart from '@/components/reports/TrendChart';
import { formatCurrency } from '@/lib/formatters';

const CAT_META = {
  fuel: { icon: Fuel, color: '#1ED760', label: 'Fuel Supplier', insight: 'Fuel expenses and consumption tracked from trip fuel costs.' },
  maintenance: { icon: Wrench, color: '#f59e0b', label: 'Maintenance Provider', insight: 'Service records, repairs, and maintenance spend.' },
  parts: { icon: Package, color: '#a855f7', label: 'Parts Seller', insight: 'Parts purchases and spare spend.' },
  insurance: { icon: Shield, color: '#34d399', label: 'Insurance Provider', insight: 'Insurance premiums and policy costs.' },
  service_provider: { icon: Users, color: '#3b82f6', label: 'Service Provider', insight: 'Supplies drivers or vehicles to your customers.' },
  other: { icon: Store, color: '#94a3b8', label: 'Vendor', insight: 'General vendor spend tracking.' },
};

const PALETTE = ['#1ED760', '#f59e0b', '#a855f7', '#34d399', '#3b82f6', '#ec4899', '#fbbf24', '#94a3b8'];
const SERVICE_LABELS = { oil_change: 'Oil Change', tire: 'Tires', brake: 'Brakes', engine: 'Engine', electrical: 'Electrical', body: 'Body', inspection: 'Inspection', other: 'Other' };

export default function VendorAnalytics({ vendor, expenses = [], services = [] }) {
  const cat = vendor.category || 'other';
  const meta = CAT_META[cat] || CAT_META.other;
  const Icon = meta.icon;

  const allTxns = [
    ...expenses.map((e) => ({ date: e.date, amount: Number(e.amount) || 0, vehicle: e.vehicle_plate, key: e.vehicle_plate || e.description || 'general' })),
    ...services.map((s) => ({ date: s.date, amount: Number(s.cost) || 0, vehicle: s.vehicle_plate, key: s.service_type || 'other' })),
  ];
  const totalSpend = allTxns.reduce((s, t) => s + t.amount, 0);
  const txnCount = allTxns.length;
  const vehicles = new Set(allTxns.map((t) => t.vehicle).filter(Boolean));
  const avg = txnCount ? totalSpend / txnCount : 0;

  // monthly trend (last 6 months)
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('en', { month: 'short' }) });
  }
  const trendData = months.map((m) => ({ label: m.label, spend: allTxns.filter((t) => t.date && t.date.startsWith(m.key)).reduce((s, t) => s + t.amount, 0) }));

  // category-specific breakdown
  let breakdown = [];
  if (cat === 'maintenance') {
    const map = {};
    services.forEach((s) => { const k = SERVICE_LABELS[s.service_type] || s.service_type || 'Other'; map[k] = (map[k] || 0) + (Number(s.cost) || 0); });
    breakdown = Object.entries(map).map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }));
  } else {
    const map = {};
    expenses.forEach((e) => { const k = e.vehicle_plate || e.description || 'General'; map[k] = (map[k] || 0) + (Number(e.amount) || 0); });
    breakdown = Object.entries(map).map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }));
  }
  breakdown.sort((a, b) => b.value - a.value);
  breakdown = breakdown.slice(0, 6);
  const breakdownTotal = breakdown.reduce((s, d) => s + d.value, 0);

  const kpis = [
    { label: 'Total Spend', value: totalSpend, format: formatCurrency, icon: TrendingDown, color: meta.color },
    { label: 'Transactions', value: txnCount, icon: Receipt, color: '#3b82f6' },
    { label: 'Vehicles Touched', value: vehicles.size, icon: Truck, color: '#a855f7' },
    { label: 'Avg / Transaction', value: avg, format: formatCurrency, icon: meta.icon, color: '#34d399' },
  ];

  return (
    <div className="space-y-5">
      {/* category insight banner */}
      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${meta.color}14, transparent)`, border: `1px solid ${meta.color}33` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}1a`, border: `1px solid ${meta.color}55` }}>
          <Icon className="w-5 h-5" style={{ color: meta.color }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{meta.label}</p>
          <p className="text-xs text-white/50">{meta.insight}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => <ReportStatCard key={k.label} index={i} label={k.label} value={k.value} format={k.format} icon={k.icon} color={k.color} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportSectionCard index={1} color={meta.color} title={cat === 'maintenance' ? 'Spend by Service Type' : 'Spend by Vehicle'}>
          {breakdown.length === 0 ? <p className="text-xs text-white/40 py-6 text-center">No data yet.</p> : (
            <div className="space-y-3">
              {breakdown.map((d) => {
                const pct = breakdownTotal > 0 ? (d.value / breakdownTotal) * 100 : 0;
                return (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70 truncate capitalize">{d.name}</span>
                      <span className="text-white/80 tabular-nums">{formatCurrency(d.value)} · {pct.toFixed(0)}%</span>
                    </div>
                    <ProgressBar pct={pct} color={d.color} />
                  </div>
                );
              })}
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard index={2} color="#3b82f6" title="Monthly Spend Trend">
          <TrendChart data={trendData} series={[{ key: 'spend', name: 'Spend', color: meta.color }]} type="area" height={200} />
        </ReportSectionCard>
      </div>
    </div>
  );
}