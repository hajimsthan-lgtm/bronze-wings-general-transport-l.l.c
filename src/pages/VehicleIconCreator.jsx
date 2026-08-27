import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Truck, Wand2, Loader2, Check, Image as ImageIcon, Sparkles, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/common/PageHeader';

const PRESETS = [
  { label: '3D Cartoon Truck', prompt: 'cute 3D cartoon style transport truck, vibrant colors, clean white background, centered, soft shadows, app icon style' },
  { label: 'Flat Minimal', prompt: 'flat minimalist vector illustration of a transport truck, simple geometric shapes, gradient accent, clean background, app icon style' },
  { label: 'Realistic Side View', prompt: 'photorealistic side view of a heavy transport truck, studio lighting, clean white background, professional vehicle catalog photo' },
  { label: 'Isometric 3D', prompt: 'isometric 3D render of a transport truck, soft pastel colors, clean background, modern app icon style, subtle shadow' },
  { label: 'Neon Outline', prompt: 'neon outline icon of a truck, glowing edges, dark transparent background, futuristic app icon style' },
  { label: 'Chibi Mascot', prompt: 'chibi mascot style truck character with big friendly eyes, colorful, clean white background, app icon style' },
];

export default function VehicleIconCreator() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [promptText, setPromptText] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: vehicles = [], isLoading: vLoading } = useQuery({
    queryKey: ['vehicles_for_icons'],
    queryFn: () => base44.entities.Vehicle.list('-created_date', 200),
  });

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const generate = async () => {
    const p = promptText.trim();
    if (!p) {
      toast({ title: 'Enter a description first', variant: 'destructive' });
      return;
    }
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

  const applyToVehicle = async () => {
    if (!selectedVehicleId || !generatedUrl) return;
    setSaving(true);
    try {
      await base44.entities.Vehicle.update(selectedVehicleId, { image_url: generatedUrl });
      qc.invalidateQueries({ queryKey: ['vehicles_for_icons'] });
      qc.invalidateQueries({ queryKey: ['vehicles'] });
      toast({ title: 'Icon applied', description: `${selectedVehicle?.plate_number || 'Vehicle'} profile updated` });
    } catch (e) {
      toast({ title: 'Failed to apply', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
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
              placeholder="Describe the vehicle icon you want — e.g. '3D cartoon style blue refrigerated truck, white background, app icon style'"
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
                {selectedVehicleId ? (
                  <Button onClick={applyToVehicle} disabled={saving} className="gap-2 w-full max-w-xs">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Applying…' : `Apply to ${selectedVehicle?.plate_number || 'Vehicle'}`}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">Select a vehicle on the right to apply this icon →</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Vehicle picker */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" /> Select Vehicle
          </p>
          <div className="space-y-2 max-h-[600px] overflow-y-auto thin-scroll pr-1">
            {vLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : vehicles.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No vehicles found</p>
            ) : (
              vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl p-3 border transition-all text-left',
                    selectedVehicleId === v.id
                      ? 'border-primary/50 bg-primary/10'
                      : 'bg-card border-border hover:border-primary/30'
                  )}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-border bg-muted/30 flex items-center justify-center flex-shrink-0">
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
                  {selectedVehicleId === v.id && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                  {v.image_url && selectedVehicleId !== v.id && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 flex-shrink-0">has icon</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}