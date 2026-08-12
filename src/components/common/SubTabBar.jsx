export default function SubTabBar({ value, onChange, options, compact = false, className = '' }) {
  return (
    <div className={`inline-flex items-center border rounded-lg border-border bg-muted/40 p-0.5 ${className}`}>
      {options.map((o) => {
        const active = value === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'} ${compact ? '!px-2.5 !py-1.5 !text-[10px]' : ''}`}
            title={o.label}>
            
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {(!compact || !Icon) && <span>{o.label}</span>}
          </button>);

      })}
    </div>);

}