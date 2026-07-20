import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Users } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { computeUserBalances } from '@/lib/accounting';
import SatinCard from '@/components/common/SatinCard';

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
    <Link to="/payments" className="block group">
      <SatinCard className="p-5 transition-all duration-200 group-hover:border-primary/30">
        <div className="flex items-start justify-between mb-3.5">
          <p className="eyebrow pt-1">Pending Customers</p>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center glass-panel">
            <Users className="w-4 h-4 text-rose-400" />
          </div>
        </div>
        <p className="text-2xl font-bold tracking-tight tabular-nums font-display text-rose-300">
          {loading ? '…' : rows.length}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border border-rose-400/25 bg-rose-400/10 text-rose-300">
            {formatCurrency(total)} due
          </span>
          <span className="text-xs text-muted-foreground">tap to view details</span>
        </div>
      </SatinCard>
    </Link>
  );
}