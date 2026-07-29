export default function SubTabBar({ value, onChange, options, compact = false, className = '' }) {
  return (
    <div className={`flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1 backdrop-blur-lg w-fit ${className}`}>
      {options.map((o) => {
        const active = value === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`sub-tab inline-flex items-center gap-1.5 ${active ? 'sub-tab-active' : ''} ${compact ? '!px-2.5 !py-1.5 !text-[10px]' : ''}`}
            title={o.label}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {(!compact || !Icon) && <span>{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}