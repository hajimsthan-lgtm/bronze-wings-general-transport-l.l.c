import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Landmark } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import FinanceCard from './FinanceCard';

export default function GovtFeePendingPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Transaction
      .list('-created_date', 300)
      .then((t) => {
        setRows(
          (t || []).filter(
            (x) => x.govt_fee_status === 'pending' && (x.government_fee || 0) > 0
          )
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const total = rows.reduce((s, r) => s + (r.government_fee || 0), 0);

  return (
    <FinanceCard
      title="Govt Fee Pending"
      subtitle="unpaid government fees"
      icon={Landmark}
      action={
        <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 bg-amber-500/20 border border-amber-500/30 rounded-full">
          {formatCurrency(total)}
        </span>
      }
    >
      {loading ? (
        <div className="p-5"><LoadingSpinner /></div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-white/30 py-8 text-center">No pending government fees</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/[0.015]">
              <tr>
                <th className="text-left text-[10px] font-bold text-white/30 uppercase tracking-widest px-5 py-2.5">Customer</th>
                <th className="text-right text-[10px] font-bold text-white/30 uppercase tracking-widest px-5 py-2.5">Fee</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 6).map((r) => (
                <tr key={r.id} className="border-t border-border/20 hover:bg-primary/[0.03] transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-white truncate">{r.customer_name}</p>
                    <p className="text-[10px] text-white/30">
                      {r.service_type || r.category} · {formatDate(r.service_date)}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-mono font-semibold text-amber-400">
                    {formatCurrency(r.government_fee)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-primary/20 bg-primary/[0.04]">
                <td className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white/60">Total</td>
                <td className="px-5 py-3 text-right text-sm font-mono font-bold text-white">{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </FinanceCard>
  );
}