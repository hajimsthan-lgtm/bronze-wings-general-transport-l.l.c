import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/formatters';
import { Home, Car, FileText, Wallet, Wrench, Package } from 'lucide-react';

const TYPE_ICON = {
  housing_advance: Home,
  vehicle_loan: Car,
  traffic_fine: FileText,
  salary_advance: Wallet,
  equipment: Wrench,
  other: Package,
};

export default function SalaryDeductionsPicker({ deductions, selectedIds, onToggle, amounts, onAmountChange }) {
  if (!deductions || deductions.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Wallet className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Pending Deductions · FIFO</span>
        <span className="text-[10px] text-muted-foreground/60 ml-auto">edit amount to apply</span>
      </div>
      {deductions.map((d) => {
        const Icon = TYPE_ICON[d.type] || Package;
        const checked = selectedIds.includes(d.id);
        const amt = amounts?.[d.id] ?? d.monthly_deduction;
        return (
          <div
            key={d.id}
            onClick={() => onToggle(d.id)}
            className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border ${
              checked ? 'bg-primary/10 border-primary/30' : 'border-transparent hover:bg-muted/30'
            }`}
          >
            <Checkbox checked={checked} className="mt-0.5 pointer-events-none" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-medium text-foreground truncate">{d.description || d.type}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-2.5">
                <span>Monthly: <span className="text-foreground/80 font-medium">{formatCurrency(d.monthly_deduction)}</span></span>
                <span>Remaining: <span className="text-foreground/80 font-medium">{formatCurrency(d.remaining_balance)}</span></span>
                <span>Months left: <span className="text-foreground/80 font-medium">{d.months_left ?? 0}</span></span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <Input
                type="number"
                value={amt}
                onChange={(e) => onAmountChange(d.id, e.target.value)}
                disabled={!checked}
                className="h-7 w-24 bg-input border-border text-xs text-right tabular-nums"
              />
              <span className="text-[10px] text-muted-foreground">AED</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}