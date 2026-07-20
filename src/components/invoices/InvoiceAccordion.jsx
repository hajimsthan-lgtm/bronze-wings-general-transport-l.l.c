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
    if (next.has(key)) next.delete(key);else
    next.add(key);
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

  return (
    <div className="space-y-2">
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
          <div key={clientName} className="mb-4 w-full rounded-xl overflow-hidden shadow-[0_10px_30px_-8px_rgba(0,0,0,0.55)]" style={{ background: '#151921' }}>
            <button onClick={() => toggleClient(clientName)} className="flex items-stretch w-full transition-colors">
              <span className="w-1.5 flex-shrink-0 my-3 mx-2 rounded-full" style={{ background: 'linear-gradient(180deg, #007BFF 0%, #00C4A7 100%)' }} />
              <div className="flex items-center px-2 py-3.5 min-w-0 flex-1">
                <p className="text-sm font-semibold text-white uppercase tracking-wider truncate">{clientName}</p>
              </div>
              <div className="flex items-stretch my-2.5 mr-2.5 rounded-lg overflow-hidden" style={{ background: '#0A0D12' }}>
                <div className="px-4 py-2 flex flex-col justify-center text-center min-w-[64px]">
                  <span className="text-base font-bold text-white leading-none">{clientInvoices.length}</span>
                  <span className="text-[9px] text-[#8892B0] uppercase tracking-wide mt-1.5">Invoices</span>
                </div>
                <span className="w-px bg-white/10 my-2.5" />
                <div className="px-4 py-2 flex flex-col justify-center text-right min-w-[96px]">
                  <span className="text-[9px] text-[#8892B0] uppercase tracking-wide">Outstanding</span>
                  <span className="text-sm font-semibold text-amber-400 mt-1">{formatCurrency(outstanding)}</span>
                </div>
                <span className="w-px bg-white/10 my-2.5" />
                <div className="px-4 py-2 flex flex-col justify-center text-right min-w-[80px]">
                  <span className="text-[9px] text-[#8892B0] uppercase tracking-wide">Paid</span>
                  <span className="text-sm font-semibold text-emerald-400 mt-1">{formatCurrency(paid)}</span>
                </div>
                <span className="w-px bg-white/10 my-2.5" />
                <div className="px-4 py-2 flex flex-col justify-center text-right min-w-[60px]">
                  <span className="text-[9px] text-[#8892B0] uppercase tracking-wide">Drafts</span>
                  <span className="text-sm font-semibold text-white mt-1">{drafts}</span>
                </div>
              </div>
              <div className="flex items-center pr-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: '#007BFF' }}>
                  <ChevronRight className={`w-4 h-4 text-white transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                </span>
              </div>
            </button>

            {isExpanded &&
            <div className="border-t border-white/[0.04] bg-slate-950/30">
                {loadingTrips[clientName] ?
              <div className="p-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    <span className="text-xs text-muted-foreground">Loading trips...</span>
                  </div> :
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
                  <div key={monthKey} className="ml-4">
                      <button onClick={() => toggleMonth(monthExpandedKey)} className="w-full flex items-center gap-2 p-2 rounded-full text-left transition-shadow" style={{ background: '#262627', boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.5), inset -3px -3px 6px rgba(255,255,255,0.03)' }}>
                        <span className="px-3 py-1.5 rounded-full text-xs font-mono" style={{ background: '#1a1a1a', color: '#a5aab0', boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.6)' }}>
                          INV-{monthKey}-{String(monthInvoices.length).padStart(3, '0')}
                        </span>
                        <span className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: '#7f8489', color: '#a5aab0' }}>
                          {monthInvoices.length} invoices
                        </span>
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: '#7f8489', color: '#a5aab0' }}>
                          {formatCurrency(monthTotal)}
                        </span>
                        <span className="ml-auto flex items-center justify-center w-8 h-8 rounded-full transition-all" style={{ background: '#262627', boxShadow: monthExpanded ? 'inset -2px -2px 5px rgba(0,242,255,0.5), inset 2px 2px 4px rgba(0,0,0,0.5)' : 'inset -2px -2px 4px rgba(0,242,255,0.25), inset 2px 2px 4px rgba(0,0,0,0.5)' }}>
                          <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${monthExpanded ? 'rotate-90' : ''}`} style={{ color: '#a5aab0' }} />
                        </span>
                      </button>

                      {monthExpanded &&
                    <div className="mt-2 space-y-2 rounded-xl px-1 pb-1" style={{ background: '#1a1a1a', boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.5), inset -2px -2px 6px rgba(255,255,255,0.02)' }}>
                          {Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])).map(([dayKey, dayInvoices]) =>
                      <div key={dayKey} className="ml-3 mr-3">
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full my-2" style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#32CD32', boxShadow: '0 0 6px rgba(50,205,50,0.6)' }} />
                                <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: '#A9A9A9' }}>{formatDate(dayKey)}</span>
                              </div>
                              {dayInvoices.map((inv) => {
                          const tripNum = inv.trip_id ? getTripNumber(clientName, inv.trip_id) : null;
                          return (
                            <div key={inv.id} className="flex items-center gap-3 px-3 py-2 border-t transition-colors hover:bg-white/[0.04]" style={{ borderColor: '#333333' }}>
                                    <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                    <button onClick={() => onEdit(inv)} className="text-xs font-medium text-foreground hover:text-primary transition-colors">
                                      {inv.invoice_number || '—'}
                                    </button>
                                    <StatusBadge status={inv.status} />
                                    {tripNum &&
                              <button onClick={() => copyToClipboard(tripNum)} className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1" title="Copy trip number">
                                        {tripNum} <Copy className="w-2.5 h-2.5" />
                                      </button>
                              }
                                    <span className="text-xs text-muted-foreground ml-auto">{formatCurrency(inv.total_amount)}</span>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => onDownload(inv)} className="text-muted-foreground hover:text-foreground p-1">
                                        {downloadingId === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                      </button>
                                      {inv.status !== 'paid' &&
                                <button onClick={() => onMarkPaid(inv)} className="text-muted-foreground hover:text-green-400 p-1">
                                          <CheckCircle className="w-3 h-3" />
                                        </button>
                                }
                                      <button onClick={() => onDelete(inv)} className="text-muted-foreground hover:text-red-400 p-1">
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>);

                        })}
                            </div>
                      )}
                        </div>
                    }
                    </div>);

              })}
              </div>
            }
          </div>);

      })}
    </div>);

}