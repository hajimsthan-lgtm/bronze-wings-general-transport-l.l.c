import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileDown, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';
import { downloadAgreementPDF } from '@/lib/agreementPdf';
import { useToast } from '@/components/ui/use-toast';

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
    content: '',
    terms_conditions: 'Payment due within 60 days.',
    notes: '',
  });

  useEffect(() => {
    if (agreement) {
      setForm({
        ...agreement,
        start_date: fmtDate(agreement.start_date),
        end_date: fmtDate(agreement.end_date),
      });
    } else {
      setForm(f => ({ ...f, agreement_number: `AG-${Date.now().toString().slice(-6)}` }));
    }
  }, [agreement]);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
      const payload = { ...form, amount: Number(form.amount) || 0 };
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
      const settings = await getCompanySettings();
      await downloadAgreementPDF(form, settings);
      toast({ title: 'PDF downloaded' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'PDF error', description: e.message });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-background">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Edit Agreement' : 'New Agreement'}</SheetTitle>
          <SheetDescription>Create an agreement using the invoice letterhead.</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-8">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Agreement Number</Label>
              <Input value={form.agreement_number} onChange={e => update('agreement_number', e.target.value)} />
            </div>
            <div className="col-span-2">
              <Label>Client Name *</Label>
              <Input value={form.client_name || ''} onChange={e => update('client_name', e.target.value)} />
            </div>
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
              <Label>Agreement Title *</Label>
              <Input value={form.title || ''} onChange={e => update('title', e.target.value)} />
            </div>
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
              <Input type="number" value={form.amount || 0} onChange={e => update('amount', Number(e.target.value))} />
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

          <div>
            <Label>Agreement Content</Label>
            <Textarea
              value={form.content || ''}
              onChange={e => update('content', e.target.value)}
              rows={8}
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

          <div className="flex gap-2 pt-2">
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
      </SheetContent>
    </Sheet>
  );
}