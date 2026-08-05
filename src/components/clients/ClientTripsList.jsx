import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import { Inbox, CheckCheck, Send, Undo2, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function ClientTripsList({ trips, getTripInvoice, onToggleInvoiceSent, onBulkComplete, onBulkInvoice }) {
  const [selected, setSelected] = useState(new Set());
  const allSelected = trips.length > 0 && selected.size === trips.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggle = (id) => setSelected((prev) => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(trips.map((t) => t.id)));
  const clear = () => setSelected(new Set());

  const runBulk = async (fn) => {
    const sel = trips.filter((t) => selected.has(t.id));
    await fn(sel);
    clear();
  };

  if (trips.length === 0) return <EmptyState icon={Inbox} title="No data" />;

  return (
    <div className="relative space-y-2">
      {/* select-all header */}
      <div className="row-card flex items-center gap-3 !mb-1">
        <Checkbox
          checked={allSelected ? true : someSelected ? 'indeterminate' : false}
          onCheckedChange={toggleAll}
        />
        <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">
          {allSelected ? `All ${trips.length} selected` : `Select all (${trips.length})`}
        </span>
        {selected.size > 0 && (
          <button onClick={clear} className="ml-auto text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="max-h-[440px] overflow-y-auto thin-scroll pr-1 space-y-2">
      {trips.map((trip) => {
        const inv = getTripInvoice(trip.id);
        const hasInvoice = !!inv;
        const checked = selected.has(trip.id);
        return (
          <div key={trip.id} className={`row-card flex items-center gap-3 transition-colors ${checked ? 'border-primary/40' : ''}`}>
            <Checkbox checked={checked} onCheckedChange={() => toggle(trip.id)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{trip.from_location} → {trip.to_location}</p>
              <p className="text-xs text-muted-foreground">{formatDate(trip.trip_date)} · {trip.vehicle_plate} · {trip.driver_name}{trip.contact_person ? ` · ${trip.contact_person}` : ''}</p>
            </div>
            <span className="text-sm font-semibold text-foreground">{formatCurrency(trip.revenue)}</span>
            <StatusBadge status={trip.status} />
            {trip.status === 'completed' && hasInvoice && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                Generated
              </span>
            )}
          </div>
        );
      })}
      </div>

      {/* floating bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky bottom-3 z-30 mt-3 animate-enter-up">
          <div className="glass-card flex items-center gap-2 px-3 py-2.5 flex-wrap" style={{ borderRadius: 16 }}>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-semibold">
              <CheckCheck className="w-3 h-3" /> {selected.size} selected
            </span>
            <div className="h-5 w-px bg-border mx-0.5 hidden sm:block" />
            <button onClick={() => runBulk(onBulkComplete)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors">
              <CheckCheck className="w-3.5 h-3.5" /> Mark Completed
            </button>
            <button onClick={() => runBulk((s) => onBulkInvoice(s, true))} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition-colors">
              <Send className="w-3.5 h-3.5" /> Invoice Sent
            </button>
            <button onClick={() => runBulk((s) => onBulkInvoice(s, false))} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30 hover:bg-slate-500/25 transition-colors">
              <Undo2 className="w-3.5 h-3.5" /> Invoice Not Sent
            </button>
            <button onClick={clear} className="ml-auto text-muted-foreground hover:text-foreground p-1.5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}