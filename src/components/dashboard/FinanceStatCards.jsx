import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Banknote, Landmark, TrendingUp, Clock } from 'lucide-react';
import KpiCard from '@/components/common/KpiCard';
import { formatCurrency } from '@/lib/formatters';
import { computeBalancesFromTransactions, computePeriodStats } from '@/lib/accounting';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function FinanceStatCards({ invoices }) {
  const [cashTxns, setCashTxns] = useState([]);
  const [bankTxns, setBankTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.CashTransaction.list('-created_date', 200),
      base44.entities.BankTransaction.list('-created_date', 200),
    ])
      .then(([c, b]) => {
        setCashTxns(c);
        setBankTxns(b);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const { cash, bank } = computeBalancesFromTransactions(cashTxns, bankTxns);
  const { revenue, outstanding } = computePeriodStats(invoices);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard title="Cash Balance" value={formatCurrency(cash)} icon={Banknote} subtitle="liquidity" />
      <KpiCard title="Bank Balance" value={formatCurrency(bank)} icon={Landmark} subtitle="reconciled" />
      <KpiCard title="Revenue (Paid)" value={formatCurrency(revenue)} icon={TrendingUp} subtitle="invoices" />
      <KpiCard title="Outstanding" value={formatCurrency(outstanding)} icon={Clock} subtitle="unpaid" />
    </div>
  );
}