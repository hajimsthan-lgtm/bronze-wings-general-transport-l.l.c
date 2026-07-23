export default function SegmentedBar({ value, onChange, options }) {
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const pct = 100 / options.length;

  return (
    <div className="inline-flex relative p-1 rounded-full bg-muted/50 border border-border backdrop-blur-md">
      <span
        className="absolute top-1 bottom-1 rounded-full bg-primary shadow-sm transition-all duration-300 ease-out"
        style={{ width: `calc(${pct}% - 0.5rem)`, left: `calc(${activeIndex * pct}% + 0.25rem)` }}
      />
      {options.map((o, i) => {
        const Icon = o.icon;
        const active = i === activeIndex;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`relative z-10 inline-flex items-center gap-2 h-9 px-5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors duration-200 ${
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}