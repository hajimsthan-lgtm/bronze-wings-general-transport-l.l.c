import { ArrowRight, RefreshCw, FileText } from 'lucide-react';

const CARDS = [
  { value: 'one_way',  icon: ArrowRight,  label: 'One Way',    sub: 'Hourly' },
  { value: 'contract', icon: FileText,    label: 'One Way',    sub: 'Contract' },
  { value: 'return',   icon: RefreshCw,   label: 'Return',     sub: 'Round Trip' },
];

export default function TripTypeSelector({ value, onChange, t }) {
  return (
    <div className="grid grid-cols-3 gap-2">
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
            <Icon className={`w-4 h-4 transition-colors ${active ? 'text-primary' : ''}`} />
            <span className="text-[10px] font-bold leading-tight text-center">{c.label}</span>
            <span className={`text-[8px] leading-tight text-center ${active ? 'text-primary/80' : 'text-muted-foreground'}`}>{c.sub}</span>
          </button>
        );
      })}
    </div>
  );
}