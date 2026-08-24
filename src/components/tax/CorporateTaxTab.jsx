import { TrendingUp, Receipt, Calculator, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import { formatCurrency } from '@/lib/formatters';
import { CT_THRESHOLD, CT_RATE, SBR_REVENUE_LIMIT } from '@/lib/taxCalculations';

export default function CorporateTaxTab({ ctData }) {
  const remainder = Math.max(0, ctData.taxableProfit - CT_THRESHOLD);

  return (
    <div>
      {/* 3 stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <ReportStatCard
          index={1}
          label="Total Revenue"
          value={ctData.totalRevenue}
          format={formatCurrency}
          icon={TrendingUp}
          color="#22c55e"
        />
        <ReportStatCard
          index={2}
          label="Total Expenses"
          value={ctData.totalExpenses}
          format={formatCurrency}
          icon={Receipt}
          color="#ef4444"
        />
        <ReportStatCard
          index={3}
          label="Taxable Profit"
          value={ctData.taxableProfit}
          format={formatCurrency}
          icon={Calculator}
          color="#f59e0b"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Calculation ladder */}
        <ReportSectionCard index={4} color="#f59e0b" title="Corporate Tax Calculation">
          <div className="space-y-3">
            <LadderStep
              label="Taxable profit"
              value={formatCurrency(ctData.taxableProfit)}
              bold
            />
            <LadderStep
              label={`Less: AED 375,000 (0% threshold)`}
              value={`- ${formatCurrency(CT_THRESHOLD)}`}
              color="text-red-400"
            />
            <LadderStep
              label="Remainder"
              value={formatCurrency(remainder)}
            />
            <LadderStep
              label={`Taxed at ${(CT_RATE * 100).toFixed(0)}%`}
              value={`× ${(CT_RATE * 100).toFixed(0)}%`}
              muted
            />
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Corporate tax due</span>
                <span className="text-lg font-bold text-amber-400 tabular-nums">
                  {formatCurrency(ctData.corporateTaxDue)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border">
            <Info className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              First AED 375,000 of profit is taxed at 0%.
            </p>
          </div>
        </ReportSectionCard>

        {/* Small Business Relief */}
        <ReportSectionCard
          index={5}
          color={ctData.sbrEligible ? '#22c55e' : '#ef4444'}
          title="Small Business Relief"
        >
          <div className="flex flex-col items-center text-center py-4">
            {ctData.sbrEligible ? (
              <>
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-emerald-400 mb-1">Eligible</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Revenue is under the AED 3,000,000 threshold
                </p>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-emerald-300">
                    Corporate tax due: <span className="font-bold">AED 0.00</span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-7 h-7 text-red-400" />
                </div>
                <p className="text-sm font-semibold text-red-400 mb-1">Not eligible</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Revenue exceeds the AED 3,000,000 threshold
                </p>
                <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-300">
                    Standard corporate tax rate applies
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="mt-2 pt-3 border-t border-border">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Revenue limit</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatCurrency(SBR_REVENUE_LIMIT)}
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1.5">
              <span className="text-muted-foreground">Your revenue</span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatCurrency(ctData.totalRevenue)}
              </span>
            </div>
          </div>
        </ReportSectionCard>
      </div>
    </div>
  );
}

function LadderStep({ label, value, bold, color, muted }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${bold ? 'font-bold text-foreground' : muted ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
      <span className={`text-sm tabular-nums ${bold ? 'font-bold text-foreground' : color || 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}