import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SCENARIO_META } from '@/lib/overtimeCalc';

export default function DriverOvertimeSettingsSheet({ open, onOpenChange, driver, companySettings, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    overtime_scenario: driver?.overtime_scenario || companySettings?.overtime_scenario || 'standard',
    overtime_rate: driver?.overtime_rate ?? companySettings?.overtime_rate ?? 0,
    overtime_tier1_multiplier: driver?.overtime_tier1_multiplier ?? companySettings?.overtime_tier1_multiplier ?? 1.25,
    overtime_tier2_multiplier: driver?.overtime_tier2_multiplier ?? companySettings?.overtime_tier2_multiplier ?? 1.5,
    overtime_tier2_threshold: driver?.overtime_tier2_threshold ?? companySettings?.overtime_tier2_threshold ?? 2,
    overtime_flat_daily: driver?.overtime_flat_daily ?? companySettings?.overtime_flat_daily ?? 0,
    overtime_weekend_multiplier: driver?.overtime_weekend_multiplier ?? companySettings?.overtime_weekend_multiplier ?? 1.5,
  }));

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const scenario = form.overtime_scenario;

  const handleSave = async () => {
    if (!driver) { toast({ title: 'Driver record not found', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await base44.entities.Driver.update(driver.id, {
        overtime_scenario: form.overtime_scenario,
        overtime_rate: Number(form.overtime_rate) || 0,
        overtime_tier1_multiplier: Number(form.overtime_tier1_multiplier) || 1.25,
        overtime_tier2_multiplier: Number(form.overtime_tier2_multiplier) || 1.5,
        overtime_tier2_threshold: Number(form.overtime_tier2_threshold) || 2,
        overtime_flat_daily: Number(form.overtime_flat_daily) || 0,
        overtime_weekend_multiplier: Number(form.overtime_weekend_multiplier) || 1.5,
      });
      toast({ title: 'Overtime settings saved' });
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-foreground">Overtime Settings — {driver?.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-1">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Calculation Scenario</Label>
            <Select value={form.overtime_scenario} onValueChange={(v) => set('overtime_scenario', v)}>
              <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {Object.entries(SCENARIO_META).map(([key, meta]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col">
                      <span>{meta.label}</span>
                      <span className="text-[10px] text-muted-foreground">{meta.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground/60">Company default: {SCENARIO_META[companySettings?.overtime_scenario || 'standard']?.label}. Driver setting overrides when set.</p>
          </div>

          {(scenario === 'standard' || scenario === 'tiered' || scenario === 'weekend_multiplier') && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Base Hourly Rate (AED)</Label>
              <Input type="number" value={form.overtime_rate} onChange={(e) => set('overtime_rate', e.target.value)} className="bg-input border-border" />
              <p className="text-[10px] text-muted-foreground/60">Used as fallback when trip's own overtime rate is 0.</p>
            </div>
          )}

          {scenario === 'tiered' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tier 1 Multiplier</Label>
                  <Input type="number" step="0.05" value={form.overtime_tier1_multiplier} onChange={(e) => set('overtime_tier1_multiplier', e.target.value)} className="bg-input border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tier 2 Multiplier</Label>
                  <Input type="number" step="0.05" value={form.overtime_tier2_multiplier} onChange={(e) => set('overtime_tier2_multiplier', e.target.value)} className="bg-input border-border" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tier 2 Threshold (hrs)</Label>
                <Input type="number" step="0.5" value={form.overtime_tier2_threshold} onChange={(e) => set('overtime_tier2_threshold', e.target.value)} className="bg-input border-border" />
                <p className="text-[10px] text-muted-foreground/60">Hours after which tier 2 multiplier applies.</p>
              </div>
            </>
          )}

          {scenario === 'flat_daily' && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Flat Daily Bonus (AED)</Label>
              <Input type="number" value={form.overtime_flat_daily} onChange={(e) => set('overtime_flat_daily', e.target.value)} className="bg-input border-border" />
              <p className="text-[10px] text-muted-foreground/60">Fixed amount per day with any overtime, regardless of hours.</p>
            </div>
          )}

          {scenario === 'weekend_multiplier' && (
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Weekend Multiplier</Label>
              <Input type="number" step="0.05" value={form.overtime_weekend_multiplier} onChange={(e) => set('overtime_weekend_multiplier', e.target.value)} className="bg-input border-border" />
              <p className="text-[10px] text-muted-foreground/60">Applied on Fridays & Saturdays. Standard rate on weekdays.</p>
            </div>
          )}

          <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            These settings drive auto-detected overtime from trips. Manual entries use their own values. Leave at 0 to inherit company defaults.
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">
              {saving ? 'Saving…' : 'Save Settings'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">Cancel</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}