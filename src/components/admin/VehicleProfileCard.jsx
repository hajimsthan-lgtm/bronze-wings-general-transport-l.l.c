import { useState } from 'react';
import { Truck, Fuel as FuelIcon, MessageCircle, CreditCard, CalendarClock, ShieldCheck, Wrench, CalendarDays, StickyNote, ChevronDown, Pencil, Phone, Mail, IdCard, User } from 'lucide-react';
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
  // vehicleType (e.g. "TOYOTA HI ACE") lives on the VehicleLicense record
  const vehicleType = license?.vehicleType || [vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Vehicle';
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const statsList = [
    { label: 'Odometer', value: `${Number(vehicle.odometer_km || 0).toLocaleString()} km`, accent: '#4ADE80' },
    { label: 'Fuel', value: vehicle.fuel_type, accent: '#f59e0b' },
    { label: 'Trips', value: stats?.trips ?? 0, accent: '#a855f7' },
    { label: 'Revenue', value: formatCurrency(stats?.revenue ?? 0), accent: '#34d399' },
  ];

  const detailTiles = [
    { label: 'Registration', value: formatDate(vehicle.registration_expiry), icon: CalendarClock, accent: '#4ADE80', tone: expiryTone(vehicle.registration_expiry) },
    { label: 'Insurance', value: formatDate(vehicle.insurance_expiry), icon: ShieldCheck, accent: '#34d399', tone: expiryTone(vehicle.insurance_expiry) },
    { label: 'Last Service', value: formatDate(vehicle.last_service_date), icon: Wrench, accent: '#f59e0b', tone: 'text-foreground' },
    { label: 'Next Service', value: formatDate(vehicle.next_service_date), icon: CalendarDays, accent: '#a855f7', tone: expiryTone(vehicle.next_service_date) },
  ];

  return (
    <div className="glass-card relative overflow-hidden row-edge-glow animate-fade-in-up" style={CARD_BASE}>
      {/* edit pencil — top corner */}
      <button
        onClick={() => setEditOpen(true)}
        aria-label="Edit vehicle"
        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      {/* header band */}
      <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.06]" style={{ background: `linear-gradient(135deg, ${hexToRgba('#1ED760', 0.10)} 0%, transparent 100%)` }}>
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none opacity-25" style={{ background: `radial-gradient(circle, ${hexToRgba('#1ED760', 0.5)} 0%, transparent 70%)` }} />
        <div className="relative flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 rounded-xl animate-halo pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(30,215,96,0.40) 0%, transparent 70%)' }} />
            <div className="relative w-14 h-14 rounded-xl flex items-center justify-center border border-white/10" style={{ background: hexToRgba('#1ED760', 0.14) }}>
              <Truck className="w-7 h-7" style={{ color: '#1ED760' }} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-foreground leading-tight truncate">{vehicleType}</h2>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="relative flex w-2 h-2">
                {vehicle.status === 'active' && <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping" style={{ background: statusDot(vehicle.status) }} />}
                <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: statusDot(vehicle.status) }} />
              </span>
              <span className="text-xs text-muted-foreground capitalize">{vehicle.type} Transport Vehicle{vehicle.year ? ` · ${vehicle.year}` : ''}</span>
            </div>
          </div>
          <StatusBadge status={vehicle.status} />

        </div>
      </div>

      {/* plate badge */}
      <div className="px-5 pt-4">
        <PlateBadge plate={vehicle.plate_number} holder={vehicle.assigned_driver} />
      </div>

      {/* inline stats strip */}
      <div className="grid grid-cols-4 divide-x divide-white/[0.06] mt-4">
        {statsList.map((s) => (
          <div key={s.label} className="px-1.5 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{s.label}</p>
            <p className="text-xs font-semibold tabular-nums truncate" style={{ color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* info rows */}
      <div className="px-5 py-4 space-y-2.5">
        {driver && (
          <div className="flex items-center gap-2.5 text-xs">
            <MessageCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Driver</span>
            <span className="ml-auto font-semibold text-foreground truncate">{driver.name}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 text-xs">
          <CalendarClock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="text-muted-foreground">Reg Expiry</span>
          <span className={`ml-auto font-semibold truncate ${expiryTone(vehicle.registration_expiry)}`}>{formatDate(vehicle.registration_expiry) || '—'}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-muted-foreground">Insurance</span>
          <span className={`ml-auto font-semibold truncate ${expiryTone(vehicle.insurance_expiry)}`}>{formatDate(vehicle.insurance_expiry) || '—'}</span>
        </div>
      </div>

      {/* expandable details button */}
      <div className="px-5 pb-5">
        <button onClick={() => setExpanded((e) => !e)} className="w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-foreground hover:bg-white/10 transition-colors">
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          {expanded ? 'Hide Details & Ownership' : 'View Details & Ownership Card'}
        </button>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/[0.06] animate-fade-in">
          <div className="flex items-center gap-2 mb-3 mt-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba('#a855f7', 0.14), border: `1px solid ${hexToRgba('#a855f7', 0.3)}` }}>
              <CreditCard className="w-4 h-4" style={{ color: '#a855f7' }} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Ownership Card</h3>
          </div>
          <div className="w-full">
            <OwnershipCard front={vehicle.ownership_front_url} back={vehicle.ownership_back_url} onChange={onSaveOwnership} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-3 mb-4">Attach front &amp; back (JPG/PNG). Use the flip icon on the card to switch sides.</p>

          {driver && (driver.phone || driver.email || driver.license_number) && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba('#3b82f6', 0.14), border: `1px solid ${hexToRgba('#3b82f6', 0.3)}` }}>
                  <User className="w-4 h-4" style={{ color: '#3b82f6' }} />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Driver Details</h3>
                {driver.name && <span className="text-xs text-muted-foreground truncate ml-1">· {driver.name}</span>}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {driver.phone && (
                  <a href={`tel:${driver.phone}`} className="rounded-xl p-2.5 border border-white/[0.06] hover:border-white/[0.12] transition-colors" style={{ background: hexToRgba('#22c55e', 0.05) }}>
                    <div className="flex items-center gap-1.5 mb-1"><Phone className="w-3.5 h-3.5" style={{ color: '#22c55e' }} /><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Phone</p></div>
                    <p className="text-sm font-semibold text-foreground truncate">{driver.phone}</p>
                  </a>
                )}
                {driver.email && (
                  <a href={`mailto:${driver.email}`} className="rounded-xl p-2.5 border border-white/[0.06] hover:border-white/[0.12] transition-colors" style={{ background: hexToRgba('#3b82f6', 0.05) }}>
                    <div className="flex items-center gap-1.5 mb-1"><Mail className="w-3.5 h-3.5" style={{ color: '#3b82f6' }} /><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Email</p></div>
                    <p className="text-sm font-semibold text-foreground truncate">{driver.email}</p>
                  </a>
                )}
                {driver.license_number && (
                  <div className="rounded-xl p-2.5 border border-white/[0.06]" style={{ background: hexToRgba('#a855f7', 0.05) }}>
                    <div className="flex items-center gap-1.5 mb-1"><IdCard className="w-3.5 h-3.5" style={{ color: '#a855f7' }} /><p className="text-[10px] uppercase tracking-wider text-muted-foreground">License #</p></div>
                    <p className="text-sm font-semibold text-foreground truncate">{driver.license_number}</p>
                  </div>
                )}
                {driver.license_expiry && (
                  <div className="rounded-xl p-2.5 border border-white/[0.06]" style={{ background: hexToRgba('#f59e0b', 0.05) }}>
                    <div className="flex items-center gap-1.5 mb-1"><CalendarClock className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} /><p className="text-[10px] uppercase tracking-wider text-muted-foreground">License Expiry</p></div>
                    <p className={`text-sm font-semibold tabular-nums truncate ${expiryTone(driver.license_expiry)}`}>{formatDate(driver.license_expiry)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {detailTiles.map((d) => { const I = d.icon; return (
              <div key={d.label} className="rounded-xl p-2.5 border border-white/[0.06]" style={{ background: hexToRgba(d.accent, 0.05) }}>
                <div className="flex items-center gap-1.5 mb-1"><I className="w-3.5 h-3.5" style={{ color: d.accent }} /><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.label}</p></div>
                <p className={`text-sm font-semibold tabular-nums truncate ${d.tone}`}>{d.value || '—'}</p>
              </div>
            );})}
          </div>
          {vehicle.notes && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <StickyNote className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Scanned License Data</h3>
              </div>
              <VehicleLicenseInfo notes={vehicle.notes} />
            </div>
          )}
        </div>
      )}

      <VehicleEditModal open={editOpen} onOpenChange={setEditOpen} vehicle={vehicle} onSaved={onSaved} />
    </div>
  );
}