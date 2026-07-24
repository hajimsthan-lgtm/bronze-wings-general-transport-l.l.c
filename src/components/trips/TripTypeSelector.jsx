import { ArrowRight, RefreshCw, Clock, FileText } from 'lucide-react';

const CARDS = [
  { value: 'one_way', icon: ArrowRight },
  { value: 'return', icon: RefreshCw },
  { value: 'hourly', icon: Clock },
  { value: 'contract', icon: FileText },
];

export default function TripTypeSelector({ value, onChange, t }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {CARDS.map((c) => {
        const Icon = c.icon;
        const active = value === c.value;
        return (
          <button
            type="button"
            key={c.value}
            onClick={() => onChange(c.value)}
            className={`trip-type-card ${active ? 'trip-type-card-active' : ''}`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] font-semibold leading-tight text-center">{t(c.value)}</span>
          </button>
        );
      })}
    </div>
  );
}