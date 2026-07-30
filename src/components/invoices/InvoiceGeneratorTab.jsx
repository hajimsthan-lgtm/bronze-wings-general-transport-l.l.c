import { useState, useEffect, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadInvoicePDF } from '@/lib/invoiceHtml';
import ExportButtons from '@/components/common/ExportButtons';
import { FileText, Download, Send, Trash2, Zap, Truck, AlertCircle, CheckCheck, Layers, AlertTriangle, Clock, Calendar, CheckCircle2, Plus, Wallet, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const pad = (n) => String(n).padStart(4, '0');
const SCROLL_H = 'max-h-[440px] overflow-y-auto thin-scroll pr-1';

const dueFromTerms = (terms) => {
  const m = String(terms || '').match(/(\d+)/);
  const days = m ? parseInt(m[1], 10) : 30;
  const d = new Date();
  d.setDate(d.getDate() + (days || 30));
  return d.toISOString().split('T')[0];
};

const flagInfo = (inv, clientAdvance) => {
  const balance = (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0);
  const paid = Number(inv.paid_amount) || 0;
  if (inv.status === 'paid' || balance <= 0.001) return { rank: 4, key: 'paid', label: 'Paid', color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.4)', Icon: CheckCircle2 };
  if (paid > 0) return { rank: 1, key: 'partial', label: 'Partial', color: '#fbbf24', bg: 'rgba(251,191,36,0.16)', border: 'rgba(251,191,36,0.45)', Icon: DollarSign };
  if (clientAdvance > 0) return { rank: 2, key: 'advance', label: 'Advance', color: '#22d3ee', bg: 'rgba(34,211,238,0.14)', border: 'rgba(34,211,238,0.4)', Icon: Wallet };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = inv.due_date ? new Date(inv.due_date) : null;
  if (!due) return { rank: 3, key: 'open', label: 'Unpaid', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)', Icon: Clock };
  const days = Math.ceil((due - today) / 86400000);
  if (days < 0) return { rank: 0, key: 'overdue', label: `Overdue · ${Math.abs(days)}d`, color: '#f87171', bg: 'rgba(248,113,113,0.16)', border: 'rgba(248,113,113,0.45)', Icon: AlertTriangle, pulse: true };
  if (days <= 3) return { rank: 1, key: 'soon', label: days === 0 ? 'Due today' : `Due in ${days}d`, color: '#fbbf24', bg: 'rgba(251,191,36,0.16)', border: 'rgba(251,191,36,0.45)', Icon: Clock };
  return { rank: 3, key: 'open', label: `Due ${formatDate(inv.due_date)}`, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)', Icon: Calendar };
};

export default function InvoiceGeneratorTab({ client, trips, invoices, payments, onInvoicesChanged, onNewInvoice, onEditInvoice, clientInvoiceSeq }) {
  const { t } = useI18n();
  const [allInvoices, setAllInvoices] = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [selectedTrips, setSelectedTrips] = useState(new Set());
  const [selectedInv, setSelectedInv] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [genMode, setGenMode] = useState('single');
  const [progress, setProgress] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingAll(true);
    base44.entities.Invoice.list('-created_date', 1000)
      .then((r) => { if (!cancelled) setAllInvoices(r || []); })
      .catch(() => { if (!cancelled) setAllInvoices([]); })
      .finally(() => { if (!cancelled) setLoadingAll(false); });
    return () => { cancelled = true; };
  }, [invoices.length]);

  const tripInvoiceMap = useMemo(() => {
    const m = {};
    (invoices || []).forEach((inv) => {
      if (inv.trip_id) String(inv.trip_id).split(',').forEach((tid) => { const id = tid.trim(); if (id) m[id] = inv.id; });
    });
    return m;
  }, [invoices]);

  const billableTrips = useMemo(
    () => (trips || []).filter((tr) => tr.status === 'completed' && !tripInvoiceMap[tr.id])
      .sort((a, b) => String(b.trip_date || '').localeCompare(String(a.trip_date || ''))),
    [trips, tripInvoiceMap]
  );

  const tripInvoiceInfo = useMemo(() => {
    const m = {};
    (invoices || []).forEach((inv) => {
      if (inv.trip_id) String(inv.trip_id).split(',').forEach((tid) => { const id = tid.trim(); if (id) m[id] = { number: inv.invoice_number, status: inv.status }; });
    });
    return m;
  }, [invoices]);

  const clientAdvance = useMemo(
    () => (payments || []).filter(p => p.status !== 'pending').reduce((s, p) => s + (Number(p.unapplied_balance) || 0), 0),
    [payments]
  );

  const nextStart = useMemo(() => {
    let max = 0;
    allInvoices.forEach((inv) => {
      const n = parseInt(String(inv.invoice_number || '').replace(/\D/g, ''), 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return max + 1;
  }, [allInvoices]);

  const allInvoicesSorted = useMemo(
    () => (invoices || []).filter(inv => inv.status !== 'cancelled').sort((a, b) => {
      const r = flagInfo(a, clientAdvance).rank - flagInfo(b, clientAdvance).rank;
      if (r !== 0) return r;
      return String(b.created_date || '').localeCompare(String(a.created_date || ''));
    }),
    [invoices, clientAdvance]
  );

  const flagCounts = allInvoicesSorted.reduce((acc, inv) => { const k = flagInfo(inv, clientAdvance).key; acc[k] = (acc[k] || 0) + 1; return acc; }, { overdue: 0, soon: 0, partial: 0, advance: 0, open: 0, paid: 0 });

  const buildInvoice = (trip, number) => {
    const revenue = Number(trip.revenue) || 0;
    const vatRate = 5;
    const vatAmount = Math.round(revenue * vatRate * 100) / 100;
    const total = Math.round((revenue + vatAmount) * 100) / 100;
    return {
      invoice_number: number, client_name: client.name,
      contact_person: trip.contact_person || client.contact_person || '',
      client_email: client.email || '', client_phone: client.phone || '',
      client_address: client.address || '', client_trn: client.trn || '',
      status: 'draft', issue_date: new Date().toISOString().split('T')[0],
      due_date: dueFromTerms(client.payment_terms),
      subtotal: revenue, vat_rate: vatRate, vat_amount: vatAmount,
      total_amount: total, paid_amount: 0, currency: 'AED',
      line_items: [{ description: `${trip.from_location} → ${trip.to_location}`, date: trip.trip_date, quantity: 1, unit_price: revenue, amount: revenue }],
      trip_id: trip.id, notes: trip.trip_number ? `Trip ${trip.trip_number}` : '',
      payment_terms: client.payment_terms || 'Net 30',
    };
  };

  const buildBulkInvoice = (selected, number) => {
    const items = selected.map((tr) => ({
      description: `${tr.from_location} → ${tr.to_location}`, date: tr.trip_date,
      quantity: 1, unit_price: Number(tr.revenue) || 0, amount: Number(tr.revenue) || 0,
    }));
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const vatRate = 5;
    const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
    const total = Math.round((subtotal + vatAmount) * 100) / 100;
    const tripNumbers = selected.map((tr) => tr.trip_number).filter(Boolean);
    return {
      invoice_number: number, client_name: client.name, contact_person: client.contact_person || '',
      client_email: client.email || '', client_phone: client.phone || '',
      client_address: client.address || '', client_trn: client.trn || '',
      status: 'draft', issue_date: new Date().toISOString().split('T')[0],
      due_date: dueFromTerms(client.payment_terms),
      subtotal, vat_rate: vatRate, vat_amount: vatAmount,
      total_amount: total, paid_amount: 0, currency: 'AED',
      line_items: items, trip_id: selected.map((tr) => tr.id).join(','),
      notes: tripNumbers.length ? `Trips: ${tripNumbers.join(', ')}` : `Bulk invoice — ${selected.length} trips`,
      payment_terms: client.payment_terms || 'Net 30',
    };
  };

  // Chunked generation — creates invoices in batches of 10 to avoid UI freeze
  const generate = async () => {
    if (selectedTrips.size === 0 || busy) return;
    setBusy(true);
    setProgress('');
    try {
      const selected = billableTrips.filter((tr) => selectedTrips.has(tr.id));
      if (genMode === 'bulk') {
        await base44.entities.Invoice.create(buildBulkInvoice(selected, pad(nextStart)));
      } else {
        const toCreate = selected.map((tr, i) => buildInvoice(tr, pad(nextStart + i)));
        const BATCH = 10;
        for (let i = 0; i < toCreate.length; i += BATCH) {
          const chunk = toCreate.slice(i, i + BATCH);
          await base44.entities.Invoice.bulkCreate(chunk);
          setProgress(`${Math.min(i + BATCH, toCreate.length)}/${toCreate.length}`);
          await new Promise((r) => setTimeout(r, 30));
        }
      }
      setSelectedTrips(new Set());
      setProgress('');
      onInvoicesChanged();
    } finally { setBusy(false); setProgress(''); }
  };

  const allBillableSelected = billableTrips.length > 0 && billableTrips.every((tr) => selectedTrips.has(tr.id));
  const someBillableSelected = selectedTrips.size > 0 && !allBillableSelected;
  const toggleAllBillable = () => setSelectedTrips(allBillableSelected ? new Set() : new Set(billableTrips.map((tr) => tr.id)));
  const toggleTrip = (id) => setSelectedTrips((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const allInvSelected = allInvoicesSorted.length > 0 && allInvoicesSorted.every((inv) => selectedInv.has(inv.id));
  const someInvSelected = selectedInv.size > 0 && !allInvSelected;
  const toggleAllInv = () => setSelectedInv(allInvSelected ? new Set() : new Set(allInvoicesSorted.map((inv) => inv.id)));
  const toggleInv = (id) => setSelectedInv((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const bulkMarkSent = async () => {
    const ids = [...selectedInv];
    if (!ids.length || busy) return;
    setBusy(true);
    try {
      const BATCH = 25;
      for (let i = 0; i < ids.length; i += BATCH) {
        await base44.entities.Invoice.bulkUpdate(ids.slice(i, i + BATCH).map((id) => ({ id, status: 'sent' })));
        setProgress(`${Math.min(i + BATCH, ids.length)}/${ids.length}`);
      }
      setSelectedInv(new Set());
      onInvoicesChanged();
    } finally { setBusy(false); setProgress(''); }
  };

  const bulkDownload = async () => {
    const ids = [...selectedInv];
    if (!ids.length || busy) return;
    setBusy(true);
    try {
      const settings = await getCompanySettings();
      const list = allInvoicesSorted.filter((i) => selectedInv.has(i.id));
      for (let i = 0; i < list.length; i++) {
        setProgress(`${i + 1}/${list.length}`);
        await downloadInvoicePDF(list[i], client.name, settings, clientInvoiceSeq?.[list[i].id]);
        if (i < list.length - 1) await new Promise((r) => setTimeout(r, 60));
      }
    } finally { setBusy(false); setProgress(''); }
  };

  const bulkDelete = async () => {
    const ids = [...selectedInv];
    if (!ids.length || busy) return;
    setBusy(true);
    try {
      const BATCH = 25;
      for (let i = 0; i < ids.length; i += BATCH) {
        await Promise.all(ids.slice(i, i + BATCH).map((id) => base44.entities.Invoice.delete(id).catch(() => null)));
        setProgress(`${Math.min(i + BATCH, ids.length)}/${ids.length}`);
      }
      setSelectedInv(new Set());
      onInvoicesChanged();
    } finally { setBusy(false); setProgress(''); }
  };

  const invExportCols = [
    { label: 'Invoice #', key: 'invoice_number' }, { label: 'Issue Date', key: 'issue_date' },
    { label: 'Due Date', key: 'due_date' }, { label: 'Status', key: 'status' },
    { label: 'Total', key: 'total_amount', numeric: true }, { label: 'Paid', key: 'paid_amount', numeric: true },
  ];

  return (
    <div className="space-y-5">
      {/* ===== Invoice Generator ===== */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center"><Zap className="w-4 h-4 text-primary" /></div>
            <div>
              <p className="text-sm font-semibold text-foreground">Invoice Generator</p>
              <p className="text-[11px] text-muted-foreground">{billableTrips.length} billable trip{billableTrips.length === 1 ? '' : 's'} · next # {loadingAll ? '…' : pad(nextStart)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex p-0.5 rounded-lg bg-background/40 border border-white/10">
              <button type="button" onClick={() => setGenMode('single')} className={cn('px-3 h-8 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5', genMode === 'single' ? 'bg-primary/20 text-foreground border border-primary/40' : 'text-muted-foreground hover:text-foreground')}><Zap className="w-3 h-3" /> Single</button>
              <button type="button" onClick={() => setGenMode('bulk')} className={cn('px-3 h-8 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5', genMode === 'bulk' ? 'bg-primary/20 text-foreground border border-primary/40' : 'text-muted-foreground hover:text-foreground')}><Layers className="w-3 h-3" /> Bulk</button>
            </div>
            {onNewInvoice && (
              <Button onClick={onNewInvoice} variant="outline" size="sm" className="h-9 border-border">
                <Plus className="w-3.5 h-3.5 mr-1" /> Manual
              </Button>
            )}
            <Button onClick={generate} disabled={busy || selectedTrips.size === 0} className="bg-primary hover:bg-primary/90 h-9">
              {genMode === 'bulk' ? <Layers className="w-3.5 h-3.5 mr-1.5" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
              {genMode === 'bulk' ? `Generate Bulk${selectedTrips.size > 1 ? ` (${selectedTrips.size})` : ''}` : `Generate${selectedTrips.size > 1 ? ` (${selectedTrips.size})` : ''}`}
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mb-3">{genMode === 'bulk' ? 'Bulk mode — all selected trips are combined into a single invoice.' : 'Single mode — one invoice per selected trip.'}</p>
        {busy && progress && <p className="text-[11px] text-primary mb-2 font-medium animate-pulse">Processing {progress}…</p>}

        {billableTrips.length === 0 ? (
          <EmptyState icon={Truck} title="No billable trips" description="Completed trips without invoices will appear here." />
        ) : (
          <div className="space-y-1.5">
            {/* select-all header row */}
            <div className="row-card flex items-center gap-3 !mb-1 !py-2">
              <Checkbox checked={allBillableSelected ? true : someBillableSelected ? 'indeterminate' : false} onCheckedChange={toggleAllBillable} id="gen-all" />
              <label htmlFor="gen-all" className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium cursor-pointer">
                {allBillableSelected ? `All ${billableTrips.length} selected` : `Select all billable (${billableTrips.length})`}
              </label>
              {selectedTrips.size > 0 && (
                <span className="ml-auto text-[11px] text-primary font-semibold">{selectedTrips.size} selected</span>
              )}
            </div>
            {/* scrollable billable trips list */}
            <div ref={scrollRef} className={SCROLL_H}>
              {billableTrips.map((tr) => {
                const checked = selectedTrips.has(tr.id);
                return (
                  <div key={tr.id} onClick={() => toggleTrip(tr.id)} className={`row-card flex items-center gap-3 cursor-pointer transition-colors ${checked ? 'border-primary/40' : ''}`}>
                    <Checkbox checked={checked} onCheckedChange={() => toggleTrip(tr.id)} onClick={(e) => e.stopPropagation()} />
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Truck className="w-4 h-4 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tr.from_location} → {tr.to_location}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tr.trip_date)} · {tr.vehicle_plate} · {tr.driver_name}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(tr.revenue)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== Invoices & Follow-up (merged) ===== */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center"><AlertCircle className="w-4 h-4 text-amber-400" /></div>
            <div>
              <p className="text-sm font-semibold text-foreground">Invoices</p>
              <p className="text-[11px] text-muted-foreground">{allInvoicesSorted.length} total{clientAdvance > 0 ? ` · ${formatCurrency(clientAdvance)} advance available` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ExportButtons data={allInvoicesSorted} filename={`invoices-${client.name}`} title={`Invoices - ${client.name}`} columns={invExportCols} />
          </div>
        </div>

        {/* flag summary strip */}
        {allInvoicesSorted.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {[{ key: 'overdue', label: 'Overdue', color: '#f87171' },{ key: 'soon', label: 'Due Soon', color: '#fbbf24' },{ key: 'partial', label: 'Partial', color: '#fbbf24' },{ key: 'advance', label: 'Advance', color: '#22d3ee' },{ key: 'open', label: 'Unpaid', color: '#60a5fa' },{ key: 'paid', label: 'Paid', color: '#34d399' }].map((s) => flagCounts[s.key] > 0 && (
              <div key={s.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: `${s.color}1f`, border: `1px solid ${s.color}55`, color: s.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                {s.label} {flagCounts[s.key]}
              </div>
            ))}
          </div>
        )}

        {/* bulk action bar */}
        {selectedInv.size > 0 && (
          <div className="flex items-center gap-2 mb-3 animate-enter-up">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-semibold">
              <CheckCheck className="w-3 h-3" /> {selectedInv.size} selected
            </span>
            <button onClick={bulkMarkSent} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 hover:bg-sky-500/25 transition-colors disabled:opacity-50">
              <Send className="w-3.5 h-3.5" /> Mark Sent {progress && busy ? progress : ''}
            </button>
            <button onClick={bulkDownload} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors disabled:opacity-50">
              <Download className="w-3.5 h-3.5" /> {busy && progress ? progress : 'Download PDF'}
            </button>
            <button onClick={bulkDelete} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25 transition-colors disabled:opacity-50">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button onClick={() => setSelectedInv(new Set())} className="ml-auto text-muted-foreground hover:text-foreground p-1.5 transition-colors text-xs">Clear</button>
          </div>
        )}

        {allInvoicesSorted.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices yet" description="Generate from billable trips above or create one manually." />
        ) : (
          <div className="space-y-1.5">
            {/* select-all header */}
            <div className="row-card flex items-center gap-3 !mb-1 !py-2">
              <Checkbox checked={allInvSelected ? true : someInvSelected ? 'indeterminate' : false} onCheckedChange={toggleAllInv} id="inv-all" />
              <label htmlFor="inv-all" className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium cursor-pointer">
                {allInvSelected ? `All ${allInvoicesSorted.length} selected` : `Select all (${allInvoicesSorted.length})`}
              </label>
            </div>
            {/* scrollable invoice list */}
            <div className={SCROLL_H}>
              {allInvoicesSorted.map((inv) => {
                const balance = (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0);
                const checked = selectedInv.has(inv.id);
                const fi = flagInfo(inv, clientAdvance);
                const FIcon = fi.Icon;
                return (
                  <div key={inv.id} onClick={() => onEditInvoice?.(inv)} className={`row-card flex items-center gap-3 cursor-pointer transition-colors ${checked ? 'border-primary/40' : ''}`}>
                    <Checkbox checked={checked} onCheckedChange={() => toggleInv(inv.id)} onClick={(e) => e.stopPropagation()} />
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{inv.invoice_number || '—'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(inv.issue_date)} · Due {formatDate(inv.due_date)}{inv.status === 'sent' ? ' · Sent' : ''}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap" style={{ background: fi.bg, border: `1px solid ${fi.border}`, color: fi.color }}>
                      <FIcon className={cn('w-3 h-3', fi.pulse && 'animate-pulse')} style={{ color: fi.color }} />
                      {fi.label}
                    </span>
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(balance || inv.total_amount)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}