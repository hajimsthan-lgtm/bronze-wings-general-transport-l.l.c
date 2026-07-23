export default function SegmentedToggle({ value, onChange, options }) {
  return (
    <div className="inline-flex items-center p-1 rounded-full bg-muted/50 border border-border">
      {options.map((o) => {
        const active = value === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-medium transition-all ${
              active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}