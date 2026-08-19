import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';

const DATE_FMT = 'yyyy-MM-dd';

// Accepts value as "YYYY-MM-DD" string (same as native <input type="date">)
export default function DatePicker({ value, onChange, placeholder = 'Pick a date', disabled, className }) {
  const [open, setOpen] = useState(false);

  const parsed = (() => {
    if (!value) return null;
    const d = typeof value === 'string' ? parse(value, DATE_FMT, new Date()) : new Date(value);
    return isValid(d) ? d : null;
  })();

  const handleSelect = (day) => {
    if (!day) return;
    onChange(format(day, DATE_FMT));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
        <Calendar
          mode="single"
          selected={parsed || undefined}
          onSelect={handleSelect}
          autoFocus
          className="rounded-lg"
        />
      </PopoverContent>
    </Popover>
  );
}