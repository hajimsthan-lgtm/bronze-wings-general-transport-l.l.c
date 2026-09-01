import { useState } from 'react';
import {
  Truck, Fuel as FuelIcon, CreditCard, CalendarClock, ShieldCheck, Wrench,
  CalendarDays, Pencil, Phone, Mail, IdCard, User, BadgeCheck,
  Hash, Gauge, UserCheck,
} from 'lucide-react';
import PlateBadge from '@/components/common/PlateBadge';
import OwnershipCard from '@/components/common/OwnershipCard';
import StatusBadge from '@/components/common/StatusBadge';
import VehicleEditModal from '@/components/admin/VehicleEditModal';
import { parseLicenseNotes, LICENSE_SECTIONS } from '@/components/admin/VehicleLicenseInfo';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const ACCENT = '#1ED760';
const CARD_BASE = {
  ['--row-accent']: ACCENT,
  borderTop: `3px solid ${ACCENT}`,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 18px rgba(0,0,0,0.3)',
};

const expiryTone = (d) => {
  if (!d) return 'text-muted-foreground';
  const today = new Date().toISOString().split('T')[0];
  if (d < today) return 'text-rose-400';
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  return d <= soon ? 'text-amber-400' : 'text-foreground';
};

const statusDot = (s) => (s === 'active' ? '#34d399' : s === 'maintenance' ? '#f59e0b' : '#94a3b8');

