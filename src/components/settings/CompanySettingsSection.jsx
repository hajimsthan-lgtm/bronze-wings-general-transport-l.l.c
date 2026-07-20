import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Building2, Check, Loader2 } from 'lucide-react';
import { getCompanySettings, saveCompanySettings } from '@/lib/companySettings';

export default function CompanySettingsSection() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { getCompanySettings().then(setSettings); }, []);

  if (!settings) return (
    <div className="glass-card p-5 flex items-center gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Loading company settings...</span>
    </div>
  );

  const update = (field, value) => setSettings(prev => ({ ...prev, [field]: value }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('logo_url', file_url);
    } catch (err) {}
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCompanySettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {}
    setSaving(false);
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">Company Settings</p>
          <p className="text-sm text-muted-foreground">Logo, details, VAT, invoice prefix</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden flex-shrink-0">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <Building2 className="w-8 h-8 text-muted-foreground/40" />
          )}
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Company Logo</Label>
          <Button variant="outline" size="sm" disabled={uploading} asChild>
            <label className="cursor-pointer">
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              {uploading ? 'Uploading...' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Label className="text-xs text-muted-foreground mb-1.5">Company Name</Label>
          <Input value={settings.company_name} onChange={e => update('company_name', e.target.value)} className="bg-background border-border" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs text-muted-foreground mb-1.5">Tagline</Label>
          <Input value={settings.tagline} onChange={e => update('tagline', e.target.value)} className="bg-background border-border" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs text-muted-foreground mb-1.5">Address</Label>
          <Textarea value={settings.address} onChange={e => update('address', e.target.value)} rows={2} className="bg-background border-border" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Phone 1</Label>
          <Input value={settings.phone1} onChange={e => update('phone1', e.target.value)} className="bg-background border-border" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Phone 2</Label>
          <Input value={settings.phone2} onChange={e => update('phone2', e.target.value)} className="bg-background border-border" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Email</Label>
          <Input value={settings.email} onChange={e => update('email', e.target.value)} className="bg-background border-border" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Website</Label>
          <Input value={settings.website} onChange={e => update('website', e.target.value)} className="bg-background border-border" />
        </div>
        <div className="sm:col-span-2">
          <Label className="text-xs text-muted-foreground mb-1.5">TRN (Tax Registration Number)</Label>
          <Input value={settings.trn || ''} onChange={e => update('trn', e.target.value)} className="bg-background border-border" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Default VAT Rate (%)</Label>
          <Input type="number" value={settings.default_vat_rate} onChange={e => update('default_vat_rate', Number(e.target.value))} className="bg-background border-border" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Invoice Prefix</Label>
          <Input value={settings.invoice_prefix} onChange={e => update('invoice_prefix', e.target.value)} className="bg-background border-border" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary/90">
        {saved ? <><Check className="w-4 h-4 mr-1.5" /> Saved</> : saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </div>
  );
}