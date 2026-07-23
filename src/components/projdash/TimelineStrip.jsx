export default function TimelineStrip() {
  const days = Array.from({ length: 14 }, (_, i) => ({ d: i + 8, today: i + 8 === 17 }));
  return (
    <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-1">
      {days.map((day) => (
        <div key={day.d} className="flex flex-col items-center gap-2 flex-shrink-0 px-1.5">
          <span className="text-[11px] font-medium tabular-nums" style={{ color: day.today ? '#fff' : '#6b7280' }}>{day.d}</span>
          <span className="w-2 h-2 rounded-full" style={{ background: day.today ? '#3b82f6' : 'rgba(255,255,255,0.15)', boxShadow: day.today ? '0 0 8px #3b82f6' : 'none' }} />
        </div>
      ))}
    </div>
  );
}