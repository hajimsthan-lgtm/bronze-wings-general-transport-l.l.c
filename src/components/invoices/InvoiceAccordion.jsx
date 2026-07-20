import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency, formatDate } from '@/lib/formatters';
import StatusBadge from '@/components/common/StatusBadge';
import { useToast } from '@/components/ui/use-toast';
import { ChevronRight, FileText, Copy, Download, Trash2, CheckCircle, Loader2 } from 'lucide-react';

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

  const Metric = ({ label, value, tone }) => (
    <div className="px-4 py-2 flex flex-col justify-center text-center min-w-[68px]">
      <span className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold mt-1 tabular-nums font-display ${tone}`}>{value}</span>
    </div>
  );

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
          <div key={clientName} className="glass-card-hover overflow-hidden">
            <button
              onClick={() => toggleClient(clientName)}
              className="flex items-center w-full gap-3 px-3 py-3"
            >
              <span
                className="w-1.5 flex-shrink-0 self-stretch rounded-full"
                style={{ background: 'linear-gradient(180deg, rgba(59,130,246,0.9) 0%, rgba(45,212,191,0.7) 100%)' }}
              />
              <p className="text-sm font-semibold text-foreground uppercase tracking-wider truncate font-display flex-1 text-left">
                {clientName}
              </p>
              <div className="hidden sm:flex items-stretch rounded-xl overflow-hidden glass-panel">
                <Metric label="Invoices" value={clientInvoices.length} tone="text-foreground" />
                <span className="w-px bg-white/10 my-2.5" />
                <Metric label="Outstanding" value={formatCurrency(outstanding)} tone="text-amber-300" />
                <span className="w-px bg-white/10 my-2.5" />
                <Metric label="Paid" value={formatCurrency(paid)} tone="text-emerald-300" />
                <span className="w-px bg-white/10 my-2.5" />
                <Metric label="Drafts" value={drafts} tone="text-foreground" />
              </div>
              <span
                className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 ${
                  isExpanded ? 'bg-primary/20 text-primary' : 'glass-panel text-muted-foreground'
                }`}
              >
                <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
              </span>
            </button>

            {/* Mobile metrics */}
            <div className="sm:hidden grid grid-cols-4 gap-px px-3 pb-3 glass-panel mx-3 rounded-xl overflow-hidden">
              <Metric label="Inv" value={clientInvoices.length} tone="text-foreground" />
              <Metric label="Out" value={formatCurrency(outstanding)} tone="text-amber-300" />
              <Metric label="Paid" value={formatCurrency(paid)} tone="text-emerald-300" />
              <Metric label="Drafts" value={drafts} tone="text-foreground" />
            </div>

            {isExpanded && (
              <div className="border-t border-white/[0.06] px-3 py-3 space-y-2">
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
                          className="w-full flex items-center gap-2 p-2 rounded-full glass-panel hover:border-white/20 transition-all duration-200"
                        >
                          <span className="px-3 py-1 rounded-full text-[11px] font-mono text-muted-foreground bg-white/[0.04]">
                            INV-{monthKey}-{String(monthInvoices.length).padStart(3, '0')}
                          </span>
                          <span className="px-3 py-1 rounded-full text-[11px] font-medium text-muted-foreground bg-white/[0.04]">
                            {monthInvoices.length} invoices
                          </span>
                          <span className="px-3 py-1 rounded-full text-[11px] font-semibold text-foreground bg-white/[0.04] tabular-nums">
                            {formatCurrency(monthTotal)}
                          </span>
                          <span
                            className={`ml-auto flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ${
                              monthExpanded ? 'bg-primary/20 text-primary' : 'bg-white/[0.04] text-muted-foreground'
                            }`}
                          >
                            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${monthExpanded ? 'rotate-90' : ''}`} />
                          </span>
                        </button>

                        {monthExpanded && (
                          <div className="mt-2 space-y-1 rounded-xl bg-white/[0.02] border border-white/[0.05] p-2">
                            {Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])).map(([dayKey, dayInvoices]) => (
                              <div key={dayKey}>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel my-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                                  <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground">{formatDate(dayKey)}</span>
                                </div>
                                {dayInvoices.map((inv) => {
                                  const tripNum = inv.trip_id ? getTripNumber(clientName, inv.trip_id) : null;
                                  return (
                                    <div
                                      key={inv.id}
                                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                      <button onClick={() => onEdit(inv)} className="text-xs font-medium text-foreground hover:text-primary transition-colors">
                                        {inv.invoice_number || '—'}
                                      </button>
                                      <StatusBadge status={inv.status} />
                                      {tripNum && (
                                        <button onClick={() => copyToClipboard(tripNum)} className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1" title="Copy trip number">
                                          {tripNum} <Copy className="w-2.5 h-2.5" />
                                        </button>
                                      )}
                                      <span className="text-xs text-muted-foreground ml-auto tabular-nums">{formatCurrency(inv.total_amount)}</span>
                                      <div className="flex items-center gap-1">
                                        <button onClick={() => onDownload(inv)} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
                                          {downloadingId === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                        </button>
                                        {inv.status !== 'paid' && (
                                          <button onClick={() => onMarkPaid(inv)} className="text-muted-foreground hover:text-emerald-400 p-1 transition-colors">
                                            <CheckCircle className="w-3 h-3" />
                                          </button>
                                        )}
                                        <button onClick={() => onDelete(inv)} className="text-muted-foreground hover:text-rose-400 p-1 transition-colors">
                                          <Trash2 className="w-3 h-3" />
                                        </button>
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