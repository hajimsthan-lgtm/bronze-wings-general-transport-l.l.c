import { Landmark, Wallet, TrendingUp, Calculator, Info } from 'lucide-react';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import TaxFilingTracker from '@/components/tax/TaxFilingTracker';
import { formatCurrency } from '@/lib/formatters';

export default function VatOverviewTab({ vatData, ctData, vatPeriod, fy, filings, filedRecords, daysUntilVatDue, daysUntilCtDue }) {
  return (
    <div>
      {/* Info banner */}
      <div className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-blue-500/8 border border-blue-500/15">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          Figures are calculated automatically from posted invoices and expenses.
        </p>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
          label="Net VAT Payable"
          value={vatData.netVatPayable}
          format={formatCurrency}
          icon={Wallet}
          color="#ef4444"
          extra={
            <span className="text-[10px] text-muted-foreground">
              {daysUntilVatDue > 0 ? `${daysUntilVatDue} days until due` : 'Past due'}
            </span>
          }
        />
        <ReportStatCard
          index={3}
          label="Taxable Profit"
          value={ctData.taxableProfit}
          format={formatCurrency}
          icon={TrendingUp}
          color="#22c55e"
        />
        <ReportStatCard
          index={4}
          label="Corporate Tax Due"
          value={ctData.corporateTaxDue}
          format={formatCurrency}
          icon={Calculator}
          color="#f59e0b"
          extra={
            <span className="text-[10px] text-muted-foreground">
              {daysUntilCtDue > 0 ? `${daysUntilCtDue} days until due` : 'Past due'}
            </span>
          }
        />
      </div>

      {/* Filing tracker */}
      <ReportSectionCard index={5} color="#6366f1" title="FTA Filing Tracker">
        <TaxFilingTracker periods={filings} filedRecords={filedRecords} />
      </ReportSectionCard>
    </div>
  );
}