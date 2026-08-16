/**
 * Swipeable stat card carousel — mobile only.
 * Usage: <MobileStatCarousel stats={[{ label, value, icon, color, sub }]} />
 */
export default function MobileStatCarousel({ stats = [], className = '' }) {
  if (!stats.length) return null;
  return (
    <div className={`md:hidden flex gap-3 overflow-x-auto mobile-snap-scroll premium-scroll -mx-4 px-4 pb-1 ${className}`}>
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="mobile-snap-item flex-shrink-0 w-[150px] glass-card p-4 space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-tight">{stat.label}</p>
              {Icon && (
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${stat.color || 'rgb(var(--panel-accent-rgb))'}18` }}
                >
                  <Icon className="w-4 h-4" style={{ color: stat.color || 'hsl(var(--primary))' }} />
                </div>
              )}
            </div>
            <p className="text-xl font-bold tabular-nums leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {stat.value}
            </p>
            {stat.sub && <p className="text-[10px] text-muted-foreground leading-tight">{stat.sub}</p>}
          </div>
        );
      })}
    </div>
  );
}