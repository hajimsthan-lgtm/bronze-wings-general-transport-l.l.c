export default function MiniStat({ label, value, tone = 'text-foreground', icon: Icon }) {
  return (
    <div className="rounded-xl px-3 py-2 bg-muted/40 border border-border">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-semibold tabular-nums flex items-center gap-1 ${tone}`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {value}
      </p>
    </div>
  );
}