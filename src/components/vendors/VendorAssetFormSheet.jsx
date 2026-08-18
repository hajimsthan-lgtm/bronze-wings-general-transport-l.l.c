import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Truck, Users } from 'lucide-react';

/**
 * Inline form for creating a vehicle or driver strictly scoped to a vendor.
 * Does NOT redirect to the main Vehicles/Drivers pages — the created record
 * is tagged with vendor_name and only visible in this vendor's detail view.
 *
 * Props:
 *  - open: boolean
 *  - onOpenChange: (open) => void
 *  - mode: 'vehicle' | 'driver'
 *  - vendorName: string
 *  - onCreated: (record) => void
 */
export default function VendorAssetFormSheet({ open, onOpenChange, mode, vendorName, onCreated }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const isVehicle = mode === 'vehicle';

  const empty = isVehicle
    ? { plate_number: '', make: '', model: '', year: '', type: 'truck', supply_start_date: '', supply_rate: '', supply_rate_type: 'daily', supply_status: 'active' }
    : { name: '', phone: '', supply_start_date: '', supply_rate: '', supply_status: 'active', status: 'active' };
  const [form, setForm] = useState(empty);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vendorName) return;
    setSaving(true);
    try {
      const payload = { ...form, vendor_name: vendorName };
      if (isVehicle) {
        payload.year = form.year ? Number(form.year) : undefined;
        payload.supply_rate = Number(form.supply_rate) || 0;
      } else {
        payload.supply_rate = Number(form.supply_rate) || 0;
      }
      const entity = isVehicle ? base44.entities.Vehicle : base44.entities.Driver;
      const record = await entity.create(payload);
      toast({ title: isVehicle ? 'Vehicle added to vendor' : 'Driver added to vendor' });
      setForm(empty);
      onOpenChange(false);
      onCreated?.(record);
    } catch (err) {
      toast({ title: 'Failed to create', description: err?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const Icon = isVehicle ? Truck : Users;
  const title = isVehicle ? 'Add Supplied Vehicle' : 'Add Supplied Driver';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-foreground flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            {title}
          </SheetTitle>
          <p className="text-xs text-muted-foreground -mt-3">
            Scoped to vendor: <span className="font-medium text-foreground">{vendorName}</span>
          </p>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isVehicle ? (
            <>
              <div><Label className="text-xs text-muted-foreground mb-1.5">Plate Number *</Label><Input required value={form.plate_number} onChange={(e) => set('plate_number', e.target.value)} className="bg-background border-border" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground mb-1.5">Make *</Label><Input required value={form.make} onChange={(e) => set('make', e.target.value)} className="bg-background border-border" /></div>
                <div><Label className="text-xs text-muted-foreground mb-1.5">Model *</Label><Input required value={form.model} onChange={(e) => set('model', e.target.value)} className="bg-background border-border" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground mb-1.5">Year</Label><Input type="number" value={form.year} onChange={(e) => set('year', e.target.value)} className="bg-background border-border" /></div>
                <div><Label className="text-xs text-muted-foreground mb-1.5">Type</Label>
                  <Select value={form.type} onValueChange={(v) => set('type', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>
                    <SelectItem value="truck">Truck</SelectItem><SelectItem value="trailer">Trailer</SelectItem><SelectItem value="tanker">Tanker</SelectItem><SelectItem value="pickup">Pickup</SelectItem><SelectItem value="other">Other</SelectItem>
                  </SelectContent></Select>
                </div>
              </div>
            </>
          ) : (
            <>
              <div><Label className="text-xs text-muted-foreground mb-1.5">Name *</Label><Input required value={form.name} onChange={(e) => set('name', e.target.value)} className="bg-background border-border" /></div>
              <div><Label className="text-xs text-muted-foreground mb-1.5">Phone *</Label><Input required value={form.phone} onChange={(e) => set('phone', e.target.value)} className="bg-background border-border" /></div>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground mb-1.5">Supply Start</Label><Input type="date" value={form.supply_start_date} onChange={(e) => set('supply_start_date', e.target.value)} className="bg-background border-border" /></div>
            <div><Label className="text-xs text-muted-foreground mb-1.5">Supply Rate</Label><Input type="number" value={form.supply_rate} onChange={(e) => set('supply_rate', e.target.value)} className="bg-background border-border" /></div>
          </div>
          {isVehicle && (
            <div><Label className="text-xs text-muted-foreground mb-1.5">Rate Type</Label>
              <Select value={form.supply_rate_type} onValueChange={(v) => set('supply_rate_type', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>
                <SelectItem value="daily">Daily</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="per_trip">Per Trip</SelectItem>
              </SelectContent></Select>
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-border">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? 'Saving…' : 'Add to Vendor'}</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}