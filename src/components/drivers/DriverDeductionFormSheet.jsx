import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DatePicker from '@/components/common/DatePicker';

const TYPES = [
  { value: 'housing_advance', label: 'Housing Advance' },
  { value: 'vehicle_loan', label: 'Vehicle Loan' },
  { value: 'traffic_fine', label: 'Traffic Fine' },
  { value: 'salary_advance', label: 'Salary Advance' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
];

export default function DriverDeductionFormSheet({ open, onOpenChange, driverName, editItem, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    type: editItem?.type || 'housing_advance',
    description: editItem?.description || '',
    total_amount: editItem?.total_amount || 0,
    issue_date: editItem?.issue_date || new Date().toISOString().split('T')[0],
    status: editItem?.status || 'active',
  }));

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.description.trim()) { toast({ title: 'Description required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      const payload = {
        driver_name: driverName,
        type: form.type,
        description: form.description.trim(),
        total_amount: Number(form.total_amount) || 0,
        monthly_deduction: 0,
        issue_date: form.issue_date,
        status: form.status,
        remaining_balance: editItem
          ? Math.max(0, (Number(editItem.remaining_balance) || 0) + (Number(form.total_amount) - Number(editItem.total_amount)))
          : Number(form.total_amount) || 0,
        months_left: 0,
      };
      if (editItem) await base44.entities.DriverDeduction.update(editItem.id, payload);
      else await base44.entities.DriverDeduction.create(payload);
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'Failed to save deduction', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-foreground">{editItem ? 'Edit' : 'Add New'} Deduction / Advance</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-1">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Type</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {TYPES.map((tp) => <SelectItem key={tp.value} value={tp.value}>{tp.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
            <Input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="e.g. Housing Advance — Mohammed" className="bg-input border-border" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Total Amount (AED)</Label>
            <Input type="number" value={form.total_amount} onChange={(e) => set('total_amount', e.target.value)} className="bg-input border-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Issue Date</Label>
              <DatePicker value={form.issue_date} onChange={(v) => set('issue_date', v)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            The deduction amount applied per salary run is set during salary generation (Pending Deductions · FIFO block). Remaining balance updates automatically as deductions are applied.
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">Cancel</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}