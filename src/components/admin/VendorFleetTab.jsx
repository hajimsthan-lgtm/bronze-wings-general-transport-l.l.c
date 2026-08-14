import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, User, Plus, Trash2, Loader2 } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

export default function VendorFleetTab({ vendor }) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [v, d] = await Promise.all([
      base44.entities.Vehicle.filter({ vendor_name: vendor.name }).catch(() => []),
      base44.entities.Driver.filter({ vendor_name: vendor.name }).catch(() => []),
    ]);
    setVehicles(v || []);
    setDrivers(d || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [vendor.id, vendor.name]);

  const openAdd = (type) => {
    setDialog(type);
    setForm(type === 'vehicle' ? { plate_number: '', make: '', model: '' } : { name: '', phone: '' });
  };

  const save = async () => {
    setSaving(true);
    try {
      if (dialog === 'vehicle') {
        if (!form.plate_number) return;
        await base44.entities.Vehicle.create({ ...form, vendor_name: vendor.name, make: form.make || '—', model: form.model || '—', type: 'truck', status: 'active' });
      } else {
        if (!form.name) return;
        await base44.entities.Driver.create({ ...form, vendor_name: vendor.name, status: 'active', phone: form.phone || '—' });
      }
      setDialog(null);
      load();
    } finally { setSaving(false); }
  };

  const remove = async (type, id) => {
    if (type === 'vehicle') await base44.entities.Vehicle.delete(id).catch(() => {});
    else await base44.entities.Driver.delete(id).catch(() => {});
    load();
  };

  const Row = ({ icon: Icon, title, subtitle, onRemove }) => (
    <div className="glass-card p-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-primary" /></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove} className="text-muted-foreground hover:text-red-400 h-8 w-8 p-0"><Trash2 className="w-3.5 h-3.5" /></Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Truck className="w-4 h-4 text-primary" /> Vehicles ({vehicles.length})</h3>
          <Button size="sm" onClick={() => openAdd('vehicle')} className="btn-new-trip gap-1.5 h-8"><Plus className="w-3.5 h-3.5" /> Add Vehicle</Button>
        </div>
        {loading ? <div className="text-xs text-muted-foreground py-4">Loading…</div> : vehicles.length === 0 ? <EmptyState icon={Truck} title="No vehicles" description="Add a vehicle to this service provider's pool." /> : (
          <div className="space-y-2">
            {vehicles.map((v) => <Row key={v.id} icon={Truck} title={v.plate_number} subtitle={`${v.make} ${v.model} · ${v.status}`} onRemove={() => remove('vehicle', v.id)} />)}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Drivers ({drivers.length})</h3>
          <Button size="sm" onClick={() => openAdd('driver')} className="btn-new-trip gap-1.5 h-8"><Plus className="w-3.5 h-3.5" /> Add Driver</Button>
        </div>
        {loading ? <div className="text-xs text-muted-foreground py-4">Loading…</div> : drivers.length === 0 ? <EmptyState icon={User} title="No drivers" description="Add a driver to this service provider's pool." /> : (
          <div className="space-y-2">
            {drivers.map((d) => <Row key={d.id} icon={User} title={d.name} subtitle={`${d.phone} · ${d.status}`} onRemove={() => remove('driver', d.id)} />)}
          </div>
        )}
      </div>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border border-primary/25 max-w-sm">
          <DialogHeader>
            <DialogTitle>{dialog === 'vehicle' ? 'Add Vehicle' : 'Add Driver'} · {vendor.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 px-1">
            {dialog === 'vehicle' ? (
              <>
                <div><Label className="text-xs text-muted-foreground mb-1.5">Plate Number *</Label><Input value={form.plate_number || ''} onChange={(e) => setForm((f) => ({ ...f, plate_number: e.target.value }))} placeholder="A 12345" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs text-muted-foreground mb-1.5">Make</Label><Input value={form.make || ''} onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))} placeholder="Toyota" /></div>
                  <div><Label className="text-xs text-muted-foreground mb-1.5">Model</Label><Input value={form.model || ''} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} placeholder="Hilux" /></div>
                </div>
              </>
            ) : (
              <>
                <div><Label className="text-xs text-muted-foreground mb-1.5">Name *</Label><Input value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ahmed" /></div>
                <div><Label className="text-xs text-muted-foreground mb-1.5">Phone</Label><Input value={form.phone || ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="050…" /></div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving || (dialog === 'vehicle' ? !form.plate_number : !form.name)} className="btn-new-trip gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}