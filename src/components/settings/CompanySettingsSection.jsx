import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Building2, Check, Loader2 } from 'lucide-react';
import { getCompanySettings, saveCompanySettings } from '@/lib/companySettings';
import { useToast } from '@/components/ui/use-toast';
import SettingsCard from './SettingsCard';

export default function CompanySettingsSection() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCompanySettings()
      .then(setSettings)
      .catch(() => toast({ title: 'Could not load company settings', variant: 'destructive' }));
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
      await saveCompanySettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast({ title: 'Company settings saved' });
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

      <Button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-primary hover:bg-primary/90 active:scale-[0.98]">
        {saved ? <><Check className="w-4 h-4 mr-1.5" /> Saved</> : saving ? 'Saving...' : 'Save Settings'}
      </Button>
    </SettingsCard>
  );
}