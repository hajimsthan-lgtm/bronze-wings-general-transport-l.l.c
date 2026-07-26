import { Info, Truck, MessageCircle } from 'lucide-react';
import FleetStars from './FleetStars';
import PlateBadge from '@/components/common/PlateBadge';
import FleetRouteMap from './FleetRouteMap';
import DriverTripsPanel from '@/components/drivers/DriverTripsPanel';

export default function FleetDashboard({ hero, info, profile, route, trips, tripsLoading }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {/* Row 1: hero + info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hero */}
          <div className="glass-card p-4">
            <div className="mb-3">
              <h3 className="text-base font-bold text-foreground leading-tight">{hero.title}</h3>
              {hero.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{hero.subtitle}</p>}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-24 h-16 rounded-xl bg-muted/40 border border-white/[0.06] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {hero.image ? (
                  <img src={hero.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Truck className="w-8 h-8 text-primary/50" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{hero.vehicleLabel}</p>
                <FleetStars value={hero.rating} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {hero.stats.map((s, i) => (
                <div key={i} className="rounded-xl bg-muted/30 border border-white/[0.06] p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="text-sm font-semibold text-foreground tabular-nums truncate">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="glass-card p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-primary" />
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Information</h3>
            </div>
            <div className="space-y-3 mb-4">
              {info.rows.map((r, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{r.label}</span>
                  {r.onClick ? (
                    <button type="button" onClick={r.onClick} title="View breakdown" className={`text-sm font-semibold underline decoration-dotted underline-offset-2 hover:opacity-80 transition-opacity ${r.tone || 'text-foreground'}`}>
                      {r.value}
                    </button>
                  ) : (
                    <span className={`text-sm font-semibold ${r.tone || 'text-foreground'}`}>{r.value}</span>
                  )}
                </div>
              ))}
            </div>
            {info.card && (
              <div className="mt-auto">
                <PlateBadge plate={info.card.last4} holder={info.card.holder} />
              </div>
            )}
          </div>
        </div>

        {/* Row 2: profile */}
        {profile && (
          <div className="glass-card p-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-16 h-16 rounded-full entity-avatar flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                {profile.initials || '?'}
              </div>
              <div className="flex-1 text-center sm:text-left min-w-0">
                <p className="text-base font-bold text-foreground">{profile.name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email || profile.phone || ''}</p>
                <div className="flex items-center justify-center sm:justify-start gap-5 mt-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rate</p>
                    <FleetStars value={profile.rating} size={12} className="mt-0.5" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{profile.expLabel || 'Experience'}</p>
                    <p className="text-sm font-semibold text-foreground">{profile.experience}</p>
                  </div>
                </div>
              </div>
              {profile.chatHref && (
                <a href={profile.chatHref} className="clay-btn flex items-center gap-2 !rounded-xl !py-2.5 text-sm whitespace-nowrap">
                  <MessageCircle className="w-4 h-4" /> Start a chat
                </a>
              )}
            </div>
          </div>
        )}

        {/* Row 3: map + timeline */}
        <FleetRouteMap {...route} />
      </div>

      {/* Right: trips panel */}
      <div>
        <DriverTripsPanel trips={trips} loading={tripsLoading} />
      </div>
    </div>
  );
}