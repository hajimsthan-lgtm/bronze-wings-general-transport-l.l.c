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

export default function GlobalDateFilter() {
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 h-9 px-3 sm:px-4 rounded-xl transition-all shrink-0 bg-input border border-white/10"
          style={{ boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.03)' }}
          aria-label="Global date filter"
          title="Filter all pages by date"
        >
          <CalendarIcon className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-sm text-foreground font-mono tabular-nums truncate hidden lg:inline max-w-[140px]">{label}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover border-border" align="center">
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