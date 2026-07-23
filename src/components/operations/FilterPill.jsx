export default function FilterPill({ active, label, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted/50 border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {label}
      {count != null && <span className={`text-[10px] tabular-nums ${active ? 'opacity-70' : 'opacity-50'}`}>{count}</span>}
    </button>
  );
}