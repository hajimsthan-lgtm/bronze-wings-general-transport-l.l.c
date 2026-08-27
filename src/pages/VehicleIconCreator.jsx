import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Truck, Wand2, Loader2, Check, Image as ImageIcon, Sparkles, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/common/PageHeader';

const PRESETS = [
  { label: 'Studio Side View', prompt: 'professional studio photograph of a heavy transport truck, exact side profile, centered, clean white seamless background, soft even lighting, sharp focus, realistic paint, catalog quality' },
  { label: '3/4 Front Angle', prompt: 'professional 3/4 front angle photograph of a heavy transport truck, clean light gray studio background, realistic lighting, sharp detail, commercial vehicle catalog photo' },
  { label: 'White Background Top', prompt: 'realistic top-down view of a transport truck, clean white background, even lighting, precise proportions, fleet catalog icon' },
  { label: 'Flat Realistic', prompt: 'flat realistic vector illustration of a transport truck side profile, accurate proportions, professional fleet catalog style, clean white background, no text' },
  { label: 'Box Truck', prompt: 'realistic photograph of a box delivery truck, side profile, clean white studio background, professional lighting, accurate vehicle proportions' },
  { label: 'Tanker Truck', prompt: 'realistic photograph of a fuel tanker truck, side profile, clean white studio background, professional lighting, accurate cylindrical tank proportions' },
  { label: 'Flatbed Trailer', prompt: 'realistic photograph of a flatbed trailer truck, side profile, clean white studio background, professional lighting, accurate proportions' },
  { label: 'Pickup Truck', prompt: 'realistic photograph of a pickup truck, 3/4 front angle, clean white studio background, professional lighting, accurate proportions' },
];

export default function VehicleIconCreator() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState([]);
  const [promptText, setPromptText] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: vehicles = [], isLoading: vLoading } = useQuery({
    queryKey: ['vehicles_for_icons'],
    queryFn: () => base44.entities.Vehicle.list('-created_date', 200),
  });

  const toggleVehicle = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectAll = () => setSelectedIds(vehicles.map((v) => v.id));
  const clearAll = () => setSelectedIds([]);

  const generate = async () => {
    let p = promptText.trim();
    if (!p) {
      toast({ title: 'Enter a description first', variant: 'destructive' });
      return;
    }
    // Enforce realism + clean catalog framing so output is always usable
    const guard = 'professional, realistic, accurate vehicle proportions, clean solid white background, centered, even studio lighting, sharp focus, no text, no watermark, no people, no cartoon, no stylization';
    if (!/realistic|photograph|studio|catalog/i.test(p)) p = `${p}, ${guard}`;
    setLoading(true);
    setGeneratedUrl(null);
    try {
      const res = await base44.integrations.Core.GenerateImage({ prompt: p });
      setGeneratedUrl(res.url);
    } catch (e) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const applyToVehicles = async () => {
    if (selectedIds.length === 0 || !generatedUrl) return;
    setSaving(true);
    let ok = 0;
    let fail = 0;
    for (const id of selectedIds) {
      try {
        await base44.entities.Vehicle.update(id, { image_url: generatedUrl });
        ok++;
      } catch {
        fail++;
      }
    }
    qc.invalidateQueries({ queryKey: ['vehicles_for_icons'] });
    qc.invalidateQueries({ queryKey: ['vehicles'] });
    toast({
      title: fail === 0 ? 'Icon applied' : 'Applied with errors',
      description: `${ok} vehicle${ok !== 1 ? 's' : ''} updated${fail ? ` · ${fail} failed` : ''}`,
      variant: fail === 0 ? 'default' : 'destructive',
    });
    if (fail === 0) setSelectedIds([]);
  };

  return (
    <div className="pb-28">
      <PageHeader title="Vehicle Icon Creator" icon={Truck} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 mt-6">
        {/* Left: Generator */}
        <div className="space-y-6">
          {/* Preset chips */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Style Presets
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => setPromptText(preset.prompt)}
                  className={cn(
                    'text-xs px-3 py-2 rounded-full border transition-all',
                    promptText === preset.prompt
                      ? 'border-primary/50 bg-primary/15 text-primary'
                      : 'bg-card border-border hover:border-primary/30 text-muted-foreground'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 block">
              Icon Description
            </Label>
            <Textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Describe the vehicle — e.g. 'white Volvo FH truck head, side profile, studio catalog photo'"
              rows={3}
              className="bg-card border-border resize-none"
            />
            <div className="flex items-center gap-2 mt-3">
              <Button onClick={generate} disabled={loading || !promptText.trim()} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {loading ? 'Generating…' : 'Generate Icon'}
              </Button>
              <span className="text-xs text-muted-foreground">Uses 1 image credit</span>
            </div>
          </div>

          {/* Preview */}
          {loading && (
            <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating your vehicle icon…</p>
            </div>
          )}

          {generatedUrl && !loading && (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                  <h3 className="font-bold text-sm text-foreground truncate">Generated Icon</h3>
                </div>
                <Button size="sm" variant="outline" onClick={() => setGeneratedUrl(null)} className="gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Discard
                </Button>
              </div>
              <div className="p-6 flex flex-col items-center gap-4">
                <div className="w-40 h-40 rounded-2xl overflow-hidden border border-border bg-muted/20 flex items-center justify-center">
                  <img src={generatedUrl} alt="Generated vehicle icon" className="w-full h-full object-cover" />
                </div>
                {selectedIds.length > 0 ? (
                  <Button onClick={applyToVehicles} disabled={saving} className="gap-2 w-full max-w-xs">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Applying…' : `Apply to ${selectedIds.length} vehicle${selectedIds.length !== 1 ? 's' : ''}`}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">Select one or more vehicles on the right to apply this icon →</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Vehicle picker (multi-select) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5" /> Select Vehicles
              {selectedIds.length > 0 && (
                <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary">{selectedIds.length} selected</span>
              )}
            </p>
            {vehicles.length > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={selectAll} className="text-[10px] text-primary hover:underline">Select all</button>
                <span className="text-muted-foreground/40">·</span>
                <button onClick={clearAll} className="text-[10px] text-muted-foreground hover:text-foreground">Clear</button>
              </div>
            )}
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto thin-scroll pr-1">
            {vLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : vehicles.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No vehicles found</p>
            ) : (
              vehicles.map((v) => {
                const checked = selectedIds.includes(v.id);
                return (
                  <button
                    key={v.id}
                    onClick={() => toggleVehicle(v.id)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-xl p-3 border transition-all text-left',
                      checked
                        ? 'border-primary/50 bg-primary/10'
                        : 'bg-card border-border hover:border-primary/30'
                    )}
                  >
                    <div className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors',
                      checked ? 'bg-primary border-primary' : 'border-border bg-background'
                    )}>
                      {checked && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center flex-shrink-0">
                      {v.image_url ? (
                        <img src={v.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Truck className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{v.plate_number}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {[v.make, v.model].filter(Boolean).join(' ') || '—'}
                      </p>
                    </div>
                    {v.image_url && !checked && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 flex-shrink-0">has icon</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}