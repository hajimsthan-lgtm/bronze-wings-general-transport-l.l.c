import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { useInvoiceCreate, useInvoiceUpdate } from '@/hooks/useEntityQueries';
import { generateInvoiceNumber, getCompanySettings } from '@/lib/companySettings';

const emptyItem = { description: '', quantity: 1, unit_price: 0, amount: 0 };

export default function InvoiceFormSheet({ open, onOpenChange, editInvoice, onSaved }) {
  const { t } = useI18n();
  const createInvoice = useInvoiceCreate();
  const updateInvoice = useInvoiceUpdate();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [trips, setTrips] = useState([]);
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
    } else {
      setForm({
        client_name: '', client_email: '', client_phone: '', client_address: '', client_trn: '', contact_person: '',
        invoice_number: '', issue_date: new Date().toISOString().split('T')[0],
        due_date: '', status: 'draft', vat_rate: 5, notes: '', payment_terms: 'Net 30',
        trip_id: '', line_items: [{ ...emptyItem }],
      });
      Promise.all([generateInvoiceNumber(), getCompanySettings()]).then(([num, settings]) => {
        setForm(prev => ({ ...prev, invoice_number: num, vat_rate: settings.default_vat_rate ?? 5 }));
      });
    }
  }, [editInvoice, open]);

  useEffect(() => {
    if (open) {
      Promise.all([
        base44.entities.Client.list('-created_date', 200).catch(() => []),
        base44.entities.Trip.list('-created_date', 200).catch(() => []),
      ]).then(([c, trp]) => { setClients(c || []); setTrips(trp || []); });
    }
  }, [open]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

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
  const inputCls = "bg-background/50 border-border backdrop-blur-sm";

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        ...form,
        subtotal, vat_amount: vatAmount, total_amount: total,
        vat_rate: Number(form.vat_rate),
      };
      if (editInvoice) await updateInvoice.mutateAsync({ id: editInvoice.id, data });
      else await createInvoice.mutateAsync(data);
      onSaved?.();
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/80 backdrop-blur-2xl border border-white/[0.08] max-w-4xl max-h-[92vh] overflow-y-auto p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-display text-foreground text-lg">
            {editInvoice ? t('edit') + ' Invoice' : t('new_invoice')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* Left: form */}
          <div className="space-y-5">
            <Section title="Client">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">{t('client')}</Label>
                <Input list="invoice-clients" value={form.client_name} onChange={e => handleClientChange(e.target.value)} className={inputCls} />
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

            <Section title="Invoice Details">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Invoice #</Label>
                  <Input value={form.invoice_number} onChange={e => update('invoice_number', e.target.value)} className={`${inputCls} font-mono text-xs`} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label>
                  <Select value={form.status} onValueChange={v => update('status', v)}>
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

            <Section title="Line Items">
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
          </div>

          {/* Right: live calculation */}
          <div className="hidden lg:block">
            <div className="sticky top-4 space-y-3">
              <div className="glass-card p-4 space-y-3">
                <p className="eyebrow">Live Calculation</p>
                <div className="space-y-2">
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
              <div className="glass-card p-3">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Amounts update live as you edit quantities and unit prices. VAT applies the company default rate.
                </p>
              </div>
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
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">{t('cancel')}</Button>
          <div className="flex-1" />
          <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 min-w-[140px]">
            {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Check className="w-4 h-4 mr-1.5" />}
            {saving ? t('loading') : t('submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }) {
  return (
    <div className="border-t border-white/[0.04] pt-4 first:border-t-0 first:pt-0">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}