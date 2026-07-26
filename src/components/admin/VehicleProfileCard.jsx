import { Truck, Gauge, Fuel as FuelIcon, Wallet, MessageCircle, CreditCard } from 'lucide-react';
import PlateBadge from '@/components/common/PlateBadge';
import OwnershipCard from '@/components/common/OwnershipCard';
import StatusBadge from '@/components/common/StatusBadge';
import FlipCard from '@/components/common/FlipCard';
import { formatCurrency } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

export default function VehicleProfileCard({ vehicle, driver, stats, onSaveOwnership }) {
  const accent = '#3b82f6';
  const statsList = [
    { label: 'Odometer', value: `${Number(vehicle.odometer_km || 0).toLocaleString()} km`, icon: Gauge, accent: '#60a5fa' },
    { label: 'Fuel', value: vehicle.fuel_type, icon: FuelIcon, accent: '#f59e0b' },
    { label: 'Trips', value: stats?.trips ?? 0, icon: Truck, accent: '#a855f7' },
    { label: 'Revenue', value: formatCurrency(stats?.revenue ?? 0), icon: Wallet, accent: '#34d399' },
  ];

  const front = (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-20" style={{ background: `radial-gradient(circle, ${hexToRgba(accent, 0.5)} 0%, transparent 70%)` }} />
      <div className="relative flex items-start gap-4 pr-10">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 bg-muted/40 flex items-center justify-center flex-shrink-0">
          {vehicle.image_url ? <img src={vehicle.image_url} alt="" className="w-full h-full object-cover" /> : <Truck className="w-9 h-9 text-primary/60" />}
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
  );

  const back = (
    <div className="glass-card p-5 relative overflow-hidden min-h-full">
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-20" style={{ background: `radial-gradient(circle, ${hexToRgba('#a855f7', 0.5)} 0%, transparent 70%)` }} />
      <div className="relative flex items-center gap-2 mb-3 pr-10">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: hexToRgba('#a855f7', 0.14), border: `1px solid ${hexToRgba('#a855f7', 0.3)}` }}>
          <CreditCard className="w-4 h-4" style={{ color: '#a855f7' }} />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Ownership Card</h3>
      </div>
      <div className="relative max-w-[420px] mx-auto">
        <OwnershipCard front={vehicle.ownership_front_url} back={vehicle.ownership_back_url} onChange={onSaveOwnership} />
      </div>
      <p className="relative text-[10px] text-muted-foreground text-center mt-3">Attach front &amp; back (JPG/PNG). Use the flip icon on the card to switch sides.</p>
    </div>
  );

  return <FlipCard front={front} back={back} />;
}