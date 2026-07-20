import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Banknote, Landmark, TrendingUp, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { computeBalancesFromTransactions, computePeriodStats } from '@/lib/accounting';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import SatinCard from '@/components/common/SatinCard';

const TONES = {
  amber: { value: 'text-amber-300', icon: 'text-amber-300' },
  teal: { value: 'text-teal-300', icon: 'text-teal-300' },
  emerald: { value: 'text-emerald-300', icon: 'text-emerald-300' },
  red: { value: 'text-rose-300', icon: 'text-rose-300' },
};

function StatCard({ icon: Icon, label, value, tone }) {
  const t = TONES[tone];
  return (
    <SatinCard className="p-5">
      <div className="flex items-center justify-between mb-3.5">
        <span className="eyebrow pt-1">{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center glass-panel">
          <Icon className={`w-4 h-4 ${t.icon}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold tracking-tight tabular-nums font-display ${t.value}`}>{value}</p>
    </SatinCard>
  );
}

export default function FinanceStatCards({ invoices }) {
  const [cashTxns, setCashTxns] = useState([]);
  const [bankTxns, setBankTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.CashTransaction.list('-created_date', 200),
      base44.entities.BankTransaction.list('-created_date', 200),
    ])
      .then(([c, b]) => { setCashTxns(c); setBankTxns(b); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const { cash, bank } = computeBalancesFromTransactions(cashTxns, bankTxns);
  const { revenue, outstanding } = computePeriodStats(invoices);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard icon={Banknote} label="Cash Balance" value={formatCurrency(cash)} tone="amber" />
      <StatCard icon={Landmark} label="Bank Balance" value={formatCurrency(bank)} tone="teal" />
      <StatCard icon={TrendingUp} label="Revenue (Paid)" value={formatCurrency(revenue)} tone="emerald" />
      <StatCard icon={Clock} label="Outstanding" value={formatCurrency(outstanding)} tone="red" />
    </div>
  );
}