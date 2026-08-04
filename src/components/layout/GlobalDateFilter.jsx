import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useGlobalDate } from '@/lib/GlobalDateContext';

const PRESETS = [
  { label: 'Today', get: () => { const d = new Date(); return { from: d, to: d }; } },
  { label: 'Last 7 Days', get: () => { const d = new Date(); const f = new Date(); f.setDate(f.getDate() - 6); return { from: f, to: d }; } },
  { label: 'Last 30 Days', get: () => { const d = new Date(); const f = new Date(); f.setDate(f.getDate() - 29); return { from: f, to: d }; } },
  { label: 'This Month', get: () => { const d = new Date(); const f = new Date(d.getFullYear(), d.getMonth(), 1); return { from: f, to: d }; } },
];

const toISO = (d) => (d ? format(d, 'yyyy-MM-dd') : '');

export default function GlobalDateFilter() {
  const { dateFrom, dateTo, setDateFrom, setDateTo, setToday } = useGlobalDate();
  const [open, setOpen] = useState(false);

  const range = { from: dateFrom ? new Date(dateFrom) : undefined, to: dateTo ? new Date(dateTo) : undefined };
  const applyRange = (r) => {
    setDateFrom(r?.from ? toISO(r.from) : '');
    setDateTo(r?.to ? toISO(r.to) : '');
  };
  const handlePreset = (get) => { applyRange(get()); setOpen(false); };

  const label = dateFrom && dateTo
    ? (dateFrom === dateTo ? dateFrom : `${dateFrom} → ${dateTo}`)
    : 'Dates';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 h-9 px-3 rounded-full transition-all duration-300 shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
            border: '1px solid rgba(59,130,246,0.30)',
            color: '#fff',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
          aria-label="Global date filter"
          title="Filter all pages by date"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-blue-300 shrink-0" />
          <span className="text-[11px] font-mono tabular-nums truncate hidden lg:inline max-w-[140px]">{label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-white/50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover border-border" align="center">
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
            <button
              onClick={() => { setToday(); setOpen(false); }}
              className="text-left text-xs px-3 py-2 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-foreground transition-colors whitespace-nowrap"
            >
              Today
            </button>
          </div>
          <Calendar
            mode="range"
            selected={range}
            onSelect={applyRange}
            numberOfMonths={1}
            initialFocus
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}