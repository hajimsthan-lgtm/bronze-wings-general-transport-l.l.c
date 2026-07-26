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
import { formatCurrency, formatDate, formatDateShort } from '@/lib/formatters';
import { Plus, Fuel as FuelIcon, Droplets, Gauge } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ExportButtons from '@/components/common/ExportButtons';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import ReportRowCard from '@/components/reports/ReportRowCard';
import TrendChart from '@/components/reports/TrendChart';

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
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('new') === '1') { setEditItem(null); setFormOpen(true); }
  }, []);

  const filtered = records.filter(r => !r.date || (r.date >= dateFrom && r.date <= dateTo));
  const totalCost = filtered.reduce((s, r) => s + (r.total_cost || 0), 0);
  const totalLiters = filtered.reduce((s, r) => s + (r.liters || 0), 0);
  const avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;

  // Daily consumption trend
  const days = [];
  { let d = new Date(dateFrom); const end = new Date(dateTo); while (d <= end) { days.push(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 1); } }
  const trendData = days.map((d) => ({
    label: formatDateShort(d),
    cost: filtered.filter((r) => r.date === d).reduce((s, r) => s + (r.total_cost || 0), 0),
    liters: filtered.filter((r) => r.date === d).reduce((s, r) => s + (r.liters || 0), 0),
  }));

  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-24 -left-10 w-[420px] h-[420px] rounded-full blur-[130px] md:animate-[float_20s_ease-in-out_infinite]" style={{ background: 'rgba(20,184,166,0.05)' }} />
        <div className="absolute top-1/3 -right-24 w-[360px] h-[360px] rounded-full blur-[130px] md:animate-[float_20s_ease-in-out_infinite]" style={{ background: 'rgba(249,115,22,0.05)', animationDelay: '7s' }} />
      </div>

      <PageHeader title={t('fuel')} description={`${filtered.length} records`}
        action={<div className="flex items-center gap-2"><ExportButtons data={filtered} filename="fuel_records" title="Fuel Records" columns={[{ label: 'Date', key: 'date' }, { label: 'Vehicle', key: 'vehicle_plate' }, { label: 'Driver', key: 'driver_name' }, { label: 'Liters', key: 'liters' }, { label: 'Price/L', key: 'price_per_liter' }, { label: 'Total', key: 'total_cost' }, { label: 'Fuel Type', key: 'fuel_type' }, { label: 'Station', key: 'station_name' }, { label: 'Odometer', key: 'odometer_reading' }]} /><Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button></div>} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <ReportStatCard index={0} label={`${t('total')} Cost`} value={totalCost} format={formatCurrency} icon={FuelIcon} color="#14b8a6" />
        <ReportStatCard index={1} label={`${t('total')} Liters`} value={totalLiters} format={(v) => `${Math.round(v).toLocaleString()} L`} icon={Droplets} color="#3b82f6" />
        <ReportStatCard index={2} label="Avg Price / L" value={avgPrice} format={formatCurrency} icon={Gauge} color="#f97316" />
      </div>

      <ReportSectionCard index={3} color="#14b8a6" title="Fuel Consumption Trend" className="mb-6">
        <TrendChart data={trendData} series={[{ key: 'cost', name: 'Cost', color: '#14b8a6' }]} type="area" height={220} />
      </ReportSectionCard>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Droplets} title={t('no_data')} /> : (
        <div>
          {filtered.map((rec, i) => (
            <ReportRowCard
              key={rec.id}
              index={i}
              icon={FuelIcon}
              iconColor="#f97316"
              title={rec.vehicle_plate}
              subtitle={`${rec.driver_name || '—'} · ${rec.liters || 0}L · ${formatDate(rec.date)}`}
              onClick={() => { setEditItem(rec); setFormOpen(true); }}
              right={<span className="text-sm font-semibold text-white/90 tabular-nums">{formatCurrency(rec.total_cost)}</span>}
            />
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
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], vehicle_plate: '', driver_name: '', liters: '', price_per_liter: '', total_cost: '', odometer_reading: '', station_name: '', notes: '' });
  useEffect(() => { if (editItem) setForm({ ...form, ...editItem, liters: editItem.liters || '', price_per_liter: editItem.price_per_liter || '', total_cost: editItem.total_cost || '', odometer_reading: editItem.odometer_reading || '' }); else setForm({ date: new Date().toISOString().split('T')[0], vehicle_plate: '', driver_name: '', liters: '', price_per_liter: '', total_cost: '', odometer_reading: '', station_name: '', notes: '' }); }, [editItem]);
  useEffect(() => { base44.entities.Vehicle.list('-created_date', 200).catch(() => []).then(setVehicles); base44.entities.Driver.list('-created_date', 200).catch(() => []).then(setDrivers); }, []);
  const update = (f, v) => { const next = { ...form, [f]: v }; if (f === 'liters' || f === 'price_per_liter') next.total_cost = (Number(next.liters) || 0) * (Number(next.price_per_liter) || 0); setForm(next); };
  const handle = async () => { setSaving(true); await onSave({ ...form, liters: Number(form.liters) || 0, price_per_liter: Number(form.price_per_liter) || 0, total_cost: Number(form.total_cost) || 0, odometer_reading: Number(form.odometer_reading) || 0 }); setSaving(false); };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('vehicle')}</Label><Input list="fuel-vehicles" value={form.vehicle_plate} onChange={e => update('vehicle_plate', e.target.value)} className="bg-background border-border" placeholder="Select or type plate" /><datalist id="fuel-vehicles">{vehicles.map(v => <option key={v.id} value={v.plate_number} />)}</datalist></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('driver')}</Label><Input list="fuel-drivers" value={form.driver_name} onChange={e => update('driver_name', e.target.value)} className="bg-background border-border" placeholder="Select or type driver" /><datalist id="fuel-drivers">{drivers.map(d => <option key={d.id} value={d.name} />)}</datalist></div>
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