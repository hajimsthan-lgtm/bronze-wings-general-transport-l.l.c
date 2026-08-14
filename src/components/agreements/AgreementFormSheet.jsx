import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileDown, Loader2, Plus, Trash2, Building2, FileSignature, ScrollText, X } from 'lucide-react';
import Section from '@/components/trips/Section';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadAgreementPDF } from '@/lib/agreementPdf';
import { useToast } from '@/components/ui/use-toast';
import AgreementPreview from '@/components/agreements/AgreementPreview';
import ClientAutocomplete from '@/components/quotations/ClientAutocomplete';

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toISOString().split('T')[0];
}

export default function AgreementFormSheet({ open, onOpenChange, agreement, onSaved }) {
  const { toast } = useToast();
  const isEdit = !!agreement;
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [settings, setSettings] = useState({});
  const [mobileView, setMobileView] = useState('form');
  const [form, setForm] = useState({
    agreement_number: '',
    client_name: '',
    contact_person: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    client_trn: '',
    title: 'Service Agreement',
    agreement_type: 'service',
    start_date: fmtDate(new Date()),
    end_date: '',
    amount: 0,
    line_items: [{ description: '', quantity: 1, unit_price: 0, amount: 0 }],
    content: '',
    terms_conditions: 'Payment due within 60 days.',
    notes: '',
  });

  useEffect(() => {
    getCompanySettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    if (agreement) {
      setForm({
        ...agreement,
        start_date: fmtDate(agreement.start_date),
        end_date: fmtDate(agreement.end_date),
        line_items: (agreement.line_items && agreement.line_items.length > 0)
          ? agreement.line_items
          : [{ description: '', quantity: 1, unit_price: 0, amount: 0 }],
      });
    } else {
      setForm(f => ({ ...f, agreement_number: `AG-${Date.now().toString().slice(-6)}` }));
    }
  }, [agreement]);

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

  const itemsTotal = (form.line_items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const hasItems = (form.line_items || []).some(i => i.description && i.description.trim());

  const handleSave = async () => {
    if (!form.client_name?.trim()) {
      toast({ variant: 'destructive', title: 'Client name is required' });
      return;
    }
    if (!form.title?.trim()) {
      toast({ variant: 'destructive', title: 'Title is required' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: hasItems ? itemsTotal : (Number(form.amount) || 0),
        line_items: hasItems ? form.line_items : [],
      };
      let result;
      if (isEdit) {
        result = await base44.entities.Agreement.update(agreement.id, payload);
      } else {
        result = await base44.entities.Agreement.create(payload);
      }
      toast({ title: isEdit ? 'Agreement updated' : 'Agreement created' });
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
      await downloadAgreementPDF({ ...form, amount: hasItems ? itemsTotal : form.amount }, s);
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
        className="w-full max-w-6xl h-[90vh] overflow-hidden bg-background p-0 flex flex-col gap-0 rounded-xl">
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0 space-y-1 flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <DialogTitle>{isEdit ? 'Edit Agreement' : 'New Agreement'}</DialogTitle>
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
          <div className={cn('w-full sm:w-1/2 overflow-y-auto px-5 py-5 space-y-4 sm:border-r border-border', mobileView === 'form' ? 'flex flex-col' : 'hidden sm:flex flex-col')}>
            {/* CLIENT SECTION */}
            <Section title="Client" icon={Building2} accent="59, 130, 246" delay={0}>
              <ClientAutocomplete form={form} update={update} />
              <div className="grid grid-cols-2 gap-3">
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
              </div>
              <div>
                <Label>Address</Label>
                <Input value={form.client_address || ''} onChange={e => update('client_address', e.target.value)} />
              </div>
            </Section>

            {/* AGREEMENT DETAILS SECTION */}
            <Section title="Agreement Details" icon={FileSignature} accent="168, 85, 247" delay={40}>
              <div>
                <Label>Agreement Number</Label>
                <Input value={form.agreement_number} onChange={e => update('agreement_number', e.target.value)} />
              </div>
              <div>
                <Label>Agreement Title *</Label>
                <Input value={form.title || ''} onChange={e => update('title', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <select
                    value={form.agreement_type || 'service'}
                    onChange={e => update('agreement_type', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="service">Service</option>
                    <option value="rental">Rental</option>
                    <option value="transport">Transport</option>
                    <option value="partnership">Partnership</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Amount (AED)</Label>
                  <Input
                    type="number"
                    value={hasItems ? itemsTotal.toFixed(2) : (form.amount || 0)}
                    onChange={e => update('amount', Number(e.target.value))}
                    disabled={hasItems}
                    className={hasItems ? 'bg-muted/50' : ''}
                  />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={form.start_date || ''} onChange={e => update('start_date', e.target.value)} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={form.end_date || ''} onChange={e => update('end_date', e.target.value)} />
                </div>
              </div>
            </Section>

            {/* SERVICE ITEMS SECTION */}
            <Section title="Service Items" icon={Plus} accent="16, 185, 129" delay={80}>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Add line items for itemized billing</span>
                <Button size="sm" variant="outline" onClick={addItem}><Plus className="w-3.5 h-3.5 mr-1" />Add Item</Button>
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
              {hasItems && (
                <div className="flex justify-end">
                  <div className="text-sm font-bold border-t border-border pt-1">
                    Total: <span className="font-mono text-primary">AED {itemsTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </Section>

            {/* TERMS SECTION */}
            <Section title="Terms & Content" icon={ScrollText} accent="245, 158, 11" delay={120}>
              <div>
                <Label>Agreement Content</Label>
                <Textarea
                  value={form.content || ''}
                  onChange={e => update('content', e.target.value)}
                  rows={5}
                  placeholder="Enter the full agreement body text..."
                />
              </div>
              <div>
                <Label>Terms & Conditions</Label>
                <Textarea value={form.terms_conditions || ''} onChange={e => update('terms_conditions', e.target.value)} rows={3} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes || ''} onChange={e => update('notes', e.target.value)} rows={2} />
              </div>
            </Section>

            <div className="flex gap-2 pt-1 pb-6">
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
              <AgreementPreview form={{ ...form, amount: hasItems ? itemsTotal : form.amount }} settings={settings} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}