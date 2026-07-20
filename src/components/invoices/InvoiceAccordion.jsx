import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useToast } from '@/components/ui/use-toast';
import {
  ChevronDown, FileText, Copy, Download, Trash2, CheckCircle, Loader2, Calendar, MoreHorizontal, Inbox,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const statusStyles = {
  paid: 'bg-emerald-500/20 text-emerald-400',
  draft: 'bg-amber-500/20 text-amber-400',
  partially_paid: 'bg-orange-500/20 text-orange-400',
  sent: 'bg-blue-500/20 text-blue-400',
  overdue: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-white/10 text-white/50',
};

function StatusPill({ status }) {
  const cls = statusStyles[status] || 'bg-white/10 text-white/50';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function StatPill({ label, value, tone }) {
  return (
    <div className="bg-white/[0.06] rounded-lg px-3 py-1.5 flex flex-col">
      <span className="text-[10px] text-white/40 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-bold tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

export default function InvoiceAccordion({ invoices, onEdit, onDelete, onDownload, downloadingId, onMarkPaid }) {
  const { toast } = useToast();
  const [expandedClients, setExpandedClients] = useState(new Set());
  const [expandedMonths, setExpandedMonths] = useState(new Set());
  const [tripsByClient, setTripsByClient] = useState({});
  const [loadingTrips, setLoadingTrips] = useState({});

  const byClient = {};
  invoices.forEach((inv) => {
    const client = inv.client_name || 'Unknown';
    if (!byClient[client]) byClient[client] = [];
    byClient[client].push(inv);
  });

  const toggleClient = async (clientName) => {
    const next = new Set(expandedClients);
    if (next.has(clientName)) {
      next.delete(clientName);
    } else {
      next.add(clientName);
      if (!tripsByClient[clientName]) {
        setLoadingTrips((prev) => ({ ...prev, [clientName]: true }));
        try {
          const trips = await base44.entities.Trip.filter({ client_name: clientName });
          setTripsByClient((prev) => ({ ...prev, [clientName]: trips || [] }));
        } catch {}
        setLoadingTrips((prev) => ({ ...prev, [clientName]: false }));
      }
    }
    setExpandedClients(next);
  };

  const toggleMonth = (key) => {
    const next = new Set(expandedMonths);
    if (next.has(key)) next.delete(key); else next.add(key);
    setExpandedMonths(next);
  };

  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast({ title: 'Copied!', description: text });
    }
  };

  const getTripNumber = (clientName, tripId) => {
    const trips = tripsByClient[clientName] || [];
    return trips.find((t) => t.id === tripId)?.trip_number;
  };

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Inbox className="w-12 h-12 text-white/30 animate-pulse mb-3" />
        <p className="text-sm text-white/50">No invoices found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Object.entries(byClient).map(([clientName, clientInvoices]) => {
        const isExpanded = expandedClients.has(clientName);
        const outstanding = clientInvoices.filter((i) => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + (i.total_amount || 0), 0);
        const paid = clientInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.total_amount || 0), 0);
        const drafts = clientInvoices.filter((i) => i.status === 'draft').length;

        const byMonth = {};
        clientInvoices.forEach((inv) => {
          if (!inv.issue_date) return;
          const d = new Date(inv.issue_date + 'T00:00');
          const monthKey = String(d.getMonth() + 1).padStart(2, '0') + String(d.getFullYear()).slice(-2);
          if (!byMonth[monthKey]) byMonth[monthKey] = [];
          byMonth[monthKey].push(inv);
        });

        return (
          <div key={clientName} className="glass-card overflow-hidden">
            <button
              onClick={() => toggleClient(clientName)}
              className="flex items-center w-full gap-3 px-4 py-3.5 hover:bg-white/[0.04] transition-colors duration-150"
            >
              <span
                className="w-1.5 flex-shrink-0 self-stretch rounded-full"
                style={{ background: 'linear-gradient(180deg, rgba(59,130,246,0.9) 0%, rgba(45,212,191,0.7) 100%)' }}
              />
              <p className="text-sm font-semibold text-white uppercase tracking-wider truncate font-display flex-1 text-left">
                {clientName}
              </p>
              <div className="hidden sm:flex items-center gap-2">
                <StatPill label="Invoices" value={clientInvoices.length} tone="text-white" />
                <StatPill label="Outstanding" value={formatCurrency(outstanding)} tone="text-amber-400" />
                <StatPill label="Paid" value={formatCurrency(paid)} tone="text-emerald-400" />
                <StatPill label="Drafts" value={drafts} tone="text-white/60" />
              </div>
              <span
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
                  isExpanded ? 'bg-primary/20 text-primary' : 'glass-panel text-muted-foreground'
                }`}
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {/* Mobile stats stacked */}
            <div className="sm:hidden grid grid-cols-2 gap-2 px-4 pb-3">
              <StatPill label="Invoices" value={clientInvoices.length} tone="text-white" />
              <StatPill label="Outstanding" value={formatCurrency(outstanding)} tone="text-amber-400" />
              <StatPill label="Paid" value={formatCurrency(paid)} tone="text-emerald-400" />
              <StatPill label="Drafts" value={drafts} tone="text-white/60" />
            </div>

            {isExpanded && (
              <div className="border-t border-white/[0.06] px-3 py-3 space-y-2 max-h-[60vh] overflow-y-auto thin-scroll">
                {loadingTrips[clientName] ? (
                  <div className="p-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    <span className="text-xs text-muted-foreground">Loading trips...</span>
                  </div>
                ) : (
                  Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0])).map(([monthKey, monthInvoices]) => {
                    const monthExpandedKey = `${clientName}-${monthKey}`;
                    const monthExpanded = expandedMonths.has(monthExpandedKey);
                    const monthTotal = monthInvoices.reduce((s, i) => s + (i.total_amount || 0), 0);

                    const byDay = {};
                    monthInvoices.forEach((inv) => {
                      if (!inv.issue_date) return;
                      if (!byDay[inv.issue_date]) byDay[inv.issue_date] = [];
                      byDay[inv.issue_date].push(inv);
                    });

                    return (
                      <div key={monthKey}>
                        <button
                          onClick={() => toggleMonth(monthExpandedKey)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] border-l-2 border-primary/50 hover:bg-white/[0.06] transition-colors duration-150"
                        >
                          <span className="text-[11px] font-bold text-primary font-mono">
                            INV-{monthKey}-{String(monthInvoices.length).padStart(3, '0')}
                          </span>
                          <span className="text-[11px] text-white/40">{monthInvoices.length} invoices</span>
                          <span className="ml-auto text-sm font-extrabold text-white tabular-nums">
                            {formatCurrency(monthTotal)}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${monthExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {monthExpanded && (
                          <div className="mt-2 space-y-0 rounded-xl bg-white/[0.02] border border-white/[0.05] p-2">
                            {Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])).map(([dayKey, dayInvoices]) => (
                              <div key={dayKey}>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel my-1.5">
                                  <Calendar className="w-3 h-3 text-white/50" />
                                  <span className="text-[10px] font-mono tracking-wider uppercase text-white/50">{formatDate(dayKey)}</span>
                                </div>
                                {dayInvoices.map((inv) => {
                                  const tripNum = inv.trip_id ? getTripNumber(clientName, inv.trip_id) : null;
                                  return (
                                    <div
                                      key={inv.id}
                                      onClick={() => onEdit(inv)}
                                      className="flex items-center gap-3 pl-8 pr-3 py-3.5 bg-white/[0.04] border-l-2 border-primary/30 border-b border-white/[0.06] hover:bg-white/[0.06] cursor-pointer transition-colors duration-150"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                      <span className="text-xs font-semibold text-white/70 hover:text-primary transition-colors">
                                        {inv.invoice_number || '—'}
                                      </span>
                                      <StatusPill status={inv.status} />
                                      {tripNum && (
                                        <button onClick={(e) => { e.stopPropagation(); copyToClipboard(tripNum); }} className="text-[10px] font-mono text-white/40 hover:text-primary transition-colors flex items-center gap-1" title="Copy trip number">
                                          {tripNum} <Copy className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                      <span className="text-sm font-bold text-white tabular-nums ml-auto text-right">{formatCurrency(inv.total_amount)}</span>
                                      {/* Desktop actions */}
                                      <div className="hidden sm:flex items-center gap-1">
                                        <button onClick={(e) => { e.stopPropagation(); onDownload(inv); }} className="text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full p-1.5 transition-colors">
                                          {downloadingId === inv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                        </button>
                                        {inv.status !== 'paid' && (
                                          <button onClick={(e) => { e.stopPropagation(); onMarkPaid(inv); }} className="text-muted-foreground hover:text-emerald-400 hover:bg-white/10 rounded-full p-1.5 transition-colors">
                                            <CheckCircle className="w-4 h-4" />
                                          </button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); onDelete(inv); }} className="text-muted-foreground hover:text-rose-400 hover:bg-white/10 rounded-full p-1.5 transition-colors">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                      {/* Mobile ⋯ menu */}
                                      <div className="sm:hidden">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <button onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-full p-1.5 transition-colors">
                                              <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(inv)}>
                                              <FileText className="w-4 h-4 mr-2" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDownload(inv)}>
                                              <Download className="w-4 h-4 mr-2" /> Download
                                            </DropdownMenuItem>
                                            {inv.status !== 'paid' && (
                                              <DropdownMenuItem onClick={() => onMarkPaid(inv)}>
                                                <CheckCircle className="w-4 h-4 mr-2" /> Mark Paid
                                              </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem onClick={() => onDelete(inv)} className="text-rose-400">
                                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}