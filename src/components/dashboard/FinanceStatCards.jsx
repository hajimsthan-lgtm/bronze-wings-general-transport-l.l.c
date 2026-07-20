import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Banknote, Landmark, TrendingUp, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { computeBalancesFromTransactions, computePeriodStats } from '@/lib/accounting';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import SatinCard from '@/components/common/SatinCard';

const TONES = {
  amber: { value: 'text-amber-400', label: 'text-amber-400/60', card: 'bg-amber-500/[0.04] border-amber-500/20' },
  teal: { value: 'text-teal-400', label: 'text-teal-400/60', card: 'bg-teal-500/[0.04] border-teal-500/20' },
  emerald: { value: 'text-emerald-400', label: 'text-emerald-400/60', card: 'bg-emerald-500/[0.04] border-emerald-500/20' },
  red: { value: 'text-red-400', label: 'text-red-400/60', card: 'bg-red-500/[0.04] border-red-500/20' },
};

function StatCard({ icon: Icon, label, value, tone }) {
  const t = TONES[tone];
  return (
    <SatinCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8a8a8a' }}>{label}</span>
        <Icon className={`w-4 h-4 ${t.value}`} />
      </div>
      <p className="text-2xl font-bold" style={{ color: '#f4f4f4', fontFamily: 'Georgia, "Times New Roman", serif' }}>{value}</p>
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
      <StatCard icon={Banknote} label="Cash Balance" value={formatCurrency(cash)} tone="amber" />
      <StatCard icon={Landmark} label="Bank Balance" value={formatCurrency(bank)} tone="teal" />
      <StatCard icon={TrendingUp} label="Revenue (Paid)" value={formatCurrency(revenue)} tone="emerald" />
      <StatCard icon={Clock} label="Outstanding" value={formatCurrency(outstanding)} tone="red" />
    </div>
  );
}