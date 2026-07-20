import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityDetailHeader from '@/components/admin/EntityDetailHeader';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Inbox, Fuel as FuelIcon, Receipt, Wrench } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';

export default function VehicleDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [services, setServices] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities.Vehicle.get(id).then(async (v) => {
      if (cancelled) return;
      setVehicle(v);
      setLoading(false);
      const plate = v.plate_number;
      setDataLoading(true);
      try {
        const [tR, fR, eR, sR] = await Promise.all([
          base44.entities.Trip.filter({ vehicle_plate: plate }).catch(() => []),
          base44.entities.FuelRecord.filter({ vehicle_plate: plate }).catch(() => []),
          base44.entities.Expense.filter({ vehicle_plate: plate }).catch(() => []),
          base44.entities.ServiceRecord.filter({ vehicle_plate: plate }).catch(() => []),
        ]);
        if (cancelled) return;
        setTrips(tR || []);
        setFuelRecords(fR || []);
        setExpenses(eR || []);
        setServices(sR || []);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!vehicle) return <EmptyState title="Vehicle not found" />;

  const fTrips = trips.filter(t => !t.trip_date || (t.trip_date >= dateFrom && t.trip_date <= dateTo));
  const fFuel = fuelRecords.filter(r => !r.date || (r.date >= dateFrom && r.date <= dateTo));
  const fExpenses = expenses.filter(r => !r.date || (r.date >= dateFrom && r.date <= dateTo));
  const fServices = services.filter(r => !r.date || (r.date >= dateFrom && r.date <= dateTo));

  return (
    <div>
      <EntityDetailHeader
        title={`${vehicle.make} ${vehicle.model} ${vehicle.year || ''}`}
        subtitle={vehicle.plate_number}
        badge={<StatusBadge status={vehicle.status} />}
        backTo="/admin/vehicles"
        info={[
          { label: 'Type', value: vehicle.type },
          { label: t('driver'), value: vehicle.assigned_driver },
          { label: 'Fuel Type', value: vehicle.fuel_type },
          { label: 'Odometer', value: vehicle.odometer_km ? `${vehicle.odometer_km} km` : null },
          { label: t('registration'), value: formatDate(vehicle.registration_expiry) },
          { label: t('insurance'), value: formatDate(vehicle.insurance_expiry) },
          { label: t('last_service'), value: formatDate(vehicle.last_service_date) },
          { label: t('next_service'), value: formatDate(vehicle.next_service_date) },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
      </div>

      <Tabs defaultValue="trips">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="trips">{t('trips')} ({fTrips.length})</TabsTrigger>
          <TabsTrigger value="fuel">{t('fuel')} ({fFuel.length})</TabsTrigger>
          <TabsTrigger value="expenses">{t('expenses')} ({fExpenses.length})</TabsTrigger>
          <TabsTrigger value="services">{t('services')} ({fServices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fTrips.length === 0 ? <EmptyState icon={Inbox} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fTrips.map(trip => (
                <div key={trip.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{trip.from_location} → {trip.to_location}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(trip.trip_date)} · {trip.driver_name}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(trip.revenue)}</span>
                  <StatusBadge status={trip.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="fuel" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fFuel.length === 0 ? <EmptyState icon={FuelIcon} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fFuel.map(rec => (
                <div key={rec.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0"><FuelIcon className="w-4 h-4 text-amber-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{rec.liters}L · {rec.station_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(rec.date)} · {rec.driver_name}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(rec.total_cost)}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fExpenses.length === 0 ? <EmptyState icon={Receipt} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fExpenses.map(rec => (
                <div key={rec.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{rec.description || rec.category}</p>
                    <p className="text-xs text-muted-foreground capitalize">{rec.category} · {formatDate(rec.date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(rec.amount)}</span>
                  <StatusBadge status={rec.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fServices.length === 0 ? <EmptyState icon={Wrench} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fServices.map(rec => (
                <div key={rec.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Wrench className="w-4 h-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">{rec.service_type}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(rec.date)} · {rec.vendor_name || '—'}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(rec.cost)}</span>
                  <StatusBadge status={rec.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}