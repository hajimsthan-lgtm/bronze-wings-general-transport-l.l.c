import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Clock } from 'lucide-react';

export default function SalaryOvertimePicker({ overtimeEntries, selectedIds, onToggle, amounts, onAmountChange }) {
  if (!overtimeEntries || overtimeEntries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/10 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Overtime — This Month</span>
        </div>
        <p className="text-xs text-muted-foreground/50 italic py-1">No pending overtime for this driver</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Overtime — This Month</span>
        <span className="text-[10px] text-muted-foreground/60 ml-auto">edit amount to apply</span>
      </div>
      {overtimeEntries.map((e) => {
        const checked = selectedIds.includes(e.id);
        const amt = amounts?.[e.id] ?? '';
        return (
          <div
            key={e.id}
            onClick={() => onToggle(e.id)}
            className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border ${
              checked ? 'bg-amber-500/10 border-amber-500/30' : 'border-transparent hover:bg-muted/30'
            }`}
          >
            <Checkbox checked={checked} className="mt-0.5 pointer-events-none" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs font-medium text-foreground truncate">{e.description || 'Overtime'}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 flex flex-wrap gap-x-2.5">
                <span>Date: <span className="text-foreground/80 font-medium">{formatDate(e.date)}</span></span>
                <span>Hours: <span className="text-foreground/80 font-medium">{Number(e.hours || 0).toFixed(1)}</span></span>
                <span>Calc: <span className="text-foreground/80 font-medium">{formatCurrency(e.amount)}</span></span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5 flex-shrink-0" onClick={(ev) => ev.stopPropagation()}>
              <Input
                type="number"
                value={amt}
                placeholder="0"
                onChange={(ev) => onAmountChange(e.id, ev.target.value)}
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