import { Wallet, CheckCircle } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency } from '@/lib/formatters';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthIndex = (m) => {const i = MONTHS.indexOf(m);return i === -1 ? 0 : i;};

export default function DriverOutstandingPayments({ salaries = [], onMarkPaid, busyId }) {
  const outstanding = salaries.
  filter((r) => r.status !== 'paid').
  sort((a, b) => Number(a.year) - Number(b.year) || monthIndex(a.month) - monthIndex(b.month));
  const total = outstanding.reduce((s, r) => s + (Number(r.net_salary) || 0), 0);

  if (outstanding.length === 0) {
    return null;










  }

  return (
    <div className="glass-card p-4 mb-4" style={{ borderLeft: '3px solid rgba(245,158,11,0.55)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Outstanding Payments</p>
            <p className="text-[10px] text-muted-foreground">{outstanding.length} unpaid · {formatCurrency(total)} due</p>
          </div>
        </div>
        <span className="text-[10px] text-amber-400/80 uppercase tracking-wider font-medium">Shown at salary time</span>
      </div>
      <div className="space-y-1.5">
        {outstanding.map((r) =>
        <div key={r.id} className="flex items-center gap-3 rounded-lg px-2.5 py-2 bg-amber-500/[0.06] border border-amber-500/15">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{r.month} {r.year}</p>
              <p className="text-[10px] text-muted-foreground capitalize">{(r.payment_method || '').replace(/_/g, ' ')}{r.payment_date ? ` · ${r.payment_date}` : ''}</p>
            </div>
            <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(r.net_salary)}</span>
            <StatusBadge status={r.status} />
            {onMarkPaid &&
          <button
            title="Mark Paid"
            onClick={() => onMarkPaid(r)}
            disabled={busyId === r.id}
            className="p-1.5 rounded-lg hover:bg-emerald-500/15 text-emerald-400 transition-colors disabled:opacity-50">
            
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
          }
          </div>
        )}
      </div>
    </div>);

}