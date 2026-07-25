export default function SegmentedToggle({ value, onChange, options, compact }) {
  return (
    <div className={`inline-flex items-center p-1 rounded-full bg-muted/50 border border-border ${compact ? 'gap-0.5' : ''}`}>
      {options.map((o) => {
        const active = value === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-all ${
              compact ? 'h-6 px-2' : 'h-7 px-3 text-xs'
            } ${active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            title={o.label}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {!compact && <span>{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}