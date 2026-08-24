import { Landmark, ArrowDownLeft, Wallet } from 'lucide-react';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import DonutChart from '@/components/reports/DonutChart';
import TrendChart from '@/components/reports/TrendChart';
import { formatCurrency } from '@/lib/formatters';

export default function VatTab({ vatData, trend }) {
  const donutData = [
    { name: 'Standard-rated (5%)', value: vatData.standardRatedSales, color: '#6366f1' },
    { name: 'Zero-rated', value: vatData.zeroRatedSales, color: '#22c55e' },
    { name: 'Exempt', value: vatData.exemptSales, color: '#f59e0b' },
  ].filter((d) => d.value > 0);

  return (
    <div>
      {/* 3 stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <ReportStatCard
          index={1}
          label="Output VAT Collected"
          value={vatData.outputVat}
          format={formatCurrency}
          icon={Landmark}
          color="#6366f1"
        />
        <ReportStatCard
          index={2}
          label="Input VAT (Reclaimable)"
          value={vatData.inputVat}
          format={formatCurrency}
          icon={ArrowDownLeft}
          color="#3b82f6"
        />
        <ReportStatCard
          index={3}
          label="Net VAT Payable"
          value={vatData.netVatPayable}
          format={formatCurrency}
          icon={Wallet}
          color="#ef4444"
        />
      </div>

      {/* Sales breakdown donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ReportSectionCard index={4} color="#6366f1" title="Sales Breakdown by Rate">
          {donutData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">No sales data for this period.</p>
          ) : (
            <div className="flex items-center gap-6 flex-wrap">
              <DonutChart data={donutData} total={formatCurrency(vatData.totalSales)} height={180} />
              <div className="space-y-2 flex-1 min-w-[140px]">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-muted-foreground">{d.name}</span>
                    <span className="text-xs font-semibold text-foreground ml-auto tabular-nums">
                      {formatCurrency(d.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ReportSectionCard>

        {/* 6-month trend */}
        <ReportSectionCard index={5} color="#3b82f6" title="6-Month VAT Trend">
          <TrendChart
            data={trend}
            series={[
              { key: 'outputVat', name: 'Output VAT', color: '#6366f1' },
              { key: 'inputVat', name: 'Input VAT', color: '#3b82f6' },
            ]}
            type="area"
            height={220}
          />
        </ReportSectionCard>
      </div>
    </div>
  );
}