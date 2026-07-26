import { Truck, Gauge, Fuel as FuelIcon, Wallet, MessageCircle, CreditCard, CalendarClock, ShieldCheck, Wrench, CalendarDays, StickyNote } from 'lucide-react';
import PlateBadge from '@/components/common/PlateBadge';
import OwnershipCard from '@/components/common/OwnershipCard';
import StatusBadge from '@/components/common/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const LUMINATE = {
  borderTop: '3px solid #3b82f6',
  boxShadow: '0 0 0 1px rgba(59,130,246,0.25), 0 0 60px -8px rgba(59,130,246,0.55), 0 0 90px -20px rgba(168,85,247,0.35), 0 24px 60px rgba(0,0,0,0.5)',
};

const expiryTone = (d) => {
  if (!d) return 'text-muted-foreground';
  const today = new Date().toISOString().split('T')[0];
  if (d < today) return 'text-rose-400';
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
  return d <= soon ? 'text-amber-400' : 'text-foreground';
};

export default function VehicleProfileCard({ vehicle, driver, stats, onSaveOwnership }) {
  const statsList = [
    { label: 'Odometer', value: `${Number(vehicle.odometer_km || 0).toLocaleString()} km`, icon: Gauge, accent: '#60a5fa' },
    { label: 'Fuel', value: vehicle.fuel_type, icon: FuelIcon, accent: '#f59e0b' },
    { label: 'Trips', value: stats?.trips ?? 0, icon: Truck, accent: '#a855f7' },
    { label: 'Revenue', value: formatCurrency(stats?.revenue ?? 0), icon: Wallet, accent: '#34d399' },
  ];

  const detailTiles = [
    { label: 'Registration', value: formatDate(vehicle.registration_expiry), icon: CalendarClock, accent: '#60a5fa', tone: expiryTone(vehicle.registration_expiry) },
    { label: 'Insurance', value: formatDate(vehicle.insurance_expiry), icon: ShieldCheck, accent: '#34d399', tone: expiryTone(vehicle.insurance_expiry) },
    { label: 'Last Service', value: formatDate(vehicle.last_service_date), icon: Wrench, accent: '#f59e0b', tone: 'text-foreground' },
    { label: 'Next Service', value: formatDate(vehicle.next_service_date), icon: CalendarDays, accent: '#a855f7', tone: expiryTone(vehicle.next_service_date) },
  ];

  return (
    <div className="glass-card p-5 relative overflow-hidden animate-border-pulse" style={LUMINATE}>
      <div className="absolute -top-24 -left-12 w-64 h-64 rounded-full pointer-events-none opacity-40" style={{ background: `radial-gradient(circle, ${hexToRgba('#3b82f6', 0.50)} 0%, transparent 70%)` }} />
      <div className="absolute -bottom-28 -right-12 w-64 h-64 rounded-full pointer-events-none opacity-30" style={{ background: `radial-gradient(circle, ${hexToRgba('#a855f7', 0.45)} 0%, transparent 70%)` }} />
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.7), rgba(168,85,247,0.5), transparent)' }} />

      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left — identity & stats */}
        <div>
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1.5 rounded-2xl animate-halo pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.45) 0%, transparent 70%)' }} />
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-muted/40 flex items-center justify-center">
                {vehicle.image_url ? <img src={vehicle.image_url} alt="" className="w-full h-full object-cover" /> : <Truck className="w-9 h-9 text-primary/60" />}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground leading-tight">{vehicle.make} {vehicle.model} {vehicle.year || ''}</h2>
                <StatusBadge status={vehicle.status} />
              </div>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">{vehicle.type} · {vehicle.fuel_type}</p>
              <div className="mt-2.5"><PlateBadge plate={vehicle.plate_number} holder={vehicle.assigned_driver} /></div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
            {statsList.map((s) => { const I = s.icon; return (
              <div key={s.label} className="rounded-xl p-2.5 border border-white/[0.06]" style={{ background: hexToRgba(s.accent, 0.06) }}>
                <div className="flex items-center gap-1.5 mb-1"><I className="w-3.5 h-3.5" style={{ color: s.accent }} /><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p></div>
                <p className="text-sm font-semibold text-foreground tabular-nums truncate">{s.value}</p>
              </div>
            ); })}
          </div>

          {driver && (
            <div className="mt-4 flex items-center gap-3 rounded-xl p-3 border border-white/[0.06]" style={{ background: hexToRgba('#a855f7', 0.06) }}>
              <div className="w-11 h-11 rounded-full entity-avatar flex items-center justify-center text-sm font-bold text-white flex-shrink-0 overflow-hidden">
                {driver.image_url ? <img src={driver.image_url} alt="" className="w-full h-full object-cover" /> : initialsOf(driver.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{driver.name}</p>
                <p className="text-xs text-muted-foreground truncate">{driver.phone || driver.email || ''}</p>
              </div>
              {(driver.email || driver.phone) && (
                <a href={driver.email ? `mailto:${driver.email}` : `tel:${driver.phone}`} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-foreground hover:bg-white/10 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" /> Chat
                </a>
              )}
            </div>
          )}
        </div>

        {/* Right — ownership card */}
        <div className="lg:border-l lg:border-white/10 lg:pl-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba('#a855f7', 0.14), border: `1px solid ${hexToRgba('#a855f7', 0.3)}` }}>
              <CreditCard className="w-4 h-4" style={{ color: '#a855f7' }} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Ownership Card</h3>
          </div>
          <div className="max-w-[420px] w-full">
            <OwnershipCard front={vehicle.ownership_front_url} back={vehicle.ownership_back_url} onChange={onSaveOwnership} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">Attach front &amp; back (JPG/PNG). Use the flip icon on the card to switch sides.</p>
        </div>
      </div>

      {/* Vehicle details strip */}
      <div className="relative mt-5 pt-4 border-t border-white/[0.06]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {detailTiles.map((d) => { const I = d.icon; return (
            <div key={d.label} className="rounded-xl p-2.5 border border-white/[0.06]" style={{ background: hexToRgba(d.accent, 0.05) }}>
              <div className="flex items-center gap-1.5 mb-1"><I className="w-3.5 h-3.5" style={{ color: d.accent }} /><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{d.label}</p></div>
              <p className={`text-sm font-semibold tabular-nums truncate ${d.tone}`}>{d.value || '—'}</p>
            </div>
          ); })}
        </div>
        {vehicle.notes && (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl p-3 border border-white/[0.06]" style={{ background: hexToRgba('#ffffff', 0.03) }}>
            <StickyNote className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{vehicle.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}