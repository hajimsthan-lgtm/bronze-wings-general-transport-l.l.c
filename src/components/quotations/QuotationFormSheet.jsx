import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, FileDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadQuotationPDF } from '@/lib/quotationPdf';
import { generateNextQuotationNumber } from '@/lib/quotationSequence';
import { useToast } from '@/components/ui/use-toast';
import QuotationPreview from '@/components/quotations/QuotationPreview';
import ClientAutocomplete from '@/components/quotations/ClientAutocomplete';

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toISOString().split('T')[0];
}

export default function QuotationFormSheet({ open, onOpenChange, quotation, onSaved }) {
  const { toast } = useToast();
  const isEdit = !!quotation;
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [settings, setSettings] = useState({});
  const [mobileView, setMobileView] = useState('form');
  const [form, setForm] = useState({
    quotation_number: '',
    client_name: '',
    contact_person: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    client_trn: '',
    subject: '',
    lpo_ref: '',
    issue_date: fmtDate(new Date()),
    valid_until: '',
    vat_rate: 5,
    notes: '',
    terms_conditions: 'Payment due within 60 days.',
    line_items: [{ description: '', quantity: 1, unit_price: 0, amount: 0 }],
  });

  useEffect(() => {
    getCompanySettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (quotation) {
      setForm({
        ...quotation,
        issue_date: fmtDate(quotation.issue_date),
        valid_until: fmtDate(quotation.valid_until),
        line_items: (quotation.line_items && quotation.line_items.length > 0)
          ? quotation.line_items
          : [{ description: '', quantity: 1, unit_price: 0, amount: 0 }],
      });
    } else {
      generateNextQuotationNumber().then(num => {
        setForm(f => ({ ...f, quotation_number: num }));
      });
    }
  }, [quotation]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updateItem = (idx, k, v) => {
    setForm(f => {
      const items = [...f.line_items];
      items[idx] = { ...items[idx], [k]: v };
      const qty = Number(items[idx].quantity) || 0;
      const price = Number(items[idx].unit_price) || 0;
      items[idx].amount = Number((qty * price).toFixed(2));
      return { ...f, line_items: items };
    });
  };

  const addItem = () => setForm(f => ({ ...f, line_items: [...f.line_items, { description: '', quantity: 1, unit_price: 0, amount: 0 }] }));
  const removeItem = (idx) => setForm(f => ({ ...f, line_items: f.line_items.filter((_, i) => i !== idx) }));

  const subtotal = (form.line_items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const vatRate = Number(form.vat_rate) || 0;
  const vatAmount = subtotal * vatRate / 100;
  const total = subtotal + vatAmount;

  const handleSave = async () => {
    if (!form.client_name?.trim()) {
      toast({ variant: 'destructive', title: 'Client name is required' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        vat_rate: vatRate,
        subtotal,
        vat_amount: vatAmount,
        total_amount: total,
        issue_date: form.issue_date || fmtDate(new Date()),
      };
      let result;
      if (isEdit) {
        result = await base44.entities.Quotation.update(quotation.id, payload);
      } else {
        result = await base44.entities.Quotation.create(payload);
      }
      toast({ title: isEdit ? 'Quotation updated' : 'Quotation created' });
      onOpenChange(false);
      if (onSaved) onSaved(result);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const s = await getCompanySettings();
      const payload = {
        ...form,
        subtotal,
        vat_amount: vatAmount,
        total_amount: total,
      };
      await downloadQuotationPDF(payload, s);
      toast({ title: 'PDF downloaded' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'PDF error', description: e.message });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl h-[90vh] overflow-hidden bg-background p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <DialogTitle>{isEdit ? 'Edit Quotation' : 'New Quotation'}</DialogTitle>
          <DialogDescription>Left: fill in details · Right: live PDF preview</DialogDescription>
        </DialogHeader>

        <div className="sm:hidden flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/30 flex-shrink-0">
          <button type="button" onClick={() => setMobileView('form')} className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors', mobileView === 'form' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>Edit Form</button>
          <button type="button" onClick={() => setMobileView('preview')} className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors', mobileView === 'preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>Live Preview</button>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* LEFT: Form */}
          <div className={cn('w-full sm:w-1/2 overflow-y-auto px-5 py-4 space-y-4 sm:border-r border-border', mobileView === 'form' ? 'flex flex-col' : 'hidden sm:flex flex-col')}>
            {/* Client details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Quotation Number</Label>
                <Input value={form.quotation_number} onChange={e => update('quotation_number', e.target.value)} />
              </div>
              <ClientAutocomplete form={form} update={update} />
              <div>
                <Label>Contact Person</Label>
                <Input value={form.contact_person || ''} onChange={e => update('contact_person', e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.client_phone || ''} onChange={e => update('client_phone', e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.client_email || ''} onChange={e => update('client_email', e.target.value)} />
              </div>
              <div>
                <Label>TRN</Label>
                <Input value={form.client_trn || ''} onChange={e => update('client_trn', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Address</Label>
                <Input value={form.client_address || ''} onChange={e => update('client_address', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label>Subject</Label>
                <Input value={form.subject || ''} onChange={e => update('subject', e.target.value)} placeholder="Transport services quotation" />
              </div>
              <div>
                <Label>Issue Date</Label>
                <Input type="date" value={form.issue_date || ''} onChange={e => update('issue_date', e.target.value)} />
              </div>
              <div>
                <Label>Valid Until</Label>
                <Input type="date" value={form.valid_until || ''} onChange={e => update('valid_until', e.target.value)} />
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Line Items</Label>
                <Button size="sm" variant="outline" onClick={addItem}><Plus className="w-4 h-4 mr-1" />Add</Button>
              </div>
              <div className="space-y-2">
                {(form.line_items || []).map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1.5 items-end p-2 rounded-lg border border-border bg-muted/30">
                    <div className="col-span-5">
                      <Label className="text-[10px]">Description</Label>
                      <Input value={item.description || ''} onChange={e => updateItem(idx, 'description', e.target.value)} className="h-8 text-xs" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[10px]">Qty</Label>
                      <Input type="number" value={item.quantity || 0} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="h-8 text-xs" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[10px]">Unit Price</Label>
                      <Input type="number" value={item.unit_price || 0} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))} className="h-8 text-xs" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-[10px]">Amount</Label>
                      <Input value={Number(item.amount || 0).toFixed(2)} readOnly className="h-8 text-xs bg-muted/50" />
                    </div>
                    <div className="col-span-1">
                      <Button size="icon" variant="ghost" onClick={() => removeItem(idx)} className="h-8 w-8 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-48 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal:</span><span className="font-mono">AED {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">VAT %:</span>
                  <Input type="number" value={form.vat_rate} onChange={e => update('vat_rate', Number(e.target.value))} className="h-7 w-16 text-xs" />
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">VAT:</span><span className="font-mono">AED {vatAmount.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold border-t border-border pt-1"><span>Total:</span><span className="font-mono">AED {total.toFixed(2)}</span></div>
              </div>
            </div>

            {/* Terms */}
            <div>
              <Label>Terms & Conditions</Label>
              <Textarea value={form.terms_conditions || ''} onChange={e => update('terms_conditions', e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes || ''} onChange={e => update('notes', e.target.value)} rows={2} />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 pb-6">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {saving ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
              </Button>
              <Button onClick={handleDownload} disabled={downloading} variant="outline">
                {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                PDF
              </Button>
            </div>
          </div>

          {/* RIGHT: Live Preview */}
          <div className={cn('w-full sm:w-1/2 overflow-hidden bg-muted/10', mobileView === 'preview' ? 'flex flex-col' : 'hidden sm:flex flex-col')}>
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Preview
              </div>
            </div>
            <div className="h-[calc(100%-36px)]">
              <QuotationPreview form={form} settings={settings} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}