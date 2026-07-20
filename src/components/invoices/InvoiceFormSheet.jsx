import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/formatters';
import { ChevronLeft, ChevronRight, Check, Plus, Trash2 } from 'lucide-react';
import { useInvoiceCreate, useInvoiceUpdate } from '@/hooks/useEntityQueries';
import { generateInvoiceNumber, getCompanySettings } from '@/lib/companySettings';

const STEPS = ['client', 'line_items', 'review_submit'];
const emptyItem = { description: '', quantity: 1, unit_price: 0, amount: 0 };

export default function InvoiceFormSheet({ open, onOpenChange, editInvoice, onSaved }) {
  const { t } = useI18n();
  const createInvoice = useInvoiceCreate();
  const updateInvoice = useInvoiceUpdate();
  const [step, setStep] = useState(0);
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
    setStep(0);
  }, [editInvoice, open]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (open) {
      Promise.all([
        base44.entities.Client.list('-created_date', 200).catch(() => []),
        base44.entities.Trip.list('-created_date', 200).catch(() => []),
      ]).then(([c, t]) => { setClients(c || []); setTrips(t || []); });
    }
  }, [open]);

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

  const handleSave = async () => {
    setSaving(true);
    const data = {
      ...form,
      subtotal, vat_amount: vatAmount, total_amount: total,
      vat_rate: Number(form.vat_rate),
    };
    if (editInvoice) {
      await updateInvoice.mutateAsync({ id: editInvoice.id, data });
    } else {
      await createInvoice.mutateAsync(data);
    }
    setSaving(false);
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border w-full sm:max-w-lg overflow-y-auto" side="right">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-foreground">
            {editInvoice ? t('edit') + ' Invoice' : t('new_invoice')}
          </SheetTitle>
          <div className="flex items-center gap-2 mt-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1 h-1 rounded-full transition-colors" style={{ backgroundColor: i <= step ? 'hsl(199 89% 48%)' : 'hsl(220 20% 16%)' }} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t('step')} {step + 1} {t('of')} 3</p>
        </SheetHeader>

        <div className="space-y-4">
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1.5">{t('client')}</Label>
                  <Input list="invoice-clients" value={form.client_name} onChange={e => handleClientChange(e.target.value)} className="bg-background border-border" />
                  <datalist id="invoice-clients">{clients.map(c => <option key={c.id} value={c.name} />)}</datalist>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1.5">Trip # (link trip — auto-fills date)</Label>
                  <Input list="invoice-trips" value={form.trip_id} onChange={e => handleTripChange(e.target.value)} placeholder="Select trip" className="bg-background border-border" />
                  <datalist id="invoice-trips">{trips.map(tr => <option key={tr.id} value={tr.trip_number} />)}</datalist>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1.5">Contact Person</Label>
                  <Input value={form.contact_person} onChange={e => update('contact_person', e.target.value)} placeholder="Contact person / department" className="bg-background border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Email</Label>
                  <Input type="email" value={form.client_email} onChange={e => update('client_email', e.target.value)} className="bg-background border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Phone</Label>
                  <Input value={form.client_phone} onChange={e => update('client_phone', e.target.value)} className="bg-background border-border" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1.5">Address</Label>
                  <Input value={form.client_address} onChange={e => update('client_address', e.target.value)} className="bg-background border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">TRN</Label>
                  <Input value={form.client_trn} onChange={e => update('client_trn', e.target.value)} className="bg-background border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Invoice #</Label>
                  <Input value={form.invoice_number} onChange={e => update('invoice_number', e.target.value)} className="bg-background border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">{t('issue_date')}</Label>
                  <Input type="date" value={form.issue_date} onChange={e => update('issue_date', e.target.value)} className="bg-background border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">{t('due_date')}</Label>
                  <Input type="date" value={form.due_date} onChange={e => update('due_date', e.target.value)} className="bg-background border-border" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label>
                  <Select value={form.status} onValueChange={v => update('status', v)}>
                    <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => (
                        <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">VAT %</Label>
                  <Input type="number" value={form.vat_rate} onChange={e => update('vat_rate', e.target.value)} className="bg-background border-border" />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="space-y-3">
                {form.line_items.map((item, i) => (
                  <div key={i} className="glass-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                      {form.line_items.length > 1 && (
                        <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-300 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder={t('description')} className="bg-background border-border text-sm" />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">{t('quantity')}</Label>
                        <Input type="number" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} className="bg-background border-border text-sm" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">{t('unit_price')}</Label>
                        <Input type="number" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} className="bg-background border-border text-sm" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">{t('amount')}</Label>
                        <Input value={formatCurrency(item.amount)} readOnly className="bg-muted/30 border-border text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={addItem} className="w-full border-dashed border-border">
                <Plus className="w-4 h-4 mr-1.5" /> {t('add_item')}
              </Button>
              <div className="glass-card p-4 space-y-2 mt-3">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('subtotal')}</span><span className="text-foreground">{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('vat')} ({form.vat_rate}%)</span><span className="text-foreground">{formatCurrency(vatAmount)}</span></div>
                <div className="border-t border-border pt-2 flex justify-between text-sm font-bold"><span className="text-foreground">{t('total')}</span><span className="text-primary">{formatCurrency(total)}</span></div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">{t('notes')}</Label>
                <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} className="bg-background border-border" />
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="glass-card p-4 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Client</h3>
                <p className="text-sm text-foreground font-medium">{form.client_name}</p>
                {form.contact_person && <p className="text-xs text-primary">{form.contact_person}</p>}
                <p className="text-xs text-muted-foreground">{form.client_email} · {form.client_phone}</p>
                <p className="text-xs text-muted-foreground">{form.client_address}</p>
              </div>
              <div className="glass-card p-4 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invoice</h3>
                <Row label="Number" value={form.invoice_number || 'Auto'} />
                <Row label={t('issue_date')} value={form.issue_date} />
                <Row label={t('due_date')} value={form.due_date} />
                <Row label={t('status')} value={form.status} />
              </div>
              <div className="glass-card p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('line_items')}</h3>
                {form.line_items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-foreground">{item.description || `Item ${i + 1}`}</span>
                    <span className="text-foreground font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="mt-3 pt-2 border-t border-border space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('subtotal')}</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('vat')}</span><span>{formatCurrency(vatAmount)}</span></div>
                  <div className="flex justify-between text-sm font-bold"><span>{t('total')}</span><span className="text-primary">{formatCurrency(total)}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-8">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1 border-border">
              <ChevronLeft className="w-4 h-4 mr-1" /> {t('previous')}
            </Button>
          )}
          {step < 2 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !form.client_name} className="flex-1 bg-primary hover:bg-primary/90">
              {t('next')} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">
              <Check className="w-4 h-4 mr-1" /> {saving ? t('loading') : t('submit')}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between"><span className="text-xs text-muted-foreground">{label}</span><span className="text-sm text-foreground">{value || '—'}</span></div>
  );
}