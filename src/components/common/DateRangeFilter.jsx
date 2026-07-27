import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

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
  const [mode, setMode] = useState('range'); // 'range' | 'single'

  const range = { from: fromValue ? new Date(fromValue) : undefined, to: toValue ? new Date(toValue) : undefined };
  const singleSelected = fromValue ? new Date(fromValue) : undefined;

  const applyRange = (r) => {
    onFromChange(r?.from ? toISO(r.from) : '');
    onToChange(r?.to ? toISO(r.to) : '');
  };
  const applySingle = (d) => {
    const iso = d ? toISO(d) : '';
    onFromChange(iso);
    onToChange(iso);
  };
  const handlePreset = (get) => { applyRange(get()); setOpen(false); };

  const isSingle = mode === 'single' && fromValue && fromValue === toValue;
  const label = fromValue && toValue
    ? (isSingle ? fromValue : `${fromValue} → ${toValue}`)
    : (fromValue || toValue || 'Select dates');

  return (
    <div className="flex items-center gap-2 w-full md:w-auto">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="flex items-center gap-2 h-10 px-3 sm:px-4 rounded-xl flex-1 md:flex-initial md:w-auto justify-between md:justify-start transition-all min-w-0 bg-input border border-white/10"
            style={{ boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.03)' }}
          >
            <CalendarIcon className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-sm text-foreground font-mono tabular-nums truncate">{label}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
          <div className="flex flex-col sm:flex-row">
            <div className="p-3 sm:border-r border-border bg-muted/30 flex flex-col gap-1">
              <div className="inline-flex p-0.5 rounded-lg bg-background/40 border border-white/10 mb-2 self-start">
                <button type="button" onClick={() => setMode('range')} className={cn('px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors', mode === 'range' ? 'bg-primary/20 text-foreground border border-primary/40' : 'text-muted-foreground hover:text-foreground')}>Range</button>
                <button type="button" onClick={() => setMode('single')} className={cn('px-2.5 h-7 rounded-md text-[11px] font-medium transition-colors', mode === 'single' ? 'bg-primary/20 text-foreground border border-primary/40' : 'text-muted-foreground hover:text-foreground')}>Single</button>
              </div>
              {mode === 'range' ? (
                <>
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => handlePreset(p.get)}
                      className="text-left text-xs px-3 py-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-foreground transition-colors whitespace-nowrap"
                    >
                      {p.label}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button onClick={() => { applySingle(new Date()); setOpen(false); }} className="text-left text-xs px-3 py-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-foreground transition-colors whitespace-nowrap">
                    Today
                  </button>
                  {onToday && (
                    <button onClick={() => { onToday(); setOpen(false); }} className="text-left text-xs px-3 py-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-foreground transition-colors whitespace-nowrap">
                      Apply custom
                    </button>
                  )}
                </>
              )}
            </div>
            {mode === 'range' ? (
              <Calendar
                mode="range"
                selected={range}
                onSelect={applyRange}
                numberOfMonths={1}
                initialFocus
              />
            ) : (
              <Calendar
                mode="single"
                selected={singleSelected}
                onSelect={(d) => { applySingle(d); setOpen(false); }}
                numberOfMonths={1}
                initialFocus
              />
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}