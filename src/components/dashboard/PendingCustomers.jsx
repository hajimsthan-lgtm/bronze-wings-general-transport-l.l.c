import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Users } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { computeUserBalances } from '@/lib/accounting';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function PendingCustomers() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Transaction
      .list('-created_date', 300)
      .then((t) => {
        const pending = (t || []).filter(
          (x) => x.payment_status === 'pending' || x.payment_status === 'partial'
        );
        setRows(computeUserBalances(pending));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="glass-card p-4 md:p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" /> Pending Customers
      </h2>
      {loading ? (
        <LoadingSpinner />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No pending customers</p>
      ) : (
        <div className="space-y-2">
          {rows.slice(0, 6).map((r) => (
            <div
              key={r.customer_name}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.customer_name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.count} service{r.count > 1 ? 's' : ''}
                </p>
              </div>
              <span className="text-sm font-semibold text-amber-400">{formatCurrency(r.balance)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}