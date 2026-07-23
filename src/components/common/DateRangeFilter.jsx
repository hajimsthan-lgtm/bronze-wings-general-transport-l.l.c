import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useI18n } from '@/lib/i18n';

const PRESETS = [
  { label: 'Today', get: () => { const d = new Date(); return { from: d, to: d }; } },
  { label: 'Last 7 Days', get: () => { const d = new Date(); const f = new Date(); f.setDate(f.getDate() - 6); return { from: f, to: d }; } },
  { label: 'Last 30 Days', get: () => { const d = new Date(); const f = new Date(); f.setDate(f.getDate() - 29); return { from: f, to: d }; } },
  { label: 'This Month', get: () => { const d = new Date(); const f = new Date(d.getFullYear(), d.getMonth(), 1); return { from: f, to: d }; } },
];

const toISO = (d) => (d ? format(d, 'yyyy-MM-dd') : '');

export default function DateRangeFilter({ fromValue, onFromChange, toValue, onToChange, onToday }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const range = { from: fromValue ? new Date(fromValue) : undefined, to: toValue ? new Date(toValue) : undefined };

  const apply = (r) => {
    onFromChange(r?.from ? toISO(r.from) : '');
    onToChange(r?.to ? toISO(r.to) : '');
  };

  const handlePreset = (get) => { apply(get()); setOpen(false); };

  const label = fromValue && toValue
    ? `${fromValue} → ${toValue}`
    : (fromValue || toValue || 'Select dates');

  return (
    <div className="flex items-center gap-2 w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-2 h-10 px-4 rounded-xl w-full md:w-auto justify-between md:justify-start transition-all"
            style={{
              background: '#1e2130',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.03)',
            }}
          >
            <CalendarIcon className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-sm text-foreground font-mono tabular-nums truncate">{label}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
          <div className="flex flex-col sm:flex-row">
            <div className="p-3 sm:border-r border-border bg-muted/30 flex flex-col gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => handlePreset(p.get)}
                  className="text-left text-xs px-3 py-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Calendar
              mode="range"
              selected={range}
              onSelect={apply}
              numberOfMonths={1}
              initialFocus
            />
          </div>
        </PopoverContent>
      </Popover>

      <button
        onClick={onToday}
        className="rounded-xl px-4 h-10 text-xs font-semibold whitespace-nowrap text-white transition-all hover:brightness-110"
        style={{ background: 'linear-gradient(135deg,#3b82f6,#60a5fa)', boxShadow: '0 4px 16px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' }}
      >
        {t('today')}
      </button>
    </div>
  );
}