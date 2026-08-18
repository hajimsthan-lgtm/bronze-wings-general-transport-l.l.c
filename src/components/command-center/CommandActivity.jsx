import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, FileText, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

const TRIP_FILTERS = ['All', 'Done', 'Active'];
const INV_FILTERS = ['All', 'Paid', 'Pending'];

const statusColor = (status) => ({
  completed: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  in_transit: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  scheduled: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  cancelled: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  paid: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  draft: 'bg-foreground/5 text-muted-foreground border border-border/30',
  sent: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  overdue: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
  partially_paid: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
}[status] || 'bg-foreground/5 text-muted-foreground border border-border/30');

function FilterPills({ filters, active, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      {filters.map(f => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all',
            active === f ? 'bg-[#00f2c3]/15 text-[#00f2c3] border border-[#00f2c3]/30' : 'text-muted-foreground hover:text-foreground border border-transparent'
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
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 12px -4px rgba(34,211,238,0.4)' }}>
                <Truck className="w-4 h-4 text-cyan-400" />
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
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 12px -4px rgba(168,85,247,0.4)' }}>
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