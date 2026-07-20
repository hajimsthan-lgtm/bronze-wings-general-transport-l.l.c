import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, Fuel as FuelIcon, Droplets } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';

export default function Fuel() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const load = () => { setLoading(true); base44.entities.FuelRecord.list('-date', 100).then(setRecords).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const filtered = records.filter(r => !r.date || (r.date >= dateFrom && r.date <= dateTo));
  const totalCost = filtered.reduce((s, r) => s + (r.total_cost || 0), 0);
  const totalLiters = filtered.reduce((s, r) => s + (r.liters || 0), 0);

  return (
    <div>
      <PageHeader title={t('fuel')} description={`${filtered.length} records`}
        action={<Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="glass-card p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{t('total')} Cost</p><p className="text-lg font-display font-bold text-foreground">{formatCurrency(totalCost)}</p></div>
        <div className="glass-card p-3"><p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{t('total')} Liters</p><p className="text-lg font-display font-bold text-primary">{totalLiters.toLocaleString()} L</p></div>
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Droplets} title={t('no_data')} /> : (
        <div className="space-y-2">
          {filtered.map(rec => (
            <button key={rec.id} onClick={() => { setEditItem(rec); setFormOpen(true); }} className="w-full text-left glass-card-hover p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0"><FuelIcon className="w-4 h-4 text-amber-400" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{rec.vehicle_plate}</p>
                <p className="text-xs text-muted-foreground">{rec.driver_name} · {rec.liters}L · {formatDate(rec.date)}</p>
              </div>
              <span className="text-sm font-semibold text-foreground">{formatCurrency(rec.total_cost)}</span>
            </button>
          ))}
        </div>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Fuel Record</SheetTitle></SheetHeader>
          <FuelForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.FuelRecord.update(editItem.id, data); else await base44.entities.FuelRecord.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FuelForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], vehicle_plate: '', driver_name: '', liters: '', price_per_liter: '', total_cost: '', odometer_reading: '', station_name: '', notes: '' });
  useEffect(() => { if (editItem) setForm({ ...form, ...editItem, liters: editItem.liters || '', price_per_liter: editItem.price_per_liter || '', total_cost: editItem.total_cost || '', odometer_reading: editItem.odometer_reading || '' }); else setForm({ date: new Date().toISOString().split('T')[0], vehicle_plate: '', driver_name: '', liters: '', price_per_liter: '', total_cost: '', odometer_reading: '', station_name: '', notes: '' }); }, [editItem]);
  const update = (f, v) => { const next = { ...form, [f]: v }; if (f === 'liters' || f === 'price_per_liter') next.total_cost = (Number(next.liters) || 0) * (Number(next.price_per_liter) || 0); setForm(next); };
  const handle = async () => { setSaving(true); await onSave({ ...form, liters: Number(form.liters) || 0, price_per_liter: Number(form.price_per_liter) || 0, total_cost: Number(form.total_cost) || 0, odometer_reading: Number(form.odometer_reading) || 0 }); setSaving(false); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('vehicle')}</Label><Input value={form.vehicle_plate} onChange={e => update('vehicle_plate', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('driver')}</Label><Input value={form.driver_name} onChange={e => update('driver_name', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Liters</Label><Input type="number" value={form.liters} onChange={e => update('liters', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Price/L</Label><Input type="number" value={form.price_per_liter} onChange={e => update('price_per_liter', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('total')}</Label><Input type="number" value={form.total_cost} onChange={e => update('total_cost', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('date')}</Label><Input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Odometer</Label><Input type="number" value={form.odometer_reading} onChange={e => update('odometer_reading', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Station</Label><Input value={form.station_name} onChange={e => update('station_name', e.target.value)} className="bg-background border-border" /></div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>
  );
}