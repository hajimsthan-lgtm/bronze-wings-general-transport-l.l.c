import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Landmark } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import LoadingSpinner from '@/components/common/LoadingSpinner';

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
    <div className="glass-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Landmark className="w-4 h-4 text-primary" /> Govt Fee Pending
        </h2>
        <span className="text-sm font-semibold text-foreground">{formatCurrency(total)}</span>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No pending government fees</p>
      ) : (
        <div className="space-y-2">
          {rows.slice(0, 6).map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.customer_name}</p>
                <p className="text-xs text-muted-foreground">
                  {r.service_type || r.category} · {formatDate(r.service_date)}
                </p>
              </div>
              <span className="text-sm font-semibold text-amber-400">
                {formatCurrency(r.government_fee)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}