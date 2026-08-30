const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function MiniCalendar({ className = '' }) {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const todayDate = today.getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className={`rounded-2xl p-3 ${className}`}
      style={{
        background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.60) 0%, rgba(var(--surf-2-rgb),0.75) 100%)',
        border: '1px solid rgba(var(--panel-accent-rgb),0.10)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
        {today.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
      </p>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d, i) => (
          <div key={i} className="h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-muted-foreground/60">
            {d}
          </div>
        ))}
        {cells.map((d, i) => (
          <div
            key={i}
            className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs transition-colors ${
              d === todayDate
                ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold shadow-lg'
                : d
                ? 'text-foreground/70 hover:bg-white/5 cursor-pointer'
                : ''
            }`}
          >
            {d || ''}
          </div>
        ))}
      </div>
    </div>
  );
}