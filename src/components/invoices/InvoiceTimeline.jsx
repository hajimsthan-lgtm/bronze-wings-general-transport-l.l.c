import { useMemo } from 'react';

export default function InvoiceTimeline({ invoices }) {
  const { arr, max } = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short' });
      const total = invoices
        .filter(inv => {
          if (!inv.issue_date) return false;
          const id = new Date(inv.issue_date);
          return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear();
        })
        .reduce((s, i) => s + (i.total_amount || 0), 0);
      out.push({ label, total });
    }
    return { arr: out, max: Math.max(1, ...out.map(a => a.total)) };
  }, [invoices]);

  return (
    <div className="glass-card rounded-2xl p-5 h-full">
      <p className="text-sm font-semibold text-foreground mb-4">Revenue timeline</p>
      <div className="flex items-end justify-between gap-4 h-32">
        {arr.map(m => (
          <div key={m.label} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-end justify-center h-24">
              <div
                className="w-2/3 rounded-full bg-[#A6FF00]"
                style={{ height: `${Math.max(8, (m.total / max) * 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}