/* ── Reusable info row ── */
function Row({ icon: Icon, tone, label, value, toneValue, href }) {
  const body = (
    <>
      <Icon className={`w-3.5 h-3.5 ${tone} flex-shrink-0`} />
      <span className="text-muted-foreground">{label}</span>
      <span className={`ml-auto font-semibold tabular-nums truncate ${toneValue || 'text-foreground'}`}>{value}</span>
    </>
  );
  const cls = 'flex items-center gap-2.5 text-xs';
  return href ? (
    <a href={href} className={`${cls} hover:bg-white/[0.03] -mx-1 px-1 py-1 rounded-lg transition-colors`}>{body}</a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/* ── Sub-section header ── */
function Group({ icon: Icon, tone, title, action, children }) {
  return (
    <div className="pt-2.5 mt-1 border-t border-white/[0.06]">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${tone} flex-shrink-0`} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{title}</span>
        {action}
      </div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

export default function VehicleProfileCard({ vehicle, license, driver, stats, onSaveOwnership, onSaved }) {
  const [editOpen, setEditOpen] = useState(false);
  const [showOwnership, setShowOwnership] = useState(false);

  const vehicleType = license?.vehicleType || [vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'Vehicle';

  const statsList = [
    { label: 'Odometer', value: `${Number(vehicle.odometer_km || 0).toLocaleString()} km`, accent: '#4ADE80' },
    { label: 'Fuel', value: vehicle.fuel_type, accent: '#f59e0b' },
    { label: 'Trips', value: stats?.trips ?? 0, accent: '#a855f7' },
    { label: 'Revenue', value: formatCurrency(stats?.revenue ?? 0), accent: '#34d399' },
  ];

  const baseRows = [
    { icon: Hash, tone: 'text-primary', label: 'Plate', value: <PlateBadge plate={vehicle.plate_number} holder={vehicle.assigned_driver} />, toneValue: '' },
    { icon: Truck, tone: 'text-sky-400', label: 'Make / Model', value: [vehicle.make, vehicle.model].filter(Boolean).join(' ') || '—' },
    vehicle.year && { icon: CalendarDays, tone: 'text-violet-400', label: 'Year', value: vehicle.year },
    { icon: FuelIcon, tone: 'text-amber-400', label: 'Fuel Type', value: vehicle.fuel_type || '—' },
    { icon: Gauge, tone: 'text-emerald-400', label: 'Odometer', value: `${Number(vehicle.odometer_km || 0).toLocaleString()} km` },
    vehicle.assigned_driver && { icon: UserCheck, tone: 'text-sky-400', label: 'Assigned Driver', value: vehicle.assigned_driver },
    vehicle.vendor_name && { icon: User, tone: 'text-rose-400', label: 'Vendor', value: vehicle.vendor_name },
  ].filter(Boolean);

  const complianceRows = [
    { icon: CalendarClock, tone: 'text-emerald-400', label: 'Registration', value: formatDate(vehicle.registration_expiry) || '—', toneValue: expiryTone(vehicle.registration_expiry) },
    { icon: ShieldCheck, tone: 'text-emerald-400', label: 'Insurance', value: formatDate(vehicle.insurance_expiry) || '—', toneValue: expiryTone(vehicle.insurance_expiry) },
    { icon: Wrench, tone: 'text-amber-400', label: 'Last Service', value: formatDate(vehicle.last_service_date) || '—' },
    { icon: CalendarDays, tone: 'text-violet-400', label: 'Next Service', value: formatDate(vehicle.next_service_date) || '—', toneValue: expiryTone(vehicle.next_service_date) },
  ];

  const driverRows = [
    driver?.phone && { icon: Phone, tone: 'text-emerald-400', label: 'Phone', value: driver.phone, href: `tel:${driver.phone}` },
    driver?.email && { icon: Mail, tone: 'text-sky-400', label: 'Email', value: driver.email, href: `mailto:${driver.email}` },
    driver?.license_number && { icon: IdCard, tone: 'text-violet-400', label: 'License #', value: driver.license_number },
    driver?.license_expiry && { icon: CalendarClock, tone: 'text-amber-400', label: 'License Expiry', value: formatDate(driver.license_expiry), toneValue: expiryTone(driver.license_expiry) },
  ].filter(Boolean);

  const licenseGroups = (() => {
    if (!vehicle.notes) return [];
    const data = parseLicenseNotes(vehicle.notes);
    if (!Object.keys(data).length) return [];
    return LICENSE_SECTIONS.map((sec) => {
      const rows = sec.fields
        .filter((f) => data[f.key])
        .map((f) => ({ icon: Hash, tone: 'text-violet-400', label: f.label, value: data[f.key] }));
      if (!rows.length) return null;
      return { id: sec.id, icon: sec.icon, title: sec.title, rows };
    }).filter(Boolean);
  })();

  return (
    <div className="glass-card relative overflow-hidden row-edge-glow animate-fade-in-up" style={CARD_BASE}>
      {/* header band */}
      <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.06]" style={{ background: `linear-gradient(135deg, ${hexToRgba(ACCENT, 0.10)} 0%, transparent 100%)` }}>
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none opacity-25" style={{ background: `radial-gradient(circle, ${hexToRgba(ACCENT, 0.5)} 0%, transparent 70%)` }} />
        <div className="relative flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="absolute -inset-1 rounded-xl animate-halo pointer-events-none" style={{ background: `radial-gradient(circle, ${hexToRgba(ACCENT, 0.40)} 0%, transparent 70%)` }} />
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
        {baseRows.map((r, i) => <Row key={i} {...r} />)}

        <Group icon={ShieldCheck} tone="text-emerald-400" title="Compliance & Service">
          {complianceRows.map((r, i) => <Row key={i} {...r} />)}
        </Group>

        <Group
          icon={CreditCard}
          tone="text-violet-400"
          title="Ownership Card"
          action={
            <button onClick={() => setShowOwnership((s) => !s)} className="ml-auto text-[10px] text-primary hover:underline">
              {showOwnership ? 'Hide' : 'Show'}
            </button>
          }
        >
          {showOwnership && (
            <div className="animate-fade-in">
              <OwnershipCard front={vehicle.ownership_front_url} back={vehicle.ownership_back_url} onChange={onSaveOwnership} />
              <p className="text-[10px] text-muted-foreground mt-2">Attach front &amp; back (JPG/PNG). Use the flip icon to switch sides.</p>
            </div>
          )}
        </Group>

        {driverRows.length > 0 && (
          <Group icon={User} tone="text-sky-400" title="Driver Details" action={driver?.name && <span className="text-xs text-muted-foreground truncate ml-1">· {driver.name}</span>}>
            {driverRows.map((r, i) => <Row key={i} {...r} />)}
          </Group>
        )}

        {licenseGroups.map((g) => (
          <Group key={g.id} icon={g.icon} tone="text-violet-400" title={g.title}>
            {g.rows.map((r, i) => <Row key={i} {...r} />)}
          </Group>
        ))}
      </div>

      <VehicleEditModal open={editOpen} onOpenChange={setEditOpen} vehicle={vehicle} onSaved={onSaved} />
    </div>
  );
}