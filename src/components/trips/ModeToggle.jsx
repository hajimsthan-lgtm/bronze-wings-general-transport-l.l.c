import { Truck } from 'lucide-react';

export default function ModeToggle({ mode, onChange, t }) {
  const options = [
    { key: 'trip', label: t('per_trip'), icon: Truck },
    { key: 'contract', label: t('monthly_contract'), icon: null },
  ];
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            mode === o.key ? 'text-white' : 'text-white/40 hover:text-white/60'
          }`}
          style={
            mode === o.key
              ? {
                  background: 'linear-gradient(135deg, rgba(30,215,96,0.25), rgba(37,99,235,0.12))',
                  border: '1px solid rgba(30,215,96,0.35)',
                  boxShadow: '0 0 12px rgba(30,215,96,0.18)',
                }
              : { border: '1px solid transparent' }
          }
        >
          {o.icon && <o.icon className="w-3.5 h-3.5" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}