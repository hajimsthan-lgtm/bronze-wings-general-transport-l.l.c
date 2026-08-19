import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parse, isValid, startOfMonth, isSameMonth } from 'date-fns';
import { cn } from '@/lib/utils';

const DATE_FMT = 'yyyy-MM-dd';
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function parseValue(v) {
  if (!v) return null;
  const d = typeof v === 'string' ? parse(v, DATE_FMT, new Date()) : new Date(v);
  return isValid(d) ? d : null;
}

// Accepts value as "YYYY-MM-DD" string (same as native <input type="date">)
export default function DatePicker({ value, onChange, placeholder = 'Pick a date', disabled, className }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('days'); // 'days' | 'months'
  const [displayMonth, setDisplayMonth] = useState(() => {
    const p = parseValue(value);
    return p ? startOfMonth(p) : startOfMonth(new Date());
  });
  const [manualText, setManualText] = useState(value || '');

  const parsed = parseValue(value);

  const handleSelect = (day) => {
    if (!day) return;
    onChange(format(day, DATE_FMT));
    setOpen(false);
  };

  const jumpToDate = (d) => setDisplayMonth(startOfMonth(d));

  // Manual entry: accept DD/MM/YYYY or YYYY-MM-DD; jump the calendar as the user types.
  const handleManual = (text) => {
    setManualText(text);
    const t = text.trim();
    if (!t) return;
    let d = parse(t, 'dd/MM/yyyy', new Date());
    if (!isValid(d)) d = parse(t, DATE_FMT, new Date());
    if (isValid(d)) jumpToDate(d);
  };

  const commitManual = () => {
    const t = manualText.trim();
    if (!t) return;
    let d = parse(t, 'dd/MM/yyyy', new Date());
    if (!isValid(d)) d = parse(t, DATE_FMT, new Date());
    if (isValid(d)) {
      onChange(format(d, DATE_FMT));
      setOpen(false);
    }
  };

  const openPopover = (o) => {
    setOpen(o);
    if (o) {
      setView('days');
      const p = parseValue(value);
      setDisplayMonth(p ? startOfMonth(p) : startOfMonth(new Date()));
      setManualText(value || '');
    }
  };

  const year = displayMonth.getFullYear();
  const monthIdx = displayMonth.getMonth();

  const shiftMonth = (delta) => setDisplayMonth(startOfMonth(new Date(year, monthIdx + delta, 1)));
  const shiftYear = (delta) => setDisplayMonth(startOfMonth(new Date(year + delta, monthIdx, 1)));
  const goToday = () => { setDisplayMonth(startOfMonth(new Date())); setView('days'); };

  const navBtn = 'inline-flex items-center justify-center h-7 w-7 rounded-md bg-transparent border border-white/[0.08] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors';

  return (
    <Popover open={open} onOpenChange={openPopover}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal bg-background border-border h-10 hover:bg-white/[0.06]',
            className
          )}
        >
          <CalendarIcon className="w-4 h-4 text-primary/80 mr-2 flex-shrink-0" />
          {parsed ? (
            <span className="text-sm text-foreground tabular-nums">{format(parsed, 'dd MMM yyyy')}</span>
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 bg-card/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl" align="start">
        {view === 'days' ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)} className={navBtn}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('months')}
                className="text-sm font-semibold px-2 py-1 rounded-md hover:bg-white/[0.06] text-foreground transition-colors"
                title="Click to pick month & year"
              >
                {format(displayMonth, 'MMMM yyyy')}
              </button>
              <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} className={navBtn}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Calendar
              mode="single"
              month={displayMonth}
              onMonthChange={setDisplayMonth}
              selected={parsed || undefined}
              onSelect={handleSelect}
              classNames={{ caption: 'hidden', nav: 'hidden' }}
              className="rounded-lg"
            />
            <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
              <Input
                type="text"
                inputMode="numeric"
                value={manualText}
                onChange={(e) => handleManual(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitManual(); } }}
                placeholder="Type DD/MM/YYYY"
                className="h-8 text-sm tabular-nums"
              />
              <Button type="button" size="sm" onClick={commitManual} className="h-8 px-3">Go</Button>
              <Button type="button" size="sm" variant="ghost" onClick={goToday} className="h-8 px-3 text-xs">Today</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 w-[17rem]">
            <div className="flex items-center justify-between px-1">
              <button type="button" aria-label="Previous year" onClick={() => shiftYear(-1)} className={navBtn}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('days')}
                className="text-sm font-semibold px-2 py-1 rounded-md hover:bg-white/[0.06] text-foreground transition-colors"
                title="Back to days"
              >
                {year}
              </button>
              <button type="button" aria-label="Next year" onClick={() => shiftYear(1)} className={navBtn}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {MONTHS_FULL.map((m, i) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setDisplayMonth(startOfMonth(new Date(year, i, 1))); setView('days'); }}
                  className={cn(
                    'px-1 py-2 rounded-md text-xs font-medium transition-colors border',
                    isSameMonth(displayMonth, new Date(year, i, 1))
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground border-transparent hover:bg-white/[0.06] hover:text-foreground'
                  )}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={goToday} className="h-8 text-xs">Today</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}