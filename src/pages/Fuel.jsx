import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Plus, Fuel as FuelIcon, Droplets, Gauge, Truck, Trash2, Pencil } from 'lucide-react';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import ExportButtons from '@/components/common/ExportButtons';
import ReportStatCard from '@/components/reports/ReportStatCard';
import FuelAnalytics from '@/components/fuel/FuelAnalytics';
import FuelFormSheet from '@/components/fuel/FuelFormSheet';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

export default function Fuel() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [presetPlate, setPresetPlate] = useState('');
  const { dateFrom, dateTo } = useGlobalDate();

  const load = () => {
    setLoading(true);
    base44.entities.FuelRecord.list('-date', 500)
      .then(setRecords)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('new') === '1') { setEditItem(null); setFormOpen(true); }
    if (p.get('vehicle_plate')) setPresetPlate(p.get('vehicle_plate'));
  }, []);

  const filtered = records.filter(r => !r.date || ((!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo)));

  const totalCost = filtered.reduce((s, r) => s + (r.total_cost || 0), 0);
  const totalLiters = filtered.reduce((s, r) => s + (r.liters || 0), 0);
  const avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0;
  const vehiclesFueled = new Set(filtered.map(r => r.vehicle_plate).filter(Boolean)).size;

  const handleSave = async (data) => {
    if (editItem) {
      await base44.entities.FuelRecord.update(editItem.id, data);
    } else {
      await base44.entities.FuelRecord.create(data);
    }
    load();
    setFormOpen(false);
    setEditItem(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await base44.entities.FuelRecord.delete(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-24 -left-10 w-[420px] h-[420px] rounded-full blur-[130px] md:animate-[float_20s_ease-in-out_infinite]" style={{ background: 'rgba(20,184,166,0.05)' }} />
        <div className="absolute top-1/3 -right-24 w-[360px] h-[360px] rounded-full blur-[130px] md:animate-[float_20s_ease-in-out_infinite]" style={{ background: 'rgba(249,115,22,0.05)', animationDelay: '7s' }} />
      </div>

      <PageHeader
        title="Fuel Records"
        description={`${filtered.length} records`}
        action={
          <div className="flex items-center gap-2">
            <ExportButtons
              data={filtered}
              filename="fuel_records"
              title="Fuel Records"
              columns={[
                { label: 'Date', key: 'date' },
                { label: 'Vehicle', key: 'vehicle_plate' },
                { label: 'Driver', key: 'driver_name' },
                { label: 'Liters', key: 'liters' },
                { label: 'Price/L', key: 'price_per_liter' },
                { label: 'Total', key: 'total_cost' },
                { label: 'Fuel Type', key: 'fuel_type' },
                { label: 'Payment', key: 'payment_method' },
                { label: 'Station', key: 'station_name' },
                { label: 'Odometer', key: 'odometer_reading' },
              ]}
            />
            <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="bg-primary hover:bg-primary/90 h-10">
              <Plus className="w-4 h-4 mr-1.5" />{t('add_new')}
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ReportStatCard index={0} label="Total Cost" value={totalCost} format={formatCurrency} icon={FuelIcon} color="#14b8a6" />
        <ReportStatCard index={1} label="Total Liters" value={totalLiters} format={(v) => `${Math.round(v).toLocaleString()} L`} icon={Droplets} color="#f97316" />
        <ReportStatCard index={2} label="Avg Price / L" value={avgPrice} format={formatCurrency} icon={Gauge} color="#3b82f6" />
        <ReportStatCard index={3} label="Vehicles Fueled" value={vehiclesFueled} icon={Truck} color="#a855f7" />
      </div>

      {/* Analytics Dashboard */}
      {!loading && filtered.length > 0 && (
        <FuelAnalytics records={filtered} dateFrom={dateFrom} dateTo={dateTo} />
      )}

      {/* Records List */}
      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Droplets} title="No fuel records" description="Add your first fuel record to start tracking consumption" />
      ) : (
        <div className="glass-card rounded-2xl p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3 px-1">Recent Records</h3>
          <div className="space-y-1.5">
            {filtered.slice(0, 50).map((rec, i) => (
              <div
                key={rec.id}
                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors cursor-pointer"
                onClick={() => { setEditItem(rec); setFormOpen(true); }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${rec.fuel_type === 'petrol' ? '#14b8a6' : '#f97316'}20`, border: `1px solid ${rec.fuel_type === 'petrol' ? '#14b8a6' : '#f97316'}30` }}>
                  <FuelIcon className="w-4 h-4" style={{ color: rec.fuel_type === 'petrol' ? '#14b8a6' : '#f97316' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{rec.vehicle_plate || '—'}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">{rec.fuel_type || 'diesel'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {rec.driver_name || '—'} · {rec.liters || 0}L · {formatDate(rec.date)} · {rec.station_name || '—'}
                  </p>
                </div>
                <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">{formatCurrency(rec.total_cost)}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditItem(rec); setFormOpen(true); }}
                    className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(rec); }}
                    className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Sheet */}
      <FuelFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        presetPlate={presetPlate}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete fuel record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the fuel record for {deleteTarget?.vehicle_plate || 'this vehicle'}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}