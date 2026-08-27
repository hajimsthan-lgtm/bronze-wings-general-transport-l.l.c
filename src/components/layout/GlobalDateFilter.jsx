import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import { cn } from '@/lib/utils';

const PRESETS = [
  { label: 'All', get: () => ({ from: null, to: null }) },
  { label: 'Today', get: () => { const d = new Date(); return { from: d, to: d }; } },
  { label: 'Last 7 Days', get: () => { const d = new Date(); const f = new Date(); f.setDate(f.getDate() - 6); return { from: f, to: d }; } },
  { label: 'Last 30 Days', get: () => { const d = new Date(); const f = new Date(); f.setDate(f.getDate() - 29); return { from: f, to: d }; } },
  { label: 'This Month', get: () => { const d = new Date(); const f = new Date(d.getFullYear(), d.getMonth(), 1); return { from: f, to: d }; } },
];

const toISO = (d) => (d ? format(d, 'yyyy-MM-dd') : '');

export default function GlobalDateFilter({ className = '', style, solid }) {
  const { dateFrom, dateTo, setDateFrom, setDateTo, setToday } = useGlobalDate();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('range'); // 'range' | 'single'

  const range = { from: dateFrom ? new Date(dateFrom) : undefined, to: dateTo ? new Date(dateTo) : undefined };
  const singleSelected = dateFrom ? new Date(dateFrom) : undefined;

  const applyRange = (r) => {
    setDateFrom(r?.from ? toISO(r.from) : '');
    setDateTo(r?.to ? toISO(r.to) : '');
  };
  const applySingle = (d) => {
    const iso = d ? toISO(d) : '';
    setDateFrom(iso);
    setDateTo(iso);
  };
  const handlePreset = (get) => { applyRange(get()); setOpen(false); };

  const isSingle = mode === 'single' && dateFrom && dateFrom === dateTo;
  const label = dateFrom && dateTo
    ? (isSingle ? dateFrom : `${dateFrom} → ${dateTo}`)
    : 'Dates';

  const isFiltered = !!(dateFrom || dateTo);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={`relative ${solid ? 'w-10 h-10 rounded-full flex items-center justify-center' : 'w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground'} transition-all duration-200 shrink-0 ${className}`}
        style={solid ? { border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' } : !solid && !className ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' } : !solid ? style : undefined}
        aria-label="Global date filter"
        title={isFiltered ? `${label}` : 'Filter all pages by date'}
      >
          <CalendarIcon className="w-[18px] h-[18px]" />
          {isFiltered && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-background" />
          )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover border-border" align="center">
        <div className="flex flex-col sm:flex-row">
          <div className="p-3 sm:border-r border-border bg-muted/30 flex flex-col gap-1">
            <div className="flex items-center justify-center gap-3 mb-3 self-start py-1">
              <span className={cn('text-xs font-medium transition-colors', mode === 'range' ? 'text-foreground' : 'text-muted-foreground')}>Range</span>
              <button
                type="button"
                onClick={() => setMode(mode === 'range' ? 'single' : 'range')}
                className="relative h-7 w-12 rounded-full bg-white/20 p-1 transition-colors"
              >
                <div className={cn('h-5 w-5 rounded-full bg-white transition-transform duration-200', mode === 'single' ? 'ml-auto' : 'mr-auto')} />
              </button>
              <span className={cn('text-xs font-medium transition-colors', mode === 'single' ? 'text-foreground' : 'text-muted-foreground')}>Single</span>
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
                <button onClick={() => { setToday(); setOpen(false); }} className="text-left text-xs px-3 py-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-foreground transition-colors whitespace-nowrap">
                  Reset to Today
                </button>
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
  );
}