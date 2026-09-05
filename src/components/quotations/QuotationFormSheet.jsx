import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, FileDown, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadQuotationPDF } from '@/lib/quotationPdf';
import { generateNextQuotationNumber } from '@/lib/quotationSequence';
import { useToast } from '@/components/ui/use-toast';
import QuotationPreview from '@/components/quotations/QuotationPreview';
import ClientAutocomplete from '@/components/quotations/ClientAutocomplete';
import DatePicker from '@/components/common/DatePicker';

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
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-6xl h-[100dvh] sm:h-[90vh] overflow-hidden bg-background p-0 flex flex-col gap-0">
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border flex-shrink-0 flex flex-row items-start justify-between gap-3">
          <div>
            <DialogTitle>{isEdit ? 'Edit Quotation' : 'New Quotation'}</DialogTitle>
            <DialogDescription>Left: fill in details · Right: live PDF preview</DialogDescription>
          </div>
          <DialogClose
            aria-label="Close"
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/60 hover:bg-primary/15 border border-border/60 hover:border-primary/40 text-muted-foreground hover:text-primary transition-all flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </DialogClose>
        </DialogHeader>

        <div className="sm:hidden flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/30 flex-shrink-0">
          <button type="button" onClick={() => setMobileView('form')} className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors', mobileView === 'form' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>Edit Form</button>
          <button type="button" onClick={() => setMobileView('preview')} className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors', mobileView === 'preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>Live Preview</button>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* LEFT: Form */}
          <div className={cn('w-full sm:w-1/2 min-h-0 flex flex-col sm:border-r border-border', mobileView === 'form' ? 'flex' : 'hidden sm:flex')}>
            <div className="flex-1 overflow-y-auto thin-scroll px-4 sm:px-5 py-4 space-y-4">
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
                <DatePicker value={form.issue_date || ''} onChange={v => update('issue_date', v)} />
              </div>
              <div>
                <Label>Valid Until</Label>
                <DatePicker value={form.valid_until || ''} onChange={v => update('valid_until', v)} />
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
                  <div key={idx} className="p-2.5 rounded-lg border border-border bg-muted/30 space-y-2">
                    <div className="flex items-start gap-2">
                      <Input value={item.description || ''} onChange={e => updateItem(idx, 'description', e.target.value)} className="h-8 text-xs flex-1" placeholder="Description" />
                      <Button size="icon" variant="ghost" onClick={() => removeItem(idx)} className="h-8 w-8 text-destructive flex-shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div>
                        <Label className="text-[10px]">Qty</Label>
                        <Input type="number" value={item.quantity || 0} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Unit Price</Label>
                        <Input type="number" value={item.unit_price || 0} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))} className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Amount</Label>
                        <Input value={Number(item.amount || 0).toFixed(2)} readOnly className="h-8 text-xs bg-muted/50" />
                      </div>
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

            </div>
            {/* Actions — pinned at bottom */}
            <div className="flex gap-2 pt-3 pb-4 px-4 sm:px-5 bg-background/95 backdrop-blur-sm border-t border-border flex-shrink-0">
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
            <div className="h-[calc(100%-36px)]" style={{ zoom: 0.8 }}>
              <QuotationPreview form={form} settings={settings} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}