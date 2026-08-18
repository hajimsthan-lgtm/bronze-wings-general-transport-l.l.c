import { Store, Layers, TrendingDown, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import ProgressBar from '@/components/reports/ProgressBar';
import TrendChart from '@/components/reports/TrendChart';
import DonutChart from '@/components/reports/DonutChart';
import Sparkline from '@/components/reports/Sparkline';
import ExportButtons from '@/components/common/ExportButtons';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import ResponsiveStats from '@/components/mobile/ResponsiveStats';
import ResponsiveLoading from '@/components/mobile/ResponsiveLoading';

const CAT_COLORS = { fuel: '#1ED760', maintenance: '#f59e0b', parts: '#a855f7', insurance: '#34d399', service_provider: '#3b82f6', other: '#94a3b8' };

export default function VendorsAnalytics({ vendors = [], expenses = [], loading, onAdd, onBrowse }) {
  if (loading && vendors.length === 0) return <ResponsiveLoading type="stat" count={4} />;

  const spendMap = {};
  expenses.forEach((e) => {if (e.vendor_name) spendMap[e.vendor_name] = (spendMap[e.vendor_name] || 0) + (Number(e.amount) || 0);});
  const totalSpend = Object.values(spendMap).reduce((a, b) => a + b, 0);
  const active = vendors.filter((v) => v.status === 'active').length;

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {const d = new Date(now.getFullYear(), now.getMonth() - i, 1);months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('en', { month: 'short' }) });}
  const spendSeries = months.map((m) => expenses.filter((e) => e.date && e.date.startsWith(m.key)).reduce((s, e) => s + (Number(e.amount) || 0), 0));
  const trendData = months.map((m, i) => ({ label: m.label, spend: spendSeries[i] }));

  const topVendors = vendors.map((v) => ({ id: v.id, name: v.name, spend: spendMap[v.name] || 0 })).sort((a, b) => b.spend - a.spend).slice(0, 6);

  const catSpend = {};
  vendors.forEach((v) => {const cat = v.category || 'other';catSpend[cat] = (catSpend[cat] || 0) + (spendMap[v.name] || 0);});
  const donutData = Object.entries(catSpend).filter(([, val]) => val > 0).map(([name, value]) => ({ name, value, color: CAT_COLORS[name] || '#94a3b8' }));
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  const kpis = [
  { label: 'Total Vendors', value: vendors.length, icon: Store, color: '#f59e0b', onClick: onBrowse },
  { label: 'Active', value: active, icon: Store, color: '#34d399', onClick: onBrowse },
  { label: 'Total Spend', value: totalSpend, format: formatCurrency, icon: TrendingDown, color: '#ef4444', extra: <Sparkline data={spendSeries} type="bar" color="#ef4444" />, onClick: onBrowse },
  { label: 'Categories', value: donutData.length, icon: Layers, color: '#a855f7', onClick: onBrowse }];


  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        







        
        <div className="flex items-center gap-2">
          <ExportButtons data={vendors.map((v) => ({ name: v.name, category: v.category, contact: v.contact_person, email: v.email, phone: v.phone, trn: v.trn, status: v.status, spend: spendMap[v.name] || 0 }))} filename="vendors" title="Vendors" columns={[{ label: 'Name', key: 'name' }, { label: 'Category', key: 'category' }, { label: 'Contact', key: 'contact' }, { label: 'Email', key: 'email' }, { label: 'Phone', key: 'phone' }, { label: 'TRN', key: 'trn' }, { label: 'Status', key: 'status' }, { label: 'Spend', key: 'spend', numeric: true }]} />
          {onAdd && <Button onClick={onAdd} className="h-10 hidden md:inline-flex"><Plus className="w-4 h-4 mr-1.5" />Add New</Button>}
        </div>
      </div>

      <ResponsiveStats stats={kpis} desktopGridClass="md:grid-cols-2 lg:grid-cols-4" className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ReportSectionCard index={4} color="#f59e0b" title="Top Vendors by Spend">
          {topVendors.length === 0 || topVendors[0].spend === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No spend data yet.</p> :
          <div className="space-y-3">
              {topVendors.map((v) => {
              const pct = totalSpend > 0 ? v.spend / totalSpend * 100 : 0;
              return (
                <Link key={v.id} to={`/admin/vendors/${v.id}`} className="block group/link hover:opacity-80 transition-opacity">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70 truncate group-hover/link:text-white">{v.name}</span>
                      <span className="text-white/80 tabular-nums">{formatCurrency(v.spend)} · {pct.toFixed(0)}%</span>
                    </div>
                    <ProgressBar pct={pct} color="#f59e0b" />
                  </Link>);

            })}
            </div>
          }
        </ReportSectionCard>

        <ReportSectionCard index={5} color="#a855f7" title="Spend by Category">
          {donutData.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No spend data yet.</p> :
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="flex justify-center"><DonutChart data={donutData} total={formatCurrency(donutTotal)} height={180} /></div>
              <div className="space-y-2.5">
                {donutData.map((d) => {
                const pct = donutTotal > 0 ? d.value / donutTotal * 100 : 0;
                return (
                  <div key={d.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-2 text-white/70 capitalize"><span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />{d.name}</span>
                        <span className="text-white/80 tabular-nums">{formatCurrency(d.value)} · {pct.toFixed(0)}%</span>
                      </div>
                      <ProgressBar pct={pct} color={d.color} />
                    </div>);

              })}
              </div>
            </div>
          }
        </ReportSectionCard>
      </div>

      <ReportSectionCard index={6} color="#ef4444" title="Spend Trend" className="mb-4">
        <TrendChart data={trendData} series={[{ key: 'spend', name: 'Spend', color: '#ef4444' }]} type="area" height={220} />
      </ReportSectionCard>
    </div>);

}