export default function GoalsList({ goals }) {
  return (
    <div className="rounded-3xl p-5 sm:p-6 h-full"
      style={{ background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.72) 0%, rgba(var(--surf-2-rgb),0.86) 100%)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.35)', backdropFilter: 'blur(20px) saturate(1.3)', WebkitBackdropFilter: 'blur(20px) saturate(1.3)' }}>
      <h2 className="text-sm font-semibold text-white mb-4">Fleet Goals</h2>
      <div className="space-y-4">
        {goals.map((g) => (
          <div key={g.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[12px] text-white/70 font-medium">{g.label}</span>
              <span className="text-[12px] font-bold tabular-nums" style={{ color: g.color }}>{g.pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(2, Math.min(100, g.pct))}%`, background: `linear-gradient(90deg, ${g.color}, ${g.color}aa)`, boxShadow: `0 0 8px ${g.color}66` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}