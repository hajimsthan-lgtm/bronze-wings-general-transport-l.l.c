import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadInvoicePDF } from '@/lib/invoiceHtml';
import { FileText, Download, Send, Trash2, Zap, Truck, AlertCircle, CheckCheck, Layers, AlertTriangle, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const pad = (n) => String(n).padStart(4, '0');

const dueFromTerms = (terms) => {
  const m = String(terms || '').match(/(\d+)/);
  const days = m ? parseInt(m[1], 10) : 30;
  const d = new Date();
  d.setDate(d.getDate() + (days || 30));
  return d.toISOString().split('T')[0];
};

const dueInfo = (inv) => {
  const balance = (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0);
  if (inv.status === 'paid' || balance <= 0.001) return { rank: 3, key: 'paid', label: 'Paid', color: '#34d399', bg: 'rgba(52,211,153,0.14)', border: 'rgba(52,211,153,0.4)', Icon: CheckCircle2 };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = inv.due_date ? new Date(inv.due_date) : null;
  if (!due) return { rank: 2, key: 'open', label: 'Open', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)', Icon: Clock };
  const days = Math.ceil((due - today) / 86400000);
  if (days < 0) return { rank: 0, key: 'overdue', label: `Overdue · ${Math.abs(days)}d`, color: '#f87171', bg: 'rgba(248,113,113,0.16)', border: 'rgba(248,113,113,0.45)', Icon: AlertTriangle, pulse: true };
  if (days <= 3) return { rank: 1, key: 'soon', label: days === 0 ? 'Due today' : `Due in ${days}d`, color: '#fbbf24', bg: 'rgba(251,191,36,0.16)', border: 'rgba(251,191,36,0.45)', Icon: Clock };
  return { rank: 2, key: 'open', label: `Due ${formatDate(inv.due_date)}`, color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.35)', Icon: Calendar };
};

export default function InvoiceGeneratorTab({ client, trips, invoices, onInvoicesChanged }) {
  const { t } = useI18n();
  const [allInvoices, setAllInvoices] = useState([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [selectedTrips, setSelectedTrips] = useState(new Set());
  const [selectedFollow, setSelectedFollow] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [genMode, setGenMode] = useState('single'); // 'single' = one invoice per trip · 'bulk' = one combined invoice
  const [progress, setProgress] = useState('');

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

  const billableTrips = (trips || []).filter((tr) => tr.status === 'completed' && !tripInvoiceMap[tr.id]);

  // All non-cancelled trips for display — already-invoiced ones are shown but locked
  const allClientTrips = useMemo(
    () => (trips || []).filter((tr) => tr.status !== 'cancelled').sort((a, b) => String(b.trip_date || '').localeCompare(String(a.trip_date || ''))),
    [trips]
  );

  const tripInvoiceInfo = useMemo(() => {
    const m = {};
    (invoices || []).forEach((inv) => {
      if (inv.trip_id) String(inv.trip_id).split(',').forEach((tid) => { const id = tid.trim(); if (id) m[id] = { number: inv.invoice_number, status: inv.status }; });
    });
    return m;
  }, [invoices]);

  const nextStart = useMemo(() => {
    let max = 0;
    allInvoices.forEach((inv) => {
      const n = parseInt(String(inv.invoice_number || '').replace(/\D/g, ''), 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return max + 1;
  }, [allInvoices]);

  const followUpInvoices = (invoices || [])
    .filter((inv) => inv.trip_id && inv.status !== 'cancelled')
    .sort((a, b) => {
      const r = dueInfo(a).rank - dueInfo(b).rank;
      if (r !== 0) return r;
      return String(b.created_date || '').localeCompare(String(a.created_date || ''));
    });

  const fuCounts = followUpInvoices.reduce((acc, inv) => { const k = dueInfo(inv).key; acc[k] = (acc[k] || 0) + 1; return acc; }, { overdue: 0, soon: 0, open: 0, paid: 0 });

  const buildInvoice = (trip, number) => {
    const revenue = Number(trip.revenue) || 0;
    const vatRate = 5;
    const vatAmount = Math.round(revenue * vatRate * 100) / 100;
    const total = Math.round((revenue + vatAmount) * 100) / 100;
    return {
      invoice_number: number,
      client_name: client.name,
      contact_person: trip.contact_person || client.contact_person || '',
      client_email: client.email || '',
      client_phone: client.phone || '',
      client_address: client.address || '',
      client_trn: client.trn || '',
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueFromTerms(client.payment_terms),
      subtotal: revenue,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total_amount: total,
      paid_amount: 0,
      currency: 'AED',
      line_items: [{ description: `${trip.from_location} → ${trip.to_location}`, date: trip.trip_date, quantity: 1, unit_price: revenue, amount: revenue }],
      trip_id: trip.id,
      notes: trip.trip_number ? `Trip ${trip.trip_number}` : '',
      payment_terms: client.payment_terms || 'Net 30',
    };
  };

  // Bulk: combine multiple trips into ONE invoice (each trip = one line item)
  const buildBulkInvoice = (selected, number) => {
    const items = selected.map((tr) => ({
      description: `${tr.from_location} → ${tr.to_location}`,
      date: tr.trip_date,
      quantity: 1,
      unit_price: Number(tr.revenue) || 0,
      amount: Number(tr.revenue) || 0,
    }));
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const vatRate = 5;
    const vatAmount = Math.round(subtotal * vatRate * 100) / 100;
    const total = Math.round((subtotal + vatAmount) * 100) / 100;
    const tripNumbers = selected.map((tr) => tr.trip_number).filter(Boolean);
    return {
      invoice_number: number,
      client_name: client.name,
      contact_person: client.contact_person || '',
      client_email: client.email || '',
      client_phone: client.phone || '',
      client_address: client.address || '',
      client_trn: client.trn || '',
      status: 'draft',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: dueFromTerms(client.payment_terms),
      subtotal,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total_amount: total,
      paid_amount: 0,
      currency: 'AED',
      line_items: items,
      trip_id: selected.map((tr) => tr.id).join(','),
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
        await base44.entities.Invoice.create(buildBulkInvoice(selected, pad(nextStart)));
      } else {
        const toCreate = selected.map((tr, i) => buildInvoice(tr, pad(nextStart + i)));
        await base44.entities.Invoice.bulkCreate(toCreate);
      }
      setSelectedTrips(new Set());
      onInvoicesChanged();
    } finally { setBusy(false); setProgress(''); }
  };

  const allBillableSelected = billableTrips.length > 0 && billableTrips.every((tr) => selectedTrips.has(tr.id));
  const toggleAllBillable = () => setSelectedTrips(allBillableSelected ? new Set() : new Set(billableTrips.map((tr) => tr.id)));
  const toggleTrip = (id) => setSelectedTrips((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const allFollowSelected = followUpInvoices.length > 0 && followUpInvoices.every((inv) => selectedFollow.has(inv.id));
  const toggleAllFollow = () => setSelectedFollow(allFollowSelected ? new Set() : new Set(followUpInvoices.map((inv) => inv.id)));
  const toggleFollow = (id) => setSelectedFollow((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const bulkMarkSent = async () => {
    const ids = [...selectedFollow];
    if (!ids.length || busy) return;
    setBusy(true);
    try {
      await base44.entities.Invoice.bulkUpdate(ids.map((id) => ({ id, status: 'sent' })));
      setSelectedFollow(new Set());
      onInvoicesChanged();
    } finally { setBusy(false); }
  };

  const bulkDownload = async () => {
    const ids = [...selectedFollow];
    if (!ids.length || busy) return;
    setBusy(true);
    try {
      const settings = await getCompanySettings();
      const list = followUpInvoices.filter((i) => selectedFollow.has(i.id));
      for (let i = 0; i < list.length; i++) {
        setProgress(`${i + 1}/${list.length}`);
        await downloadInvoicePDF(list[i], client.name, settings);
        if (i < list.length - 1) await new Promise((r) => setTimeout(r, 80));
      }
    } finally { setBusy(false); setProgress(''); }
  };

  const bulkDelete = async () => {
    const ids = [...selectedFollow];
    if (!ids.length || busy) return;
    setBusy(true);
    try {
      for (const id of ids) await base44.entities.Invoice.delete(id);
      setSelectedFollow(new Set());
      onInvoicesChanged();
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      {/* ===== Invoice Generator ===== */}
      <div data-tour data-tour-title="Invoice Generator" data-tour-en="Invoice Generator — Select one or more completed trips below using the checkboxes, then tap Generate Invoice. A single selection creates one invoice; selecting multiple creates a whole batch at once. Each new invoice receives a globally sequential number (0001, 0002 …) so your numbering never collides across clients." data-tour-ur="انوائس جنریٹر — نیچے مکمل ہونے والی ٹرپس کو چیک باکسز کے ذریعے منتخب کریں، پھر جنریٹ انوائس دبائیں۔ ایک انتخاب سے ایک انوائس بنتا ہے؛ متعدد انتخاب سے ایک مکمل بچ بن جاتا ہے۔ ہر نئے انوائس کو عالمی تسلسل میں نمبر ملتا ہے (0001، 0002 …) تاکہ آپ کے نمبرز کلائنٹس کے درمیان کبھی نہ ٹکرائیں۔" data-tour-ml="ഇൻവോയ്സ് ജനറേറ്റർ — താഴെ പൂർത്തിയായ യാത്രകൾ ചെക്ക്ബോക്സുകൾ ഉപയോഗിച്ച് തിരഞ്ഞെടുത്ത് ജനറേറ്റ് ഇൻവോയ്സ് അമർത്തുക. ഒരു തിരഞ്ഞെടുപ്പ് ഒരു ഇൻവോയ്സ് സൃഷ്ടിക്കും; ഒന്നിലധികം തിരഞ്ഞെടുത്താൽ ഒരു പൂർണ്ണ ബാച്ച് ഉണ്ടാകും. ഓരോ പുതിയ ഇൻവോയ്സിനും ആഗോള ക്രമത്തിൽ നമ്പർ (0001, 0002 …) ലഭിക്കും, അതിനാൽ ക്ലയന്റുകൾക്കിടയിൽ നമ്പറുകൾ ഒരിക്കലും സംഘർഷിക്കില്ല." className="glass-card p-4 sm:p-5">
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
            <Button onClick={generate} disabled={busy || selectedTrips.size === 0} className="bg-primary hover:bg-primary/90 h-9">
              {genMode === 'bulk' ? <Layers className="w-3.5 h-3.5 mr-1.5" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
              {genMode === 'bulk' ? `Generate Bulk Invoice${selectedTrips.size > 1 ? ` (${selectedTrips.size})` : ''}` : `Generate Invoice${selectedTrips.size > 1 ? ` (${selectedTrips.size})` : ''}`}
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">{genMode === 'bulk' ? 'Bulk mode — all selected trips are combined into a single invoice.' : 'Single mode — one invoice is created per selected trip.'}</p>

        {allClientTrips.length === 0 ? (
          <EmptyState icon={Truck} title="No trips" description="This client has no trips yet. Add a trip to start billing." />
        ) : (
          <div className="space-y-2">
            {billableTrips.length > 0 && (
              <div className="flex items-center gap-3 px-2 pb-1 border-b border-border/50">
                <Checkbox checked={allBillableSelected} onCheckedChange={toggleAllBillable} id="gen-all" />
                <label htmlFor="gen-all" className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium cursor-pointer">Select all billable</label>
              </div>
            )}
            {allClientTrips.map((tr) => {
              const info = tripInvoiceInfo[tr.id];
              const isBilled = !!info;
              const checked = selectedTrips.has(tr.id);
              return (
                <div key={tr.id} onClick={() => !isBilled && tr.status === 'completed' && toggleTrip(tr.id)} className={`row-card flex items-center gap-3 transition-colors ${isBilled ? 'opacity-60 cursor-not-allowed' : tr.status === 'completed' ? 'cursor-pointer' : 'opacity-70'} ${checked ? 'border-primary/40' : ''}`}>
                  <Checkbox checked={checked} disabled={isBilled || tr.status !== 'completed'} onCheckedChange={() => toggleTrip(tr.id)} onClick={(e) => e.stopPropagation()} />
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isBilled ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
                    {isBilled ? <FileText className="w-4 h-4 text-emerald-400" /> : <Truck className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{tr.from_location} → {tr.to_location}</p>
                      {isBilled ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">Invoiced · {info.number}</span>
                      ) : tr.status !== 'completed' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 whitespace-nowrap">Not completed</span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(tr.trip_date)} · {tr.vehicle_plate} · {tr.driver_name}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(tr.revenue)}</span>
                  <StatusBadge status={tr.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===== Follow-up Section ===== */}
      <div data-tour data-tour-title="Follow-up" data-tour-en="Follow-up — Generated invoices awaiting payment appear here, kept separate from manual invoicing. Use the checkboxes to select several at once, then apply a bulk action: mark them as sent to the client, download their PDF copies, or remove them. This is your collection workspace for chasing outstanding billings." data-tour-ur="فالو اپ — ادائیگی کے منتظر جنریٹ شدہ انوائسز یہاں ظاہر ہوتے ہیں، دستی انوائسنگ سے الگ۔ ایک ساتھ کئی منتخب کرنے کے لیے چیک باکسز استعمال کریں، پھر بلک ایکشن لگائیں: انہیں کلائنٹ کو بھیجا ہوا نشان زد کریں، ان کے پی ڈی ایف کاپیز ڈاؤن لوڈ کریں، یا ہٹا دیں۔ یہ باقی بلنگز کے پیچھے جانے کے لیے آپ کا وصولی ورک سپیس ہے۔" data-tour-ml="ഫോളോ-അപ്പ് — പേയ്മെന്റിനായി കാത്തിരിക്കുന്ന ജനറേറ്റ് ചെയ്ത ഇൻവോയ്സുകൾ ഇവിടെ കാണാം, മാനുവൽ ഇൻവോയ്സിംഗിൽ നിന്ന് വേർതിരിച്ച്. ചെക്ക്ബോക്സുകൾ ഉപയോഗിച്ച് ഒന്നിലധികം തിരഞ്ഞെടുത്ത് ബൾക്ക് ആക്ഷൻ പ്രയോഗിക്കുക: ക്ലയന്റിന് അയച്ചതായി അടയാളപ്പെടുത്തുക, അവയുടെ PDF കോപ്പികൾ ഡൗൺലോഡ് ചെയ്യുക, അല്ലെങ്കിൽ നീക്കംചെയ്യുക. ബാക്കി ബില്ലിംഗുകൾ പിന്തുടാൻ ഇതാണ് നിങ്ങളുടെ കളക്ഷൻ വർക്ക്സ്പേസ്." className="glass-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center"><AlertCircle className="w-4 h-4 text-amber-400" /></div>
            <div>
              <p className="text-sm font-semibold text-foreground">Follow-up</p>
              <p className="text-[11px] text-muted-foreground">{followUpInvoices.length} generated invoice{followUpInvoices.length === 1 ? '' : 's'} · paid & unpaid tracking</p>
            </div>
          </div>
          {selectedFollow.size > 0 && (
            <div className="flex items-center gap-2">
              <Button onClick={bulkMarkSent} disabled={busy} size="sm" variant="outline" className="h-8 border-border"><Send className="w-3.5 h-3.5 mr-1" /> Mark Sent</Button>
              <Button onClick={bulkDownload} disabled={busy} size="sm" variant="outline" className="h-8 border-border"><Download className="w-3.5 h-3.5 mr-1" /> {progress || 'PDF'}</Button>
              <Button onClick={bulkDelete} disabled={busy} size="sm" variant="outline" className="h-8 border-red-500/30 text-red-400 hover:text-red-300"><Trash2 className="w-3.5 h-3.5 mr-1" /> Delete</Button>
            </div>
          )}
        </div>

        {/* Due-alert summary strip */}
        {followUpInvoices.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {[{ key: 'overdue', label: 'Overdue', color: '#f87171' },{ key: 'soon', label: 'Due Soon', color: '#fbbf24' },{ key: 'open', label: 'Unpaid', color: '#60a5fa' },{ key: 'paid', label: 'Paid', color: '#34d399' }].map((s) => fuCounts[s.key] > 0 && (
              <div key={s.key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: `${s.color}1f`, border: `1px solid ${s.color}55`, color: s.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}` }} />
                {s.label} {fuCounts[s.key]}
              </div>
            ))}
          </div>
        )}

        {followUpInvoices.length === 0 ? (
          <EmptyState icon={CheckCheck} title="Nothing to follow up" description="Generated invoices will appear here — paid & unpaid, with due-date alerts." />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-2 pb-1 border-b border-border/50">
              <Checkbox checked={allFollowSelected} onCheckedChange={toggleAllFollow} id="fol-all" />
              <label htmlFor="fol-all" className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium cursor-pointer">Select all</label>
            </div>
            {followUpInvoices.map((inv) => {
              const balance = (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0);
              const checked = selectedFollow.has(inv.id);
              const di = dueInfo(inv);
              const DIcon = di.Icon;
              const isNew = inv.created_date && new Date(inv.created_date).toDateString() === new Date().toDateString();
              return (
                <div key={inv.id} onClick={() => toggleFollow(inv.id)} className={`row-card flex items-center gap-3 cursor-pointer transition-colors ${checked ? 'border-primary/40' : ''}`}>
                  <Checkbox checked={checked} onCheckedChange={() => toggleFollow(inv.id)} onClick={(e) => e.stopPropagation()} />
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{inv.invoice_number || '—'}</p>
                      {isNew && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">New</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">Issued {formatDate(inv.issue_date)}{inv.status === 'sent' ? ' · Sent' : ''}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap" style={{ background: di.bg, border: `1px solid ${di.border}`, color: di.color }}>
                    <DIcon className={cn('w-3 h-3', di.pulse && 'animate-pulse')} style={{ color: di.color }} />
                    {di.label}
                  </span>
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(balance)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}