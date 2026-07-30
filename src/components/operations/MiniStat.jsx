export default function MiniStat({ label, value, tone = 'text-foreground', icon: Icon }) {
  return (
    <div className="relative rounded-2xl px-3.5 py-3 overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{ background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.55), rgba(var(--surf-2-rgb),0.78))', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 6px 18px rgba(0,0,0,0.28)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-white/45 font-semibold truncate">{label}</span>
        {Icon && (
          <span className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Icon className={`w-3.5 h-3.5 ${tone}`} />
          </span>
        )}
      </div>
      <p className={`mt-1 text-base font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}