import { useState } from 'react';
import { Truck, Fuel as FuelIcon, CreditCard, CalendarClock, ShieldCheck, Wrench, CalendarDays, StickyNote, Pencil, Phone, Mail, IdCard, User, BadgeCheck, Hash, Gauge, Cog, UserCheck } from 'lucide-react';
import PlateBadge from '@/components/common/PlateBadge';
import OwnershipCard from '@/components/common/OwnershipCard';
import StatusBadge from '@/components/common/StatusBadge';
import VehicleEditModal from '@/components/admin/VehicleEditModal';
import VehicleLicenseInfo from '@/components/admin/VehicleLicenseInfo';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const expiryTone = (d) => {
  if (!d) return 'text-muted-foreground';
  const today = new Date().toISOString().split('T')[0];
  if (d < today) return 'text-rose-400';
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  return d <= soon ? 'text-amber-400' : 'text-foreground';
};

const statusDot = (status) =>
  status === 'active' ? '#34d399' : status === 'maintenance' ? '#f59e0b' : '#94a3b8';

const CARD_BASE = {
  ['--row-accent']: '#1ED760',
  borderTop: '3px solid #1ED760',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 18px rgba(0,0,0,0.3)',
};

export default function VehicleProfileCard({ vehicle, license, driver, stats, onSaveOwnership, onSaved }) {
  const vehicleType = license?.vehicleType || [vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Vehicle';
  const [editOpen, setEditOpen] = useState(false);
  const [showOwnership, setShowOwnership] = useState(false);

  const statsList = [
    { label: 'Odometer', value: `${Number(vehicle.odometer_km || 0).toLocaleString()} km`, accent: '#4ADE80' },
    { label: 'Fuel', value: vehicle.fuel_type, accent: '#f59e0b' },
    { label: 'Trips', value: stats?.trips ?? 0, accent: '#a855f7' },
    { label: 'Revenue', value: formatCurrency(stats?.revenue ?? 0), accent: '#34d399' },
  ];

  return (
    <div className="glass-card relative overflow-hidden row-edge-glow animate-fade-in-up" style={CARD_BASE}>
      {/* header band */}
      <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.06]" style={{ background: `linear-gradient(135deg, ${hexToRgba('#1ED760', 0.10)} 0%, transparent 100%)` }}>
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none opacity-25" style={{ background: `radial-gradient(circle, ${hexToRgba('#1ED760', 0.5)} 0%, transparent 70%)` }} />
        <div className="relative flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 rounded-xl animate-halo pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(30,215,96,0.40) 0%, transparent 70%)' }} />
            <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-muted/40 flex items-center justify-center">
              {vehicle.image_url
                ? <img src={vehicle.image_url} alt="" className="w-full h-full object-cover" />
                : <Truck className="w-7 h-7 text-primary" />}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-foreground leading-tight break-words">{vehicleType}</h2>
              <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="relative flex w-2 h-2">
                {vehicle.status === 'active' && <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping" style={{ background: statusDot(vehicle.status) }} />}
                <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: statusDot(vehicle.status) }} />
              </span>
              <span className="text-xs text-muted-foreground capitalize">{vehicle.type} Transport Vehicle{vehicle.year ? ` · ${vehicle.year}` : ''}</span>
            </div>
          </div>
          <button onClick={() => setEditOpen(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit vehicle">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <StatusBadge status={vehicle.status} />
        </div>
      </div>

      {/* inline stats strip */}
      <div className="grid grid-cols-4 divide-x divide-white/[0.06]">
        {statsList.map((s) => (
          <div key={s.label} className="px-1.5 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{s.label}</p>
            <p className="text-sm font-semibold tabular-nums truncate" style={{ color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* info rows */}
      <div className="px-5 py-4 space-y-2.5">
        {/* Plate badge */}
        <div className="flex items-center gap-2.5 text-xs">
          <Hash className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="text-muted-foreground">Plate</span>
          <span className="ml-auto"><PlateBadge plate={vehicle.plate_number} holder={vehicle.assigned_driver} /></span>
        </div>

        {/* Make / Model */}
        <div className="flex items-center gap-2.5 text-xs">
          <Truck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
          <span className="text-muted-foreground">Make / Model</span>
          <span className="ml-auto font-semibold text-foreground truncate">{[vehicle.make, vehicle.model].filter(Boolean).join(' ') || '—'}</span>
        </div>

        {/* Year */}
        {vehicle.year && (
          <div className="flex items-center gap-2.5 text-xs">
            <CalendarDays className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <span className="text-muted-foreground">Year</span>
            <span className="ml-auto font-semibold text-foreground tabular-nums">{vehicle.year}</span>
          </div>
        )}

        {/* Fuel type */}
        <div className="flex items-center gap-2.5 text-xs">
          <FuelIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-muted-foreground">Fuel Type</span>
          <span className="ml-auto font-semibold text-foreground capitalize">{vehicle.fuel_type || '—'}</span>
        </div>

        {/* Odometer */}
        <div className="flex items-center gap-2.5 text-xs">
          <Gauge className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-muted-foreground">Odometer</span>
          <span className="ml-auto font-semibold text-foreground tabular-nums">{Number(vehicle.odometer_km || 0).toLocaleString()} km</span>
        </div>

        {/* Assigned driver */}
        {vehicle.assigned_driver && (
          <div className="flex items-center gap-2.5 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
            <span className="text-muted-foreground">Assigned Driver</span>
            <span className="ml-auto font-semibold text-foreground truncate">{vehicle.assigned_driver}</span>
          </div>
        )}

        {/* Vendor */}
        {vehicle.vendor_name && (
          <div className="flex items-center gap-2.5 text-xs">
            <User className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className="text-muted-foreground">Vendor</span>
            <span className="ml-auto font-semibold text-foreground truncate">{vehicle.vendor_name}</span>
          </div>
        )}

        {/* Compliance Dates sub-section */}
        <div className="pt-2.5 mt-1 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Compliance & Service</span>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs">
              <CalendarClock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="text-muted-foreground">Registration</span>
              <span className={`ml-auto font-semibold tabular-nums truncate ${expiryTone(vehicle.registration_expiry)}`}>{formatDate(vehicle.registration_expiry) || '—'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="text-muted-foreground">Insurance</span>
              <span className={`ml-auto font-semibold tabular-nums truncate ${expiryTone(vehicle.insurance_expiry)}`}>{formatDate(vehicle.insurance_expiry) || '—'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <Wrench className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="text-muted-foreground">Last Service</span>
              <span className="ml-auto font-semibold text-foreground tabular-nums truncate">{formatDate(vehicle.last_service_date) || '—'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs">
              <CalendarDays className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
              <span className="text-muted-foreground">Next Service</span>
              <span className={`ml-auto font-semibold tabular-nums truncate ${expiryTone(vehicle.next_service_date)}`}>{formatDate(vehicle.next_service_date) || '—'}</span>
            </div>
          </div>
        </div>

        {/* Ownership Card sub-section */}
        <div className="pt-2.5 mt-1 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Ownership Card</span>
            <button
              onClick={() => setShowOwnership((s) => !s)}
              className="ml-auto text-[10px] text-primary hover:underline"
            >
              {showOwnership ? 'Hide' : 'Show'}
            </button>
          </div>
          {showOwnership && (
            <div className="animate-fade-in">
              <OwnershipCard front={vehicle.ownership_front_url} back={vehicle.ownership_back_url} onChange={onSaveOwnership} />
              <p className="text-[10px] text-muted-foreground mt-2">Attach front &amp; back (JPG/PNG). Use the flip icon to switch sides.</p>
            </div>
          )}
        </div>

        {/* Driver Details sub-section */}
        {driver && (driver.phone || driver.email || driver.license_number) && (
          <div className="pt-2.5 mt-1 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Driver Details</span>
              {driver.name && <span className="text-xs text-muted-foreground truncate ml-1">· {driver.name}</span>}
            </div>
            <div className="space-y-2.5">
              {driver.phone && (
                <a href={`tel:${driver.phone}`} className="flex items-center gap-2.5 text-xs hover:bg-white/[0.03] -mx-1 px-1 py-1 rounded-lg transition-colors">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-muted-foreground">Phone</span>
                  <span className="ml-auto font-semibold text-foreground truncate">{driver.phone}</span>
                </a>
              )}
              {driver.email && (
                <a href={`mailto:${driver.email}`} className="flex items-center gap-2.5 text-xs hover:bg-white/[0.03] -mx-1 px-1 py-1 rounded-lg transition-colors">
                  <Mail className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                  <span className="text-muted-foreground">Email</span>
                  <span className="ml-auto font-semibold text-foreground truncate">{driver.email}</span>
                </a>
              )}
              {driver.license_number && (
                <div className="flex items-center gap-2.5 text-xs">
                  <IdCard className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                  <span className="text-muted-foreground">License #</span>
                  <span className="ml-auto font-semibold text-foreground truncate">{driver.license_number}</span>
                </div>
              )}
              {driver.license_expiry && (
                <div className="flex items-center gap-2.5 text-xs">
                  <CalendarClock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span className="text-muted-foreground">License Expiry</span>
                  <span className={`ml-auto font-semibold tabular-nums truncate ${expiryTone(driver.license_expiry)}`}>{formatDate(driver.license_expiry)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Scanned license data footer */}
      {vehicle.notes && (
        <div className="mx-5 mb-5 rounded-xl p-3 border border-white/[0.06]" style={{ background: hexToRgba('#a855f7', 0.06) }}>
          <div className="flex items-center gap-2 mb-2">
            <StickyNote className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Scanned License Data</span>
          </div>
          <VehicleLicenseInfo notes={vehicle.notes} />
        </div>
      )}

      <VehicleEditModal open={editOpen} onOpenChange={setEditOpen} vehicle={vehicle} onSaved={onSaved} />
    </div>
  );
}