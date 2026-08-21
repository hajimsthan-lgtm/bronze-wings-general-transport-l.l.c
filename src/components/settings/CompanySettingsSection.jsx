import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Building2, Check, Loader2 } from 'lucide-react';
import { getCompanySettings, saveCompanySettings, generateInvoiceNumber } from '@/lib/companySettings';
import { persistManualInvoiceNumber } from '@/lib/invoiceSequence';
import { useToast } from '@/components/ui/use-toast';
import SettingsCard from './SettingsCard';

export default function CompanySettingsSection() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nextNumberPreview, setNextNumberPreview] = useState('');
  const [manualSeq, setManualSeq] = useState('');
  const [auditTrail, setAuditTrail] = useState([]);

  useEffect(() => {
    getCompanySettings()
      .then((s) => {
        setSettings(s);
        setAuditTrail(Array.isArray(s.invoice_seq_audit) ? s.invoice_seq_audit : []);
      })
      .catch(() => toast({ title: 'Could not load company settings', variant: 'destructive' }));
    generateInvoiceNumber().then(setNextNumberPreview).catch(() => {});
  }, []);

  if (!settings) {
    return (
      <SettingsCard icon={Building2} title="Company Settings" description="Logo, details, VAT, invoice prefix">
        <div className="flex items-center gap-3 py-2">
          <Loader2 className="w-5 h-5 animate-spin text-white/40" />
          <span className="text-sm text-white/40">Loading company settings...</span>
        </div>
      </SettingsCard>
    );
  }

  const update = (field, value) => setSettings((prev) => ({ ...prev, [field]: value }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('logo_url', file_url);
      toast({ title: 'Logo uploaded' });
    } catch {
      toast({ title: 'Logo upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const seqNum = Number(manualSeq);
      if (seqNum > 0) {
        const year = new Date().getFullYear();
        const manualNumber = `${year}-${String(seqNum).padStart(4, '0')}`;
        const me = await base44.auth.me().catch(() => null);
        await persistManualInvoiceNumber(manualNumber, nextNumberPreview, me?.full_name || me?.email || 'Unknown', '');
        settings.invoice_last_seq = seqNum;
        settings.invoice_last_year = year;
      }
      await saveCompanySettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: 'Company settings saved' });
      setManualSeq('');
      generateInvoiceNumber().then(setNextNumberPreview).catch(() => {});
      getCompanySettings().then((s) => setAuditTrail(Array.isArray(s.invoice_seq_audit) ? s.invoice_seq_audit : [])).catch(() => {});
    } catch {
      toast({ title: 'Could not save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsCard icon={Building2} title="Company Settings" description="Logo, details, VAT, invoice prefix">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center overflow-hidden flex-shrink-0">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <Building2 className="w-8 h-8 text-white/25" />
          )}
        </div>
        <div>
          <Label className="text-xs text-white/40 mb-1.5 block">Company Logo</Label>
          <Button variant="outline" size="sm" disabled={uploading} asChild>
            <label className="cursor-pointer">
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {uploading ? 'Uploading...' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <div className="sm:col-span-2">
          <Label className="text-xs text-white/40 mb-1.5">Company Name</Label>
          <Input value={settings.company_name} onChange={(e) => update('company_name', e.target.value)} className="bg-white/[0.03] border-white/[0.06]" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs text-white/40 mb-1.5">Tagline</Label>
          <Input value={settings.tagline} onChange={(e) => update('tagline', e.target.value)} className="bg-white/[0.03] border-white/[0.06]" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs text-white/40 mb-1.5">Address</Label>
          <Textarea value={settings.address} onChange={(e) => update('address', e.target.value)} rows={2} className="bg-white/[0.03] border-white/[0.06]" />
        </div>
        <div>
          <Label className="text-xs text-white/40 mb-1.5">Phone 1</Label>
          <Input value={settings.phone1} onChange={(e) => update('phone1', e.target.value)} className="bg-white/[0.03] border-white/[0.06]" />
        </div>
        <div>
          <Label className="text-xs text-white/40 mb-1.5">Phone 2</Label>
          <Input value={settings.phone2} onChange={(e) => update('phone2', e.target.value)} className="bg-white/[0.03] border-white/[0.06]" />
        </div>
        <div>
          <Label className="text-xs text-white/40 mb-1.5">Email</Label>
          <Input value={settings.email} onChange={(e) => update('email', e.target.value)} className="bg-white/[0.03] border-white/[0.06]" />
        </div>
        <div>
          <Label className="text-xs text-white/40 mb-1.5">Website</Label>
          <Input value={settings.website} onChange={(e) => update('website', e.target.value)} className="bg-white/[0.03] border-white/[0.06]" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs text-white/40 mb-1.5">TRN (Tax Registration Number)</Label>
          <Input value={settings.trn || ''} onChange={(e) => update('trn', e.target.value)} className="bg-white/[0.03] border-white/[0.06]" />
        </div>
        <div>
          <Label className="text-xs text-white/40 mb-1.5">Default VAT Rate (%)</Label>
          <Input type="number" value={settings.default_vat_rate} onChange={(e) => update('default_vat_rate', Number(e.target.value))} className="bg-white/[0.03] border-white/[0.06]" />
        </div>
        <div>
          <Label className="text-xs text-white/40 mb-1.5">Invoice Prefix</Label>
          <Input value={settings.invoice_prefix} onChange={(e) => update('invoice_prefix', e.target.value)} className="bg-white/[0.03] border-white/[0.06]" />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <Label className="text-xs text-white/50 mb-2 block font-semibold uppercase tracking-wider">Invoice Number Sequence</Label>
        <p className="text-[11px] text-white/40 mb-2.5">Auto-increments as YYYY-XXXX (e.g. 2026-0001). Manually set the next sequence number below — subsequent invoices continue from there.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/40 mb-1.5">Next Invoice Number (auto)</Label>
            <Input value={nextNumberPreview} readOnly className="bg-white/[0.03] border-white/[0.06] font-mono opacity-60 cursor-not-allowed" />
          </div>
          <div>
            <Label className="text-xs text-white/40 mb-1.5">Manually Set Next Sequence #</Label>
            <Input type="number" min="1" value={manualSeq} onChange={(e) => setManualSeq(e.target.value)} onWheel={(e) => e.target.blur()} placeholder="e.g. 158" className="bg-white/[0.03] border-white/[0.06]" />
          </div>
        </div>
        {auditTrail.length > 0 && (
          <div className="mt-3">
            <Label className="text-xs text-white/40 mb-1.5 block">Recent Manual Overrides</Label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto thin-scroll">
              {auditTrail.slice(0, 10).map((entry, i) => (
                <div key={i} className="text-[11px] text-white/50 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.04]">
                  <span className="font-mono">{entry.from_number || '—'}</span> → <span className="font-mono text-primary">{entry.to_number}</span>
                  <span className="text-white/30 ml-2">by {entry.changed_by || '—'}</span>
                  <span className="text-white/30 ml-2">{entry.changed_date ? new Date(entry.changed_date).toLocaleString() : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <Label className="text-xs text-white/50 mb-2 block font-semibold uppercase tracking-wider">Vendor Rate (Internal)</Label>
        <p className="text-[11px] text-white/40 mb-2.5">Default percentage of trip revenue auto-assigned as the vendor agreed rate. Override per trip in the trip form.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/40 mb-1.5">Vendor Rate (%)</Label>
            <Input type="number" min="0" max="100" step="1" value={settings.vendor_rate_percentage ?? 80} onChange={(e) => update('vendor_rate_percentage', Number(e.target.value))} className="bg-white/[0.03] border-white/[0.06]" />
          </div>
          <div className="flex items-end pb-1">
            <p className="text-[11px] text-white/40">Vendor receives <span className="text-primary font-semibold">{settings.vendor_rate_percentage ?? 80}%</span> of trip revenue; company retains the rest as margin.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06]">
        <Label className="text-xs text-white/50 mb-2 block font-semibold uppercase tracking-wider">Bank Details (for invoices)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <Label className="text-xs text-white/40 mb-1.5">Bank Name</Label>
            <Input value={settings.bank_name || ''} onChange={(e) => update('bank_name', e.target.value)} placeholder="Abu Dhabi Commercial Bank (ADCB)" className="bg-white/[0.03] border-white/[0.06]" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-white/40 mb-1.5">Account Title</Label>
            <Input value={settings.bank_account_title || ''} onChange={(e) => update('bank_account_title', e.target.value)} className="bg-white/[0.03] border-white/[0.06]" />
          </div>
          <div>
            <Label className="text-xs text-white/40 mb-1.5">Account No</Label>
            <Input value={settings.bank_account_no || ''} onChange={(e) => update('bank_account_no', e.target.value)} className="bg-white/[0.03] border-white/[0.06]" />
          </div>
          <div>
            <Label className="text-xs text-white/40 mb-1.5">IBAN</Label>
            <Input value={settings.bank_iban || ''} onChange={(e) => update('bank_iban', e.target.value)} className="bg-white/[0.03] border-white/[0.06]" />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-white/40 mb-1.5">Branch</Label>
            <Input value={settings.bank_branch || ''} onChange={(e) => update('bank_branch', e.target.value)} placeholder="Main Branch" className="bg-white/[0.03] border-white/[0.06]" />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-primary hover:bg-primary/90 active:scale-[0.98]">
        {saved ? <><Check className="w-4 h-4 mr-1.5" /> Saved</> : saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </SettingsCard>
  );
}