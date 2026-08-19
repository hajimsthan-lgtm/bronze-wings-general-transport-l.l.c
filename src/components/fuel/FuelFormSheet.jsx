import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Fuel as FuelIcon, Droplets, Calendar, Gauge, MapPin, CreditCard, FileText, Truck, User } from 'lucide-react';
import DatePicker from '@/components/common/DatePicker';

const FUEL_COLORS = {
  diesel: '#f97316',
  petrol: '#14b8a6',
};

const PAYMENT_LABELS = {
  cash: 'Cash',
  card: 'Card',
  account: 'Account',
};

export default function FuelFormSheet({ open, onOpenChange, editItem, presetPlate, onSave }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicle_plate: '',
    driver_name: '',
    liters: '',
    price_per_liter: '',
    total_cost: '',
    odometer_reading: '',
    station_name: '',
    fuel_type: 'diesel',
    payment_method: 'cash',
    notes: '',
  });

  useEffect(() => {
    if (editItem) {
      setForm({
        date: editItem.date || new Date().toISOString().split('T')[0],
        vehicle_plate: editItem.vehicle_plate || '',
        driver_name: editItem.driver_name || '',
        liters: editItem.liters ?? '',
        price_per_liter: editItem.price_per_liter ?? '',
        total_cost: editItem.total_cost ?? '',
        odometer_reading: editItem.odometer_reading ?? '',
        station_name: editItem.station_name || '',
        fuel_type: editItem.fuel_type || 'diesel',
        payment_method: editItem.payment_method || 'cash',
        notes: editItem.notes || '',
      });
    } else {
      setForm({
        date: new Date().toISOString().split('T')[0],
        vehicle_plate: presetPlate || '',
        driver_name: '',
        liters: '',
        price_per_liter: '',
        total_cost: '',
        odometer_reading: '',
        station_name: '',
        fuel_type: 'diesel',
        payment_method: 'cash',
        notes: '',
      });
    }
  }, [editItem, presetPlate, open]);

  useEffect(() => {
    base44.entities.Vehicle.list('-created_date', 200).catch(() => []).then(setVehicles);
    base44.entities.Driver.list('-created_date', 200).catch(() => []).then(setDrivers);
  }, []);

  const update = (f, v) => {
    const next = { ...form, [f]: v };
    if (f === 'liters' || f === 'price_per_liter') {
      next.total_cost = (Number(next.liters) || 0) * (Number(next.price_per_liter) || 0);
    }
    setForm(next);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...form,
        liters: Number(form.liters) || 0,
        price_per_liter: Number(form.price_per_liter) || 0,
        total_cost: Number(form.total_cost) || 0,
        odometer_reading: Number(form.odometer_reading) || 0,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-foreground flex items-center gap-2">
            <FuelIcon className="w-5 h-5 text-primary" />
            {editItem ? 'Edit' : 'New'} Fuel Record
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          {/* Vehicle & Driver */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Truck className="w-3 h-3" /> {t('vehicle')}</Label>
              <Input list="fuel-vehicles" value={form.vehicle_plate} onChange={e => update('vehicle_plate', e.target.value)} className="bg-background border-border" placeholder="Select or type plate" />
              <datalist id="fuel-vehicles">{vehicles.map(v => <option key={v.id} value={v.plate_number} />)}</datalist>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> {t('driver')}</Label>
              <Input list="fuel-drivers" value={form.driver_name} onChange={e => update('driver_name', e.target.value)} className="bg-background border-border" placeholder="Select or type driver" />
              <datalist id="fuel-drivers">{drivers.map(d => <option key={d.id} value={d.name} />)}</datalist>
            </div>
          </div>

          {/* Fuel Type & Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Droplets className="w-3 h-3" /> Fuel Type</Label>
              <div className="flex gap-1.5">
                {Object.entries(FUEL_COLORS).map(([type, color]) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => update('fuel_type', type)}
                    className={`flex-1 h-10 rounded-xl border text-xs font-semibold capitalize transition-all ${form.fuel_type === type ? 'border-primary' : 'border-border bg-background'}`}
                    style={form.fuel_type === type ? { background: `${color}20`, color } : {}}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment</Label>
              <div className="flex gap-1.5">
                {Object.entries(PAYMENT_LABELS).map(([method, label]) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => update('payment_method', method)}
                    className={`flex-1 h-10 rounded-xl border text-xs font-semibold transition-all ${form.payment_method === method ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Liters, Price/L, Total */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Liters</Label>
              <Input type="number" step="0.01" value={form.liters} onChange={e => update('liters', e.target.value)} className="bg-background border-border" placeholder="0" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Price/L</Label>
              <Input type="number" step="0.01" value={form.price_per_liter} onChange={e => update('price_per_liter', e.target.value)} className="bg-background border-border" placeholder="0" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">{t('total')}</Label>
              <Input type="number" step="0.01" value={form.total_cost} onChange={e => update('total_cost', e.target.value)} className="bg-background border-border" placeholder="0" />
            </div>
          </div>

          {/* Date & Odometer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> {t('date')}</Label>
              <DatePicker value={form.date} onChange={v => update('date', v)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Gauge className="w-3 h-3" /> Odometer</Label>
              <Input type="number" value={form.odometer_reading} onChange={e => update('odometer_reading', e.target.value)} className="bg-background border-border" placeholder="km" />
            </div>
          </div>

          {/* Station */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> Station</Label>
            <Input value={form.station_name} onChange={e => update('station_name', e.target.value)} className="bg-background border-border" placeholder="Fuel station name" />
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><FileText className="w-3 h-3" /> Notes</Label>
            <Input value={form.notes} onChange={e => update('notes', e.target.value)} className="bg-background border-border" placeholder="Optional notes" />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-border">{t('cancel')}</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">
              {saving ? t('loading') : t('save')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}