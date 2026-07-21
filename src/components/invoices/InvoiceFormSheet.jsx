import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Trash2, Check, Loader2, CreditCard, Receipt, User, FileText, Sparkles, Wallet } from 'lucide-react';
import { useInvoiceCreate, useInvoiceUpdate, useClientPaymentCreate } from '@/hooks/useEntityQueries';
import { generateInvoiceNumber, getCompanySettings } from '@/lib/companySettings';

const emptyItem = { description: '', quantity: 1, unit_price: 0, amount: 0 };

const STATUS_STYLES = {
  paid: 'bg-emerald-500/20 text-emerald-400',
  partially_paid: 'bg-orange-500/20 text-orange-400',
  draft: 'bg-amber-500/20 text-amber-400',
  sent: 'bg-blue-500/20 text-blue-400',
  overdue: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-white/10 text-white/50',
};

function StatusPill({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function InvoiceFormSheet({ open, onOpenChange, editInvoice, onSaved, defaultClientName }) {
  const { t } = useI18n();
  const createInvoice = useInvoiceCreate();
  const updateInvoice = useInvoiceUpdate();
  const createPayment = useClientPaymentCreate();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [trips, setTrips] = useState([]);
  const [receivePayment, setReceivePayment] = useState(false);
  const [payment, setPayment] = useState({ amount: '', mode: 'cash', date: new Date().toISOString().split('T')[0], reference: '', notes: '' });
  const [form, setForm] = useState({
    client_name: '', client_email: '', client_phone: '', client_address: '', client_trn: '', contact_person: '',
    invoice_number: '', issue_date: new Date().toISOString().split('T')[0],
    due_date: '', status: 'draft', vat_rate: 5, notes: '', payment_terms: 'Net 30',
    trip_id: '', line_items: [{ ...emptyItem }],
  });

  useEffect(() => {
    if (editInvoice) {
      setForm({
        ...form, ...editInvoice,
        line_items: editInvoice.line_items?.length ? editInvoice.line_items : [{ ...emptyItem }],
        vat_rate: editInvoice.vat_rate ?? 5,
      });
      setReceivePayment(false);
      setPayment({ amount: '', mode: 'cash', date: new Date().toISOString().split('T')[0], reference: '', notes: '' });
    } else {
      setForm({
        client_name: defaultClientName || '', client_email: '', client_phone: '', client_address: '', client_trn: '', contact_person: '',
        invoice_number: '', issue_date: new Date().toISOString().split('T')[0],
        due_date: '', status: 'draft', vat_rate: 5, notes: '', payment_terms: 'Net 30',
        trip_id: '', line_items: [{ ...emptyItem }],
      });
      setReceivePayment(false);
      Promise.all([generateInvoiceNumber(), getCompanySettings()]).then(([num, settings]) => {
        setForm(prev => ({ ...prev, invoice_number: num, vat_rate: settings.default_vat_rate ?? 5 }));
      });
    }
  }, [editInvoice, open, defaultClientName]);

  useEffect(() => {
    if (open) {
      base44.entities.Client.list('-created_date', 200).catch(() => []).then((cl) => {
        setClients(cl || []);
        if (defaultClientName && !editInvoice) {
          const c = (cl || []).find((x) => x.name === defaultClientName);
          if (c) {
            setForm((prev) => ({
              ...prev,
              client_name: c.name,
              client_email: c.email || '',
              client_phone: c.phone || '',
              client_address: c.address || '',
              client_trn: c.trn || '',
              contact_person: c.contact_person || '',
            }));
          }
        }
      });
      base44.entities.Trip.list('-created_date', 200).catch(() => []).then(setTrips);
    }
  }, [open, defaultClientName, editInvoice]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updatePayment = (field, value) => setPayment(prev => ({ ...prev, [field]: value }));

  const handleClientChange = (value) => {
    const client = clients.find(c => c.name === value);
    if (client) {
      setForm(prev => ({ ...prev, client_name: value, client_email: client.email || '', client_phone: client.phone || '', client_address: client.address || '', client_trn: client.trn || '', contact_person: client.contact_person || '' }));
    } else { update('client_name', value); }
  };

  const handleTripChange = (value) => {
    const trip = trips.find(t => t.trip_number === value);
    setForm(prev => ({ ...prev, trip_id: value, issue_date: trip?.trip_date || prev.issue_date, contact_person: trip?.contact_person || prev.contact_person }));
  };

  const updateItem = (index, field, value) => {
    const items = [...form.line_items];
    items[index] = { ...items[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      items[index].amount = Number(items[index].quantity) * Number(items[index].unit_price);
    }
    setForm(prev => ({ ...prev, line_items: items }));
  };

  const addItem = () => setForm(prev => ({ ...prev, line_items: [...prev.line_items, { ...emptyItem }] }));
  const removeItem = (i) => setForm(prev => ({ ...prev, line_items: prev.line_items.filter((_, idx) => idx !== i) }));

  const subtotal = form.line_items.reduce((s, item) => s + (Number(item.amount) || 0), 0);
  const vatAmount = subtotal * (Number(form.vat_rate) / 100);
  const total = subtotal + vatAmount;
  const payAmount = receivePayment ? Number(payment.amount) || 0 : 0;
  const balanceDue = Math.max(0, total - payAmount);
  const resultingStatus = payAmount <= 0 ? form.status : (payAmount >= total ? 'paid' : 'partially_paid');
  const inputCls = "bg-background/50 border-border backdrop-blur-sm";

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...form,
        subtotal, vat_amount: vatAmount, total_amount: total,
        vat_rate: Number(form.vat_rate),
        status: resultingStatus,
        paid_amount: payAmount,
      };
      let invoiceId = editInvoice?.id;
      let invoiceNumber = form.invoice_number;
      if (editInvoice) {
        await updateInvoice.mutateAsync({ id: editInvoice.id, data });
      } else {
        const created = await createInvoice.mutateAsync(data);
        invoiceId = created?.id;
        invoiceNumber = created?.invoice_number || form.invoice_number;
      }

      // Create linked client payment when a payment is received at creation
      if (receivePayment && payAmount > 0 && invoiceId) {
        const d = new Date();
        const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        let reference = payment.reference;
        if (!reference) {
          const existing = await base44.entities.ClientPayment.list('-created_date', 200).catch(() => []);
          const prefix = `PAY-${ymd}-`;
          let maxSeq = 0;
          (existing || []).forEach(p => {
            if (p.reference_number?.startsWith(prefix)) {
              const seq = parseInt(p.reference_number.slice(prefix.length), 10);
              if (seq > maxSeq) maxSeq = seq;
            }
          });
          reference = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
        }
        await createPayment.mutateAsync({
          reference_number: reference,
          client_name: form.client_name,
          amount: payAmount,
          payment_date: payment.date,
          payment_mode: payment.mode,
          allocated_invoices: [{
            invoice_id: invoiceId,
            invoice_number: invoiceNumber,
            invoice_total: total,
            allocated_amount: payAmount,
            is_selected: true,
          }],
          unapplied_balance: 0,
          status: 'completed',
          notes: payment.notes,
        });
      }

      onSaved?.();
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-card/80 backdrop-blur-2xl border border-white/[0.08] p-0 max-h-screen overflow-y-auto w-full sm:max-w-2xl lg:max-w-5xl rounded-l-2xl shadow-2xl">
        {/* Hero header */}
        <div className="relative overflow-hidden px-6 pt-6 pb-5 pl-14 border-b border-white/[0.06]">
          <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 80% at 0% 0%, rgba(59,130,246,0.15), transparent 70%)' }} />
          <SheetHeader className="relative">
            <div className="flex items-center justify-between pr-12">
              <div>
                <SheetTitle className="font-display text-foreground text-lg flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-primary" />
                  {editInvoice ? 'Edit Invoice' : t('new_invoice')}
                </SheetTitle>
                <p className="text-[11px] text-muted-foreground mt-1 font-mono">{form.invoice_number || '—'}</p>
              </div>
              <StatusPill status={resultingStatus} />
            </div>
          </SheetHeader>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start px-6 pt-5">
          {/* Left: form */}
          <div className="space-y-5">
            <Section title="Client" icon={User}>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">{t('client')}</Label>
                <Input list="invoice-clients" value={form.client_name} onChange={e => handleClientChange(e.target.value)} className={inputCls} placeholder="Select or type client name" />
                <datalist id="invoice-clients">{clients.map(c => <option key={c.id} value={c.name} />)}</datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Trip # (link trip)</Label>
                  <Input list="invoice-trips" value={form.trip_id} onChange={e => handleTripChange(e.target.value)} placeholder="Auto-fills date" className={inputCls} />
                  <datalist id="invoice-trips">{trips.map(tr => <option key={tr.id} value={tr.trip_number} />)}</datalist>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Contact Person</Label>
                  <Input value={form.contact_person} onChange={e => update('contact_person', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Email</Label>
                  <Input type="email" value={form.client_email} onChange={e => update('client_email', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Phone</Label>
                  <Input value={form.client_phone} onChange={e => update('client_phone', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Address</Label>
                  <Input value={form.client_address} onChange={e => update('client_address', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">TRN</Label>
                  <Input value={form.client_trn} onChange={e => update('client_trn', e.target.value)} className={inputCls} />
                </div>
              </div>
            </Section>

            <Section title="Invoice Details" icon={FileText}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Invoice #</Label>
                  <Input value={form.invoice_number} onChange={e => update('invoice_number', e.target.value)} className={`${inputCls} font-mono text-xs`} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label>
                  <Select value={form.status} onValueChange={v => update('status', v)} disabled={payAmount > 0}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => (
                        <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">{t('issue_date')}</Label>
                  <Input type="date" value={form.issue_date} onChange={e => update('issue_date', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">{t('due_date')}</Label>
                  <Input type="date" value={form.due_date} onChange={e => update('due_date', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">VAT %</Label>
                  <Input type="number" value={form.vat_rate} onChange={e => update('vat_rate', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Payment Terms</Label>
                  <Input value={form.payment_terms} onChange={e => update('payment_terms', e.target.value)} className={inputCls} />
                </div>
              </div>
            </Section>

            <Section title="Line Items" icon={Sparkles}>
              <div className="space-y-2.5">
                {form.line_items.map((item, i) => (
                  <div key={i} className="glass-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">Item {i + 1}</span>
                      {form.line_items.length > 1 && (
                        <button onClick={() => removeItem(i)} className="text-rose-400 hover:text-rose-300 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder={t('description')} className={`${inputCls} text-sm`} />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">{t('quantity')}</Label>
                        <Input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} className={`${inputCls} text-sm`} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">{t('unit_price')}</Label>
                        <Input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} className={`${inputCls} text-sm`} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">{t('amount')}</Label>
                        <Input value={formatCurrency(item.amount)} readOnly className={`${inputCls} opacity-60 text-sm`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={addItem} className="w-full border-dashed border-border">
                <Plus className="w-4 h-4 mr-1.5" /> {t('add_item')}
              </Button>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">{t('notes')}</Label>
                <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} className={inputCls} />
              </div>
            </Section>

            {/* Payment capture */}
            <Section title="Payment" icon={CreditCard}>
              <div className="glass-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Receive payment now</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Capture a client payment and link it to this invoice. Status syncs automatically.</p>
                </div>
                <Switch checked={receivePayment} onCheckedChange={setReceivePayment} />
              </div>
              {receivePayment && (
                <div className="space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Amount Received</Label>
                      <Input type="number" value={payment.amount} onChange={e => updatePayment('amount', e.target.value)} className={inputCls} placeholder="0.00" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Payment Mode</Label>
                      <Select value={payment.mode} onValueChange={v => updatePayment('mode', v)}>
                        <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Payment Date</Label>
                      <Input type="date" value={payment.date} onChange={e => updatePayment('date', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Reference (optional)</Label>
                      <Input value={payment.reference} onChange={e => updatePayment('reference', e.target.value)} className={inputCls} placeholder="Auto-generated" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5">Payment Notes</Label>
                    <Textarea value={payment.notes} onChange={e => updatePayment('notes', e.target.value)} rows={2} className={inputCls} placeholder="Notes for this payment..." />
                  </div>
                </div>
              )}
            </Section>
          </div>

          {/* Right: live summary + payment breakdown */}
          <div className="hidden lg:block">
            <div className="sticky top-4 space-y-3">
              <div className="glass-card p-4 space-y-3">
                <p className="eyebrow">Live Calculation</p>
                <div className="space-y-2 max-h-[180px] overflow-y-auto thin-scroll">
                  {form.line_items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-muted-foreground truncate pr-2">{item.description || `Item ${i + 1}`}</span>
                      <span className="text-foreground tabular-nums flex-shrink-0">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                  {form.line_items.length === 0 && <p className="text-xs text-muted-foreground italic">No items yet</p>}
                </div>
                <div className="border-t border-white/10 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('subtotal')}</span>
                    <span className="text-foreground font-medium tabular-nums">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('vat')} ({form.vat_rate}%)</span>
                    <span className="text-foreground font-medium tabular-nums">{formatCurrency(vatAmount)}</span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-foreground">{t('total')}</span>
                    <span className="text-xl font-bold text-primary tabular-nums font-display">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment breakdown */}
              {receivePayment && payAmount > 0 && (
                <div className="glass-card p-4 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <p className="eyebrow flex items-center gap-1.5"><Wallet className="w-3 h-3" /> Payment Breakdown</p>
                    <StatusPill status={resultingStatus} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoice Total</span>
                    <span className="text-foreground font-medium tabular-nums">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount Received</span>
                    <span className="text-emerald-400 font-medium tabular-nums">{formatCurrency(payAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-white/10 pt-2.5">
                    <span className="text-muted-foreground">Balance Due</span>
                    <span className={`font-bold tabular-nums ${balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{formatCurrency(balanceDue)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.06] capitalize">{payment.mode.replace(/_/g, ' ')}</span>
                    <span>·</span>
                    <span>{payment.date}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile live calc */}
          <div className="lg:hidden glass-card p-4 space-y-2">
            <p className="eyebrow">Live Calculation</p>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('subtotal')}</span><span className="text-foreground tabular-nums">{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('vat')} ({form.vat_rate}%)</span><span className="text-foreground tabular-nums">{formatCurrency(vatAmount)}</span></div>
            <div className="border-t border-white/10 pt-2 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-foreground">{t('total')}</span>
              <span className="text-lg font-bold text-primary tabular-nums font-display">{formatCurrency(total)}</span>
            </div>
            {receivePayment && payAmount > 0 && (
              <div className="border-t border-white/10 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-foreground">Balance Due</span>
                <span className={`text-base font-bold tabular-nums ${balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{formatCurrency(balanceDue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-2 px-6 py-4 border-t border-border/50 sticky bottom-0 bg-card/80 backdrop-blur-xl">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">{t('cancel')}</Button>
          <div className="flex-1" />
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 min-w-[160px] btn-lightning">
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
            {saving ? t('loading') : (editInvoice ? 'Save Invoice' : 'Create Invoice')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="border-t border-white/[0.04] pt-4 first:border-t-0 first:pt-0">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-primary/80" />}
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}