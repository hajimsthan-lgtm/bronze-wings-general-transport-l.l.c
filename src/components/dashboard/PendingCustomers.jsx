import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Users } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { computeUserBalances } from '@/lib/accounting';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FinanceCard from './FinanceCard';

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

  const total = rows.reduce((s, r) => s + (r.balance || 0), 0);

  return (
    <FinanceCard
      title="Pending Customers"
      subtitle="outstanding balances"
      icon={Users}
      action={
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-red-400">
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          {rows.length} due
        </span>
      }
    >
      {loading ? (
        <div className="p-5"><LoadingSpinner /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-white/30 py-8 text-center">No pending customers</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/[0.015]">
              <tr>
                <th className="text-left text-[10px] font-bold text-white/30 uppercase tracking-widest px-5 py-2.5">Customer</th>
                <th className="text-right text-[10px] font-bold text-white/30 uppercase tracking-widest px-5 py-2.5">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 6).map((r) => (
                <tr key={r.customer_name} className="border-t border-border/20 hover:bg-primary/[0.03] transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-white truncate">{r.customer_name}</p>
                    <p className="text-[10px] text-white/30">
                      {r.count} service{r.count > 1 ? 's' : ''}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-mono font-semibold text-red-400">
                    {formatCurrency(r.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary/20 bg-primary/[0.04]">
                <td className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/60">Total Pending</td>
                <td className="px-5 py-3 text-right text-sm font-mono font-bold text-white">{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </FinanceCard>
  );
}