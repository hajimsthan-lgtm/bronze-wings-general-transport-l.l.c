import { useState } from 'react';
import { Phone, Mail, BadgeCheck, Wallet, ShieldCheck, CalendarClock, Car, Pencil, Hash, Globe2, TrendingUp, MapPin } from 'lucide-react';
import DriverEditModal from '@/components/admin/DriverEditModal';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const expiryTone = (d) => {
  if (!d) return 'text-muted-foreground/40';
  const today = new Date().toISOString().split('T')[0];
  if (d < today) return 'text-rose-400';
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  return d <= soon ? 'text-amber-400' : 'text-foreground';
};

const CARD_BASE = {
  ['--row-accent']: '#1ED760',
  borderTop: '3px solid #1ED760',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 18px rgba(0,0,0,0.3)',
};

export default function DriverProfileCard({ driver, vehicle, stats, onSave }) {
  const [editOpen, setEditOpen] = useState(false);
  const isActive = driver.status === 'active';
  const dotColor = isActive ? '#34d399' : driver.status === 'on_leave' ? '#f59e0b' : '#94a3b8';

  const statsList = [
    { label: 'Trips', value: stats?.trips ?? 0, accent: '#1ED760' },
    { label: 'Revenue', value: formatCurrency(stats?.revenue ?? 0), accent: '#34d399' },
    { label: 'Experience', value: stats?.experience ?? '—', accent: '#a855f7' },
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
              {driver.image_url
                ? <img src={driver.image_url} alt="" className="w-full h-full object-cover" />
                : <span className="text-xl font-bold text-white entity-avatar w-full h-full flex items-center justify-center">{initialsOf(driver.name)}</span>}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-foreground leading-tight break-words">{driver.name}</h2>
              <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="relative flex w-2 h-2">
                {isActive && <span className="absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping" style={{ background: dotColor }} />}
                <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: dotColor }} />
              </span>
              <span className="text-xs text-muted-foreground">Transport Driver</span>
            </div>
          </div>
          <button onClick={() => setEditOpen(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Edit driver">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <StatusBadge status={driver.status} />
        </div>
      </div>

      {/* inline stats strip */}
      <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
        {statsList.map((s) => (
          <div key={s.label} className="px-1.5 py-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{s.label}</p>
            <p className="text-sm font-semibold tabular-nums truncate" style={{ color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* info rows — matching Client pattern */}
      <div className="px-5 py-4 space-y-2.5">
        {driver.phone && (
          <a href={`tel:${driver.phone}`} className="flex items-center gap-2.5 text-xs hover:bg-white/[0.03] -mx-1 px-1 py-1 rounded-lg transition-colors">
            <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Phone</span>
            <span className="ml-auto font-semibold text-foreground tabular-nums truncate">{driver.phone}</span>
          </a>
        )}
        {driver.email && (
          <a href={`mailto:${driver.email}`} className="flex items-center gap-2.5 text-xs hover:bg-white/[0.03] -mx-1 px-1 py-1 rounded-lg transition-colors">
            <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Email</span>
            <span className="ml-auto font-semibold text-foreground truncate">{driver.email}</span>
          </a>
        )}
        <div className="flex items-center gap-2.5 text-xs">
          <Wallet className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-muted-foreground">Base Salary</span>
          <span className="ml-auto font-semibold text-foreground tabular-nums">{formatCurrency(driver.base_salary)}</span>
        </div>
        {driver.license_number && (
          <div className="flex items-center gap-2.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
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
        {driver.visa_expiry && (
          <div className="flex items-center gap-2.5 text-xs">
            <CalendarClock className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
            <span className="text-muted-foreground">Visa Expiry</span>
            <span className={`ml-auto font-semibold tabular-nums truncate ${expiryTone(driver.visa_expiry)}`}>{formatDate(driver.visa_expiry)}</span>
          </div>
        )}
        {driver.nationality && (
          <div className="flex items-center gap-2.5 text-xs">
            <Globe2 className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <span className="text-muted-foreground">Nationality</span>
            <span className="ml-auto font-semibold text-foreground truncate">{driver.nationality}</span>
          </div>
        )}
        {driver.join_date && (
          <div className="flex items-center gap-2.5 text-xs">
            <CalendarClock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Join Date</span>
            <span className="ml-auto font-semibold text-foreground tabular-nums">{formatDate(driver.join_date)}</span>
          </div>
        )}
        {driver.emergency_contact && (
          <div className="flex items-center gap-2.5 text-xs">
            <Phone className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className="text-muted-foreground">Emergency</span>
            <span className="ml-auto font-semibold text-foreground tabular-nums truncate">{driver.emergency_contact}</span>
          </div>
        )}

        {/* Profit Summary sub-section */}
        <div className="pt-2.5 mt-1 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Profit Summary</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Trip Revenue</span>
              <span className="ml-auto font-semibold text-emerald-400 tabular-nums">{formatCurrency(stats?.revenue ?? 0)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Expenses</span>
              <span className="ml-auto font-semibold text-amber-400 tabular-nums">{formatCurrency(stats?.expenses ?? 0)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Salary</span>
              <span className="ml-auto font-semibold text-sky-400 tabular-nums">{formatCurrency(stats?.salary ?? 0)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs pt-1 border-t border-white/[0.04]">
              <span className="text-muted-foreground font-medium">Net Profit</span>
              <span className={`ml-auto font-bold tabular-nums ${(stats?.netProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatCurrency(stats?.netProfit ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* assigned vehicle footer */}
      {vehicle && (
        <div className="mx-5 mb-5 flex items-center gap-3 rounded-xl p-3 border border-white/[0.06]" style={{ background: hexToRgba('#3b82f6', 0.06) }}>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Car className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{vehicle.make} {vehicle.model}</p>
            <p className="text-xs text-muted-foreground">{vehicle.plate_number}</p>
          </div>
        </div>
      )}

      <DriverEditModal open={editOpen} onOpenChange={setEditOpen} driver={driver} onSaved={onSave} />
    </div>
  );
}