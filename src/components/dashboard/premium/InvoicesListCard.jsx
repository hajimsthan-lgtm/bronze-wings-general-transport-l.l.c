import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ChevronRight } from 'lucide-react';
import PremiumCard from './PremiumCard';
import SegmentedControl from './SegmentedControl';
import { formatCurrency } from '@/lib/formatters';

const invColor = (s) =>
  s === 'paid' ? '#34d399' : s === 'sent' ? '#1ED760' : s === 'overdue' ? '#f87171' : '#fbbf24';

export default function InvoicesListCard({ invoices }) {
  const [filter, setFilter] = useState('all');
  const filtered = invoices.filter((i) =>
    filter === 'all' ? true : filter === 'paid' ? i.status === 'paid' : i.status !== 'paid'
  );

  return (
    <PremiumCard className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Recent Invoices</h3>
        <SegmentedControl
          options={[{ value: 'all', label: 'All' }, { value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }]}
          value={filter}
          onChange={setFilter}
        />
      </div>
      <div className="flex-1 space-y-1">
        {filtered.length === 0 && <p className="text-sm text-white/40 py-8 text-center">No invoices</p>}
        {filtered.map((inv) => {
          const pct = inv.total_amount ? Math.round(((inv.paid_amount || 0) / inv.total_amount) * 100) : 0;
          return (
            <Link
              key={inv.id}
              to="/admin/clients"
              className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-white/[0.03] group"
            >
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${invColor(inv.status)}1a`, border: `1px solid ${invColor(inv.status)}33` }}
              >
                <FileText className="w-4 h-4" style={{ color: invColor(inv.status) }} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{inv.client_name || '—'}</p>
                <p className="text-[11px] text-white/40 truncate">
                  {inv.invoice_number || '—'} · {(inv.status || '').replace(/_/g, ' ')}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm text-white font-semibold tabular-nums">{formatCurrency(inv.total_amount)}</p>
                <span className="text-[10px] font-semibold tabular-nums" style={{ color: invColor(inv.status) }}>
                  {pct}% paid
                </span>
              </div>
            </Link>
          );
        })}
      </div>
      <Link
        to="/admin/clients"
        className="inline-flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white transition-colors mt-3 self-end"
      >
        View all <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </PremiumCard>
  );
}