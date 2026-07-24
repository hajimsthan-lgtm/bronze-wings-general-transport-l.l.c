/**
 * Beautiful hero banner card for entity list pages (Drivers, Clients, Vehicles).
 * On-brand dark glass + accent gradient with a big total and mini stat chips.
 */
export default function EntityHeroCard({ icon: Icon, title, total, stats = [], accent = '59,130,246' }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 mb-5 border border-white/[0.06]"
      style={{
        background: `linear-gradient(135deg, rgba(${accent},0.16) 0%, var(--surf-1) 55%, var(--surf-2) 100%)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 36px rgba(0,0,0,0.35)',
      }}
    >
      {/* ambient glow */}
      <div
        className="absolute -top-12 -right-10 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, rgba(${accent},0.28), transparent 70%)`, filter: 'blur(40px)' }}
      />
      <div
        className="absolute -bottom-16 -left-10 w-40 h-40 rounded-full pointer-events-none opacity-60"
        style={{ background: `radial-gradient(circle, rgba(${accent},0.16), transparent 70%)`, filter: 'blur(40px)' }}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
        {/* Lead: icon + total */}
        <div className="flex items-center gap-4 md:min-w-[230px]">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0"
            style={{
              background: `linear-gradient(135deg, rgba(${accent},0.95), rgba(${accent},0.5))`,
              boxShadow: `0 8px 24px rgba(${accent},0.35), inset 0 1px 0 rgba(255,255,255,0.25)`,
            }}
          >
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] font-semibold text-muted-foreground">{title}</p>
            <p className="text-4xl font-display font-bold text-foreground leading-none mt-1 tabular-nums">{total}</p>
          </div>
        </div>

        {/* Stat chips */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-3 py-2.5 bg-muted/40 border border-border/50"
            >
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: s.color || '#a0a5b8' }}>{s.label}</p>
              <p className="text-xl font-semibold text-foreground mt-0.5 tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}