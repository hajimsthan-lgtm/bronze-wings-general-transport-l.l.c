import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, Check, Loader2, RotateCcw } from 'lucide-react';
import { getCompanySettings, saveCompanySettings } from '@/lib/companySettings';
import { useToast } from '@/components/ui/use-toast';
import SettingsCard from './SettingsCard';

const DEFAULTS = {
  inv_header_bg: '#f0f0f0',
  inv_header_text: '#000000',
  inv_row_text: '#000000',
  inv_row_alt_bg: '#fafbfc',
  inv_desc_align: 'left',
  inv_num_align: 'right',
  inv_logo_source: 'company',
  inv_logo_url: '',
  inv_logo_size: 16,
};

const ALIGN_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <Label className="text-xs text-white/40 mb-1.5 block">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 rounded-lg border border-white/[0.06] bg-transparent cursor-pointer flex-shrink-0"
        />
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="bg-white/[0.03] border-white/[0.06] font-mono text-xs"
        />
      </div>
    </div>
  );
}

function AlignSelector({ label, value, onChange }) {
  return (
    <div>
      <Label className="text-xs text-white/40 mb-1.5 block">{label}</Label>
      <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
        {ALIGN_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
              value === opt.value
                ? 'bg-blue-500/20 text-white border border-blue-500/30'
                : 'text-white/40 hover:text-white/70 border border-transparent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function InvoiceAppearanceCard() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCompanySettings()
      .then((s) => setSettings({ ...DEFAULTS, ...s }))
      .catch(() => toast({ title: 'Could not load invoice settings', variant: 'destructive' }));
  }, []);

  if (!settings) {
    return (
      <SettingsCard icon={FileText} title="Invoice Appearance" description="Table colors, alignments, and logo">
        <div className="flex items-center gap-3 py-2">
          <Loader2 className="w-5 h-5 animate-spin text-white/40" />
          <span className="text-sm text-white/40">Loading...</span>
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
      update('inv_logo_url', file_url);
      toast({ title: 'Invoice logo uploaded' });
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
      toast({ title: 'Invoice appearance saved' });
    } catch {
      toast({ title: 'Could not save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings((prev) => ({ ...prev, ...DEFAULTS, logo_url: prev.logo_url, inv_logo_url: prev.inv_logo_url }));
  };

  const activeLogo = settings.inv_logo_source === 'custom' ? settings.inv_logo_url : settings.logo_url;

  return (
    <SettingsCard icon={FileText} title="Invoice Appearance" description="Customize table colors, alignments, and logo">
      {/* Logo Section */}
      <div className="mb-5 pb-5 border-b border-white/[0.06]">
        <Label className="text-xs text-white/50 mb-2 block font-semibold uppercase tracking-wider">Invoice Logo</Label>
        <div className="flex items-center gap-4 mb-3">
          <div className="w-20 h-20 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center overflow-hidden flex-shrink-0">
            {activeLogo ? (
              <img src={activeLogo} alt="Invoice Logo" className="w-full h-full object-contain" />
            ) : (
              <FileText className="w-8 h-8 text-white/25" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06] mb-2">
              <button
                onClick={() => update('inv_logo_source', 'company')}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                  settings.inv_logo_source === 'company'
                    ? 'bg-blue-500/20 text-white border border-blue-500/30'
                    : 'text-white/40 hover:text-white/70 border border-transparent'
                }`}
              >
                Company Logo (default)
              </button>
              <button
                onClick={() => update('inv_logo_source', 'custom')}
                className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                  settings.inv_logo_source === 'custom'
                    ? 'bg-blue-500/20 text-white border border-blue-500/30'
                    : 'text-white/40 hover:text-white/70 border border-transparent'
                }`}
              >
                Custom Logo
              </button>
            </div>
            {settings.inv_logo_source === 'custom' && (
              <Button variant="outline" size="sm" disabled={uploading} asChild>
                <label className="cursor-pointer">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  {uploading ? 'Uploading...' : 'Upload Custom Logo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </Button>
            )}
          </div>
        </div>
        <div>
          <Label className="text-xs text-white/40 mb-1.5 block">Logo Size: {settings.inv_logo_size}mm</Label>
          <input
            type="range"
            min="8"
            max="30"
            step="1"
            value={settings.inv_logo_size}
            onChange={(e) => update('inv_logo_size', Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>
      </div>

      {/* Table Colors */}
      <div className="mb-5 pb-5 border-b border-white/[0.06]">
        <Label className="text-xs text-white/50 mb-2 block font-semibold uppercase tracking-wider">Table Colors</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ColorField label="Header Background" value={settings.inv_header_bg} onChange={(v) => update('inv_header_bg', v)} />
          <ColorField label="Header Text" value={settings.inv_header_text} onChange={(v) => update('inv_header_text', v)} />
          <ColorField label="Row Text" value={settings.inv_row_text} onChange={(v) => update('inv_row_text', v)} />
          <ColorField label="Alt Row Background" value={settings.inv_row_alt_bg} onChange={(v) => update('inv_row_alt_bg', v)} />
        </div>
      </div>

      {/* Alignments */}
      <div className="mb-5">
        <Label className="text-xs text-white/50 mb-2 block font-semibold uppercase tracking-wider">Column Alignments</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AlignSelector label="Description Column" value={settings.inv_desc_align} onChange={(v) => update('inv_desc_align', v)} />
          <AlignSelector label="Numeric Columns" value={settings.inv_num_align} onChange={(v) => update('inv_num_align', v)} />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90 active:scale-[0.98]">
          {saved ? <><Check className="w-4 h-4 mr-1.5" /> Saved</> : saving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button onClick={handleReset} variant="outline" className="bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]">
          <RotateCcw className="w-4 h-4 mr-1.5" /> Reset to Defaults
        </Button>
      </div>
    </SettingsCard>
  );
}