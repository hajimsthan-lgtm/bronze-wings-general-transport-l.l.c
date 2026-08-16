import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, FileText, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

const TRIP_FILTERS = ['All', 'Done', 'Active'];
const INV_FILTERS = ['All', 'Paid', 'Pending'];

const statusColor = (status) => ({
  completed: 'bg-green-500/10 text-green-500',
  in_transit: 'bg-blue-500/10 text-blue-500',
  scheduled: 'bg-amber-500/10 text-amber-500',
  cancelled: 'bg-red-500/10 text-red-500',
  paid: 'bg-green-500/10 text-green-500',
  draft: 'bg-foreground/5 text-muted-foreground',
  sent: 'bg-blue-500/10 text-blue-500',
  overdue: 'bg-red-500/10 text-red-500',
  partially_paid: 'bg-amber-500/10 text-amber-500',
}[status] || 'bg-foreground/5 text-muted-foreground');

function FilterPills({ filters, active, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      {filters.map(f => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all',
            active === f ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

export default function CommandActivity({ recentTrips, recentInvoices }) {
  const [tripFilter, setTripFilter] = useState('All');
  const [invFilter, setInvFilter] = useState('All');

  const filteredTrips = recentTrips.filter(t => {
    if (tripFilter === 'All') return true;
    if (tripFilter === 'Done') return t.status === 'completed';
    return t.status === 'in_transit' || t.status === 'scheduled';
  });

  const filteredInvoices = recentInvoices.filter(i => {
    if (invFilter === 'All') return true;
    if (invFilter === 'Paid') return i.status === 'paid';
    return i.status === 'draft' || i.status === 'sent' || i.status === 'overdue' || i.status === 'partially_paid';
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Recent Trips */}
      <div className="cmd-card animate-enter-up" style={{ animationDelay: '0.8s' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Recent Trips</h3>
          <Link to="/trips" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 transition-colors">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <FilterPills filters={TRIP_FILTERS} active={tripFilter} onChange={setTripFilter} />
        <div className="mt-3 space-y-2">
          {filteredTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No trips</p>
          ) : filteredTrips.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-foreground/[0.03] hover:bg-foreground/[0.05] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Truck className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.trip_number || `${t.from_location} → ${t.to_location}`}</p>
                <p className="text-xs text-muted-foreground truncate">{t.client_name || '—'} · {t.trip_date}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold tabular-nums">{formatCurrency(t.revenue)}</p>
                <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5', statusColor(t.status))}>
                  {t.status?.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="cmd-card animate-enter-up" style={{ animationDelay: '0.88s' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Recent Invoices</h3>
          <Link to="/accounts/invoices" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 transition-colors">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        <FilterPills filters={INV_FILTERS} active={invFilter} onChange={setInvFilter} />
        <div className="mt-3 space-y-2">
          {filteredInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No invoices</p>
          ) : filteredInvoices.map(i => (
            <div key={i.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-foreground/[0.03] hover:bg-foreground/[0.05] transition-colors">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{i.invoice_number || 'Invoice'}</p>
                <p className="text-xs text-muted-foreground truncate">{i.client_name || '—'} · {i.issue_date}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold tabular-nums">{formatCurrency(i.total_amount)}</p>
                <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5', statusColor(i.status))}>
                  {i.status?.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}