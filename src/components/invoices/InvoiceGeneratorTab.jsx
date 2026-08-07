import { useState, useEffect, useMemo, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadInvoicePDF, downloadMonthlyInvoicePDF, downloadPerTripInvoicePDF } from '@/lib/invoiceHtml';
import { FileText, Trash2, Zap, Truck, AlertCircle, Layers, AlertTriangle, Clock, Calendar, CheckCircle2, Plus, Wallet, MailCheck, Split, MessageCircle, Mail, Pencil, ChevronDown, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { computeNextSeq, formatInvoiceNumber, restructureInvoiceYear, parseInvoiceNumber } from '@/lib/invoiceSequence';
import InvoiceAgingStrip, { getAgingBuckets } from '@/components/invoices/InvoiceAgingStrip';

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
  const isSent = inv.status === 'sent' || inv.status === 'partially_paid';
  if (inv.voided) return { rank: 5, key: 'voided', label: 'Voided', color: '#94a3b8', bg: 'rgba(148,163,184,0.14)', border: 'rgba(148,163,184,0.4)', Icon: X, sent: false };
  if (inv.status === 'paid' || balance <= 0.001) return { rank: 4, key: 'paid', label: 'Paid', color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.4)', Icon: CheckCircle2, sent: isSent };
  if (paid > 0) return { rank: 1, key: 'partial', label: 'Split', color: '#fbbf24', bg: 'rgba(251,191,36,0.16)', border: 'rgba(251,191,36,0.45)', Icon: Split, sent: isSent };
  if (clientAdvance > 0) return { rank: 2, key: 'advance', label: 'Advance', color: '#22d3ee', bg: 'rgba(34,211,238,0.14)', border: 'rgba(34,211,238,0.4)', Icon: Wallet, sent: isSent };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = inv.due_date ? new Date(inv.due_date) : null;
  if (!due) return { rank: 3, key: 'open', label: 'Unpaid', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)', Icon: Clock, sent: isSent };
  const days = Math.ceil((due - today) / 86400000);
  if (days < 0) return { rank: 0, key: 'overdue', label: `Overdue · ${Math.abs(days)}d`, color: '#f87171', bg: 'rgba(248,113,113,0.16)', border: 'rgba(248,113,113,0.45)', Icon: AlertTriangle, pulse: true, sent: isSent };
  if (days <= 3) return { rank: 1, key: 'soon', label: days === 0 ? 'Due today' : `Due in ${days}d`, color: '#fbbf24', bg: 'rgba(251,191,36,0.16)', border: 'rgba(251,191,36,0.45)', Icon: Clock, sent: isSent };
  return { rank: 3, key: 'open', label: isSent ? 'Sent' : 'Unpaid', color: isSent ? '#818cf8' : '#60a5fa', bg: isSent ? 'rgba(129,140,248,0.14)' : 'rgba(96,165,250,0.12)', border: isSent ? 'rgba(129,140,248,0.4)' : 'rgba(96,165,250,0.35)', Icon: isSent ? MailCheck : Calendar, sent: isSent };
};

const FILTER_PILLS = [
  { key: 'all', label: 'All', color: '#818cf8' },
  { key: 'paid', label: 'Paid', color: '#34d399' },
  { key: 'unpaid', label: 'Unpaid', color: '#60a5fa' },
  { key: 'split', label: 'Split', color: '#fbbf24' },
  { key: 'overdue', label: 'Overdue', color: '#f87171' },
];

const matchesFilter = (fi, filterKey) => {
  if (filterKey === 'all') return true;
  if (filterKey === 'paid') return fi.key === 'paid';
  if (filterKey === 'split') return fi.key === 'partial';
  if (filterKey === 'overdue') return fi.key === 'overdue';
  if (filterKey === 'unpaid') return ['open', 'soon', 'advance'].includes(fi.key);
  return true;
};

export default function InvoiceGeneratorTab({ client, trips, invoices, displayInvoices, payments, onInvoicesChanged, onNewInvoice, onEditInvoice, clientInvoiceSeq, companySettings: propSettings }) {
  const { t } = useI18n();
  const [allInvoices, setAllInvoices] = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [selectedTrips, setSelectedTrips] = useState(new Set());
  const [selectedInv, setSelectedInv] = useState(new Set());
  const [expandedInv, setExpandedInv] = useState(new Set());
  const [invFilter, setInvFilter] = useState('all');
  const [busy, setBusy] = useState(false);
  const [genMode, setGenMode] = useState('single');
  const [progress, setProgress] = useState('');
  const [companySettings, setCompanySettings] = useState(propSettings || {});
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidTargetIds, setVoidTargetIds] = useState([]);
  const [voidPendingDeleteIds, setVoidPendingDeleteIds] = useState([]);
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

  useEffect(() => {
    if (!propSettings) getCompanySettings().then(setCompanySettings).catch(() => {});
  }, [propSettings]);

  // tripInvoiceMap uses ALL invoices (not date-filtered) to know which trips are already invoiced
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

  const clientAdvance = useMemo(
    () => (payments || []).filter(p => p.status !== 'pending').reduce((s, p) => s + (Number(p.unapplied_balance) || 0), 0),
    [payments]
  );

  const currentYear = new Date().getFullYear();
  const nextSeq = useMemo(() => computeNextSeq(allInvoices, currentYear), [allInvoices, currentYear]);
  const nextNumber = formatInvoiceNumber(currentYear, nextSeq);

  // Use displayInvoices (date-filtered) for the list; fall back to all invoices
  const listInvoices = displayInvoices || invoices || [];

  const allInvoicesSorted = useMemo(
    () => listInvoices.filter(inv => inv.status !== 'cancelled').sort((a, b) => {
      const r = flagInfo(a, clientAdvance).rank - flagInfo(b, clientAdvance).rank;
      if (r !== 0) return r;
      return String(b.created_date || '').localeCompare(String(a.created_date || ''));
    }),
    [listInvoices, clientAdvance]
  );

  const filteredInvoices = useMemo(
    () => invFilter === 'all' ? allInvoicesSorted : allInvoicesSorted.filter(inv => matchesFilter(flagInfo(inv, clientAdvance), invFilter)),
    [allInvoicesSorted, invFilter, clientAdvance]
  );

  const flagCounts = allInvoicesSorted.reduce((acc, inv) => { const fi = flagInfo(inv, clientAdvance); acc[fi.key] = (acc[fi.key] || 0) + 1; if (fi.sent) acc.sent = (acc.sent || 0) + 1; return acc; }, { overdue: 0, soon: 0, partial: 0, advance: 0, open: 0, paid: 0, sent: 0 });
  const agingBuckets = useMemo(() => getAgingBuckets(allInvoicesSorted), [allInvoicesSorted]);

  const buildInvoice = (trip, number) => {
    const revenue = Number(trip.revenue) || 0;
    const vatRate = 5;
    const vatAmount = Math.round(revenue * vatRate) / 100;
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
    const vatAmount = Math.round(subtotal * vatRate) / 100;
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

  const generate = async () => {
    if (selectedTrips.size === 0 || busy) return;
    setBusy(true);
    setProgress('');
    try {
      const selected = billableTrips.filter((tr) => selectedTrips.has(tr.id));
      if (genMode === 'bulk') {
        await base44.entities.Invoice.create(buildBulkInvoice(selected, nextNumber));
      } else {
        const toCreate = selected.map((tr, i) => buildInvoice(tr, formatInvoiceNumber(currentYear, nextSeq + i)));
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

  const allInvSelected = filteredInvoices.length > 0 && filteredInvoices.every((inv) => selectedInv.has(inv.id));
  const someInvSelected = selectedInv.size > 0 && !allInvSelected;
  const toggleAllInv = () => setSelectedInv(allInvSelected ? new Set() : new Set(filteredInvoices.map((inv) => inv.id)));
  const toggleInv = (id) => setSelectedInv((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleExpand = (id) => setExpandedInv((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const downloadOne = async (inv) => {
    if (busy) return;
    setBusy(true);
    try {
      const settings = await getCompanySettings();
      const isMonthly = inv.line_items?.[0]?.description?.startsWith('Monthly Contract');
      const downloader = isMonthly ? downloadMonthlyInvoicePDF : downloadPerTripInvoicePDF;

      // Enrich line items with trip dates from linked trips (fixes old invoices
      // whose line items were saved before the `date` field existed in the schema)
      let enrichedInv = inv;
      if (!isMonthly && inv.trip_id) {
        const tripIds = String(inv.trip_id).split(',').map(s => s.trim()).filter(Boolean);
        const needsDate = inv.line_items?.some((item, idx) => !item.date && tripIds[idx]);
        if (needsDate) {
          const localMap = {};
          (trips || []).forEach(t => { localMap[t.id] = t; });
          const tripRecords = await Promise.all(
            tripIds.map(id => localMap[id] || base44.entities.Trip.get(id).catch(() => null))
          );
          const enrichedItems = inv.line_items.map((item, idx) => {
            if (item.date) return item;
            const trip = tripRecords[idx];
            return { ...item, date: trip?.trip_date || item.date };
          });
          enrichedInv = { ...inv, line_items: enrichedItems };
        }
      }

      await downloader(enrichedInv, client.name, settings, clientInvoiceSeq?.[inv.id]);
    } finally { setBusy(false); setProgress(''); }
  };

  const isPaid = (inv) => {
    const fi = flagInfo(inv, clientAdvance);
    return fi.key === 'paid' || inv.status === 'paid';
  };

  const deleteOne = async (inv) => {
    if (busy) return;
    if (inv.voided) return;
    if (isPaid(inv)) {
      setVoidTargetIds([inv.id]);
      setVoidPendingDeleteIds([]);
      setVoidReason('');
      setVoidDialogOpen(true);
    } else {
      if (!confirm('Delete this invoice?')) return;
      setBusy(true);
      try {
        await base44.entities.Invoice.delete(inv.id);
        const yr = parseInvoiceNumber(inv.invoice_number)?.year;
        if (yr) await restructureInvoiceYear(yr);
        onInvoicesChanged();
      }
      finally { setBusy(false); setProgress(''); }
    }
  };

  const bulkDelete = async () => {
    const ids = [...selectedInv];
    if (!ids.length || busy) return;
    const paidIds = ids.filter(id => { const inv = allInvoicesSorted.find(i => i.id === id); return inv && !inv.voided && isPaid(inv); });
    const nonPaidIds = ids.filter(id => !paidIds.includes(id));

    if (paidIds.length > 0) {
      setVoidTargetIds(paidIds);
      setVoidPendingDeleteIds(nonPaidIds);
      setVoidReason('');
      setVoidDialogOpen(true);
      return;
    }
    // No paid invoices — just delete all
    setBusy(true);
    try {
      const toDelete = nonPaidIds.map(id => allInvoicesSorted.find(i => i.id === id)).filter(Boolean);
      const years = new Set(toDelete.map(inv => parseInvoiceNumber(inv.invoice_number)?.year).filter(Boolean));
      const BATCH = 25;
      for (let i = 0; i < nonPaidIds.length; i += BATCH) {
        await Promise.all(nonPaidIds.slice(i, i + BATCH).map((id) => base44.entities.Invoice.delete(id).catch(() => null)));
        setProgress(`${Math.min(i + BATCH, nonPaidIds.length)}/${nonPaidIds.length}`);
      }
      for (const y of years) await restructureInvoiceYear(y);
      setSelectedInv(new Set());
      onInvoicesChanged();
    } finally { setBusy(false); setProgress(''); }
  };

  const confirmVoid = async () => {
    if (voidReason.trim().length < 10 || busy) return;
    setBusy(true);
    try {
      // Void the paid invoices
      if (voidTargetIds.length > 0) {
        await base44.entities.Invoice.bulkUpdate(voidTargetIds.map(id => ({ id, voided: true, void_reason: voidReason.trim() })));
      }
      // Delete the non-paid invoices (if from bulk)
      if (voidPendingDeleteIds.length > 0) {
        const toDelete = voidPendingDeleteIds.map(id => allInvoicesSorted.find(i => i.id === id)).filter(Boolean);
        const years = new Set(toDelete.map(inv => parseInvoiceNumber(inv.invoice_number)?.year).filter(Boolean));
        const BATCH = 25;
        for (let i = 0; i < voidPendingDeleteIds.length; i += BATCH) {
          await Promise.all(voidPendingDeleteIds.slice(i, i + BATCH).map((id) => base44.entities.Invoice.delete(id).catch(() => null)));
        }
        for (const y of years) await restructureInvoiceYear(y);
      }
      setVoidDialogOpen(false);
      setVoidReason('');
      setVoidTargetIds([]);
      setVoidPendingDeleteIds([]);
      setSelectedInv(new Set());
      onInvoicesChanged();
    } finally { setBusy(false); setProgress(''); }
  };

  const shareWhatsApp = (inv) => {
    const phone = (inv.client_phone || client.phone || '').replace(/\D/g, '');
    const amount = formatCurrency(inv.total_amount || 0);
    const link = `${window.location.origin}/admin/clients/${client.id}`;
    const msg = `Hello ${client.name}, your invoice ${inv.invoice_number || ''} for ${amount} is ready. ${link}`;
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const shareEmail = (inv) => {
    const email = inv.client_email || client.email || '';
    const companyName = companySettings.company_name || 'General Transport L.L.C';
    const subject = `Invoice ${inv.invoice_number || ''} from ${companyName}`;
    const amount = formatCurrency(inv.total_amount || 0);
    const link = `${window.location.origin}/admin/clients/${client.id}`;
    const body = `Hello ${client.name},\n\nYour invoice ${inv.invoice_number || ''} for ${amount} is ready.\nView it here: ${link}\n\nThank you,\n${companyName}`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* ===== Invoice Generator ===== */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-primary" /></div>
            <div>
              <p className="text-sm font-semibold text-foreground">Invoice Generator</p>
              <p className="text-[10px] text-muted-foreground">{billableTrips.length} billable · next # {loadingAll ? '…' : nextNumber} · {genMode === 'bulk' ? 'bulk' : 'single'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="inline-flex p-0.5 rounded-lg bg-background/40 border border-white/10">
              <button type="button" onClick={() => setGenMode('single')} title="One invoice per trip" className={cn('px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1', genMode === 'single' ? 'bg-primary/20 text-foreground border border-primary/40' : 'text-muted-foreground hover:text-foreground')}><Zap className="w-3 h-3" /> Single</button>
              <button type="button" onClick={() => setGenMode('bulk')} title="Combine all trips into one invoice" className={cn('px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1', genMode === 'bulk' ? 'bg-primary/20 text-foreground border border-primary/40' : 'text-muted-foreground hover:text-foreground')}><Layers className="w-3 h-3" /> Bulk</button>
            </div>
            {onNewInvoice && (
              <Button onClick={onNewInvoice} variant="outline" size="sm" className="h-7 px-2.5 border-border text-xs">
                <Plus className="w-3 h-3 mr-1" /> Manual
              </Button>
            )}
            <Button onClick={generate} disabled={busy || selectedTrips.size === 0} className="bg-primary hover:bg-primary/90 h-7 px-3 text-xs">
              {genMode === 'bulk' ? <Layers className="w-3 h-3 mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
              Generate{selectedTrips.size > 0 ? ` (${selectedTrips.size})` : ''}
            </Button>
          </div>
        </div>
        {busy && progress && <p className="text-[11px] text-primary mb-2 font-medium animate-pulse">Processing {progress}…</p>}

        {billableTrips.length === 0 ? (
          <EmptyState icon={Truck} title="No billable trips" description="Completed trips without invoices will appear here." />
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 !mb-1 !py-2 px-4 rounded-xl border border-sky-500/30 bg-sky-500/10">
              <Checkbox checked={allBillableSelected ? true : someBillableSelected ? 'indeterminate' : false} onCheckedChange={toggleAllBillable} id="gen-all" />
              <label htmlFor="gen-all" className="text-[11px] text-sky-300 uppercase tracking-wider font-semibold cursor-pointer">
                {allBillableSelected ? `All ${billableTrips.length} selected` : `Select all billable (${billableTrips.length})`}
              </label>
              {selectedTrips.size > 0 && (
                <span className="ml-auto text-[11px] text-sky-300 font-bold">{selectedTrips.size} selected</span>
              )}
            </div>
            <div ref={scrollRef} className={SCROLL_H}>
              {billableTrips.map((tr) => {
                const checked = selectedTrips.has(tr.id);
                return (
                  <div key={tr.id} onClick={() => toggleTrip(tr.id)} className={`row-card flex items-center gap-3 cursor-pointer hover:!translate-y-0 transition-colors ${checked ? 'border-sky-500/40' : ''}`}>
                    <Checkbox checked={checked} onCheckedChange={() => toggleTrip(tr.id)} onClick={(e) => e.stopPropagation()} />
                    <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0"><Truck className="w-4 h-4 text-sky-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tr.from_location} → {tr.to_location}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(tr.trip_date)} · {tr.vehicle_plate} · {tr.driver_name}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(tr.revenue)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== Invoices ===== */}
      <div className="glass-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center"><AlertCircle className="w-4 h-4 text-amber-400" /></div>
            <div>
              <p className="text-sm font-semibold text-foreground">Invoices</p>
              <p className="text-[11px] text-muted-foreground">{filteredInvoices.length} shown · {allInvoicesSorted.length} total{clientAdvance > 0 ? ` · ${formatCurrency(clientAdvance)} advance` : ''}</p>
            </div>
          </div>
          {selectedInv.size > 0 && (
            <Button onClick={bulkDelete} disabled={busy} size="sm" className="h-8 bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete {selectedInv.size} selected
            </Button>
          )}
        </div>

        {/* aging analysis — pinned static reference card */}
        {allInvoicesSorted.length > 0 && (
          <div className="sticky top-0 z-10 rounded-xl border border-white/10 bg-card/80 backdrop-blur-md p-2 mb-3">
            <InvoiceAgingStrip invoices={allInvoicesSorted} />
          </div>
        )}

        {/* filter pills — always visible */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {FILTER_PILLS.map((pill) => {
            const count = pill.key === 'all'
              ? allInvoicesSorted.length
              : allInvoicesSorted.filter(inv => matchesFilter(flagInfo(inv, clientAdvance), pill.key)).length;
            const active = invFilter === pill.key;
            return (
              <button
                key={pill.key}
                onClick={() => setInvFilter(pill.key)}
                className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-all',
                  active ? 'text-white' : 'text-muted-foreground hover:text-foreground')}
                style={active
                  ? { background: pill.color, border: `1px solid ${pill.color}`, boxShadow: `0 0 12px -3px ${pill.color}80` }
                  : { background: `${pill.color}15`, border: `1px solid ${pill.color}40` }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: pill.color }} />
                {pill.label} {count}
              </button>
            );
          })}
        </div>

        {filteredInvoices.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices" description="No invoices match this filter." />
        ) : (
          <div className="space-y-1.5">
            {/* select-all header */}
            <div className="flex items-center gap-3 !mb-1 !py-2 px-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
              <Checkbox checked={allInvSelected ? true : someInvSelected ? 'indeterminate' : false} onCheckedChange={toggleAllInv} id="inv-all" />
              <label htmlFor="inv-all" className="text-[11px] text-amber-300 uppercase tracking-wider font-semibold cursor-pointer">
                {allInvSelected ? `All ${filteredInvoices.length} selected` : `Select all (${filteredInvoices.length})`}
              </label>
            </div>
            {/* scrollable invoice list */}
            <div className={SCROLL_H}>
              {filteredInvoices.map((inv) => {
                const balance = (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0);
                const checked = selectedInv.has(inv.id);
                const expanded = expandedInv.has(inv.id);
                const fi = flagInfo(inv, clientAdvance);
                const FIcon = fi.Icon;
                const isVoided = inv.voided;
                return (
                  <div key={inv.id} onClick={() => toggleInv(inv.id)} className={`row-card min-h-[64px] overflow-hidden cursor-pointer hover:bg-white/5 ${checked ? 'border-amber-500/40' : ''} ${isVoided ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3 h-full">
                      {/* Left: Checkbox + Status Badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Checkbox checked={checked} onCheckedChange={() => toggleInv(inv.id)} onClick={(e) => e.stopPropagation()} />
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap" style={{ background: fi.bg, border: `1px solid ${fi.border}`, color: fi.color }}>
                          <FIcon className={cn('w-2.5 h-2.5', fi.pulse && 'animate-pulse')} style={{ color: fi.color }} />
                          <span className="hidden sm:inline">{fi.label}</span>
                        </span>
                      </div>
                      {/* Middle: Invoice Info */}
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium text-foreground truncate', isVoided && 'line-through')}>{inv.invoice_number || '—'}</p>
                        <p className="text-xs text-muted-foreground truncate">{formatDate(inv.issue_date)} · Due {formatDate(inv.due_date)}{isVoided && inv.void_reason ? ` · ${inv.void_reason}` : ''}</p>
                      </div>
                      {/* Amount */}
                      <span className={cn('text-sm font-semibold text-foreground whitespace-nowrap tabular-nums shrink-0', isVoided && 'line-through')}>{formatCurrency(balance || inv.total_amount)}</span>
                      {/* Actions — right-aligned */}
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); shareWhatsApp(inv); }} title="Send via WhatsApp" className="p-2 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); shareEmail(inv); }} title="Send Email" className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); downloadOne(inv); }} disabled={busy} title="Download PDF" className="p-2 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors disabled:opacity-50">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onEditInvoice?.(inv); }} title="Edit Invoice" className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* void reason dialog */}
      {voidDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => { if (voidReason.trim().length < 10) setVoidDialogOpen(false); }}>
          <div className="glass-card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Void Paid Invoice{voidTargetIds.length > 1 ? 's' : ''}</h3>
              <button onClick={() => setVoidDialogOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-white/5 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">This invoice is marked as paid. Please provide a reason (minimum 10 characters) to void it instead of deleting.</p>
            <textarea
              value={voidReason}
              onChange={(e) => setVoidReason(e.target.value)}
              placeholder="Enter reason for voiding..."
              className="w-full h-24 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground resize-none focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
            {voidReason.trim().length > 0 && voidReason.trim().length < 10 && (
              <p className="text-xs text-red-400 mt-1">Reason must be at least 10 characters ({voidReason.trim().length}/10)</p>
            )}
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setVoidDialogOpen(false)} className="h-9">Cancel</Button>
              <Button onClick={confirmVoid} disabled={busy || voidReason.trim().length < 10} className="h-9 bg-red-500 hover:bg-red-600 text-white">
                {busy ? 'Processing...' : `Void ${voidTargetIds.length} invoice${voidTargetIds.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}