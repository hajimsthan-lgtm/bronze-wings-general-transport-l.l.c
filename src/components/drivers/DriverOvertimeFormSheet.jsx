import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SCENARIO_META } from '@/lib/overtimeCalc';
import DatePicker from '@/components/common/DatePicker';

export default function DriverOvertimeFormSheet({ open, onOpenChange, driverName, editItem, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    description: editItem?.description || '',
    date: editItem?.date || new Date().toISOString().split('T')[0],
    hours: editItem?.hours ?? '',
    rate: editItem?.rate ?? '',
    amount: editItem?.amount ?? '',
    scenario: editItem?.scenario || 'standard',
    notes: editItem?.notes || '',
  }));

  const set = (k, v) => {
    setForm((p) => {
      const next = { ...p, [k]: v };
      // Auto-calculate amount from hours × rate for standard/tiered/weekend scenarios
      if ((k === 'hours' || k === 'rate') && next.scenario !== 'flat_daily') {
        const h = Number(next.hours) || 0;
        const r = Number(next.rate) || 0;
        next.amount = Math.round(h * r * 100) / 100;
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!form.date) { toast({ title: 'Date required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const payload = {
        driver_name: driverName,
        source: 'manual',
        description: form.description.trim() || 'Manual overtime',
        date: form.date,
        hours: Number(form.hours) || 0,
        rate: Number(form.rate) || 0,
        amount: Number(form.amount) || 0,
        scenario: form.scenario,
        status: 'pending',
        notes: form.notes,
      };
      if (editItem) {
        await base44.entities.DriverOvertime.update(editItem.id, payload);
      } else {
        await base44.entities.DriverOvertime.create(payload);
      }
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast({ title: 'Failed to save overtime entry', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-foreground">{editItem ? 'Edit' : 'Add'} Overtime</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-1">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
            <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="e.g. Extra hours — Dubai delivery" className="bg-input border-border" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Calculation Scenario</Label>
            <Select value={form.scenario} onValueChange={(v) => set('scenario', v)}>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
              <DatePicker value={form.date} onChange={(v) => set('date', v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hours</Label>
              <Input type="number" step="0.5" value={form.hours} onChange={(e) => set('hours', e.target.value)} placeholder="0" className="bg-input border-border" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Rate (AED/hr)</Label>
              <Input type="number" value={form.rate} onChange={(e) => set('rate', e.target.value)} placeholder="0" className="bg-input border-border" disabled={form.scenario === 'flat_daily'} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Amount (AED)</Label>
              <Input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" className="bg-input border-border" />
            </div>
          </div>

          {form.scenario === 'flat_daily' && (
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              Flat Daily Bonus: enter the fixed AED amount in the Amount field regardless of hours.
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional notes…" className="bg-input border-border min-h-[60px]" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff' }}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">Cancel</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}