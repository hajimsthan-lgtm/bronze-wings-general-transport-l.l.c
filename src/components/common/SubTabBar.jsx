export default function SubTabBar({ value, onChange, options, compact = false, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1 w-fit p-1 rounded-2xl glass-sm border border-white/[0.06] ${className}`}>
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