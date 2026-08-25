import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Fuel as FuelIcon, Droplets, Calendar, Gauge, MapPin, CreditCard, FileText } from 'lucide-react';
import DatePicker from '@/components/common/DatePicker';
import TaxPreview from '@/components/common/TaxPreview';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DriverVehicleSelects, { PettyWalletBadge } from '@/components/common/DriverVehicleSelects';

const FUEL_COLORS = {
  diesel: '#f97316',
  petrol: '#14b8a6',
};

const PAYMENT_LABELS = {
  cash: 'Cash',
  card: 'Card',
  petty_wallet: 'Petty Wallet',
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
    vat_rate: 5,
    vat_amount: 0,
    total_with_vat: 0,
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
        vat_rate: editItem.vat_rate ?? 5,
        vat_amount: editItem.vat_amount || 0,
        total_with_vat: editItem.total_with_vat || 0,
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
        vat_rate: 5,
        vat_amount: 0,
        total_with_vat: 0,
        notes: '',
      });
    }
  }, [editItem, presetPlate, open]);

  useEffect(() => {
    base44.entities.Vehicle.list('-created_date', 200).catch(() => []).then((v) => setVehicles((v || []).filter((x) => !x.vendor_name)));
    base44.entities.Driver.list('-created_date', 200).catch(() => []).then((d) => setDrivers((d || []).filter((x) => !x.vendor_name)));
  }, []);

  const update = (f, v) => {
    const next = { ...form, [f]: v };
    if (f === 'liters' || f === 'price_per_liter') {
      next.total_cost = (Number(next.liters) || 0) * (Number(next.price_per_liter) || 0);
    }
    // Auto-calc VAT when total_cost or vat_rate changes
    if (f === 'liters' || f === 'price_per_liter' || f === 'total_cost' || f === 'vat_rate') {
      const sub = Number(next.total_cost) || 0;
      const rate = Number(next.vat_rate) || 0;
      next.vat_amount = Math.round(sub * (rate / 100) * 100) / 100;
      next.total_with_vat = Math.round((sub + next.vat_amount) * 100) / 100;
    } else if (f === 'vat_amount') {
      const sub = Number(next.total_cost) || 0;
      next.total_with_vat = Math.round((sub + (Number(v) || 0)) * 100) / 100;
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
        vat_rate: Number(form.vat_rate) || 0,
        vat_amount: Number(form.vat_amount) || 0,
        total_with_vat: Number(form.total_with_vat) || 0,
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
          {/* Vehicle & Driver — avatar-style searchable dropdowns */}
          <DriverVehicleSelects
            driverValue={form.driver_name}
            vehicleValue={form.vehicle_plate}
            onDriverChange={(name) => update('driver_name', name)}
            onVehicleChange={(plate) => update('vehicle_plate', plate)}
          />

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

          {/* VAT Fields */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">VAT Rate</Label>
              <Select value={String(form.vat_rate ?? 5)} onValueChange={v => update('vat_rate', Number(v))}>
                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{[0, 5].map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">VAT Amount</Label>
              <Input type="number" step="0.01" value={form.vat_amount} onChange={e => update('vat_amount', e.target.value)} className="bg-background border-border" placeholder="0" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Total (incl. VAT)</Label>
              <Input type="number" step="0.01" value={form.total_with_vat} readOnly className="bg-background border-border font-semibold" placeholder="0" />
            </div>
          </div>

          {/* Live Tax Preview */}
          <TaxPreview subtotal={Number(form.total_cost) || 0} vatRate={form.vat_rate ?? 5} vatAmount={form.vat_amount || 0} total={form.total_with_vat || 0} />

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