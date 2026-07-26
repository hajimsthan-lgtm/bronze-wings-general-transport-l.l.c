import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/formatters';

export default function BreakdownDialog({ open, onOpenChange, title, rows }) {
  const list = rows || [];
  const total = list.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-foreground">{title}</DialogTitle></DialogHeader>
        <div className="space-y-2 mt-2">
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No transactions in this period</p>
          ) : (
            list.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 glass-card p-2.5">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{r.label}</p>
                  {r.sub && <p className="text-xs text-muted-foreground truncate">{r.sub}</p>}
                </div>
                <span className={`text-sm font-semibold tabular-nums whitespace-nowrap ${r.tone || 'text-foreground'}`}>{formatCurrency(r.amount)}</span>
              </div>
            ))
          )}
          <div className="flex items-center justify-between pt-3 mt-1 border-t border-border/50">
            <span className="text-sm font-semibold text-foreground">Total</span>
            <span className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(total)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}