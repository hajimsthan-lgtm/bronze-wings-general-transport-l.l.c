import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Clock } from 'lucide-react';
import { format, parse } from 'date-fns';

const DATE_FMT = 'yyyy-MM-dd';
const TIME_FMT = 'HH:mm';

// value is a "YYYY-MM-DDTHH:mm" string (same format as datetime-local)
function toDateTime(value) {
  if (!value) return null;
  try { return parse(value, `yyyy-MM-dd'T'HH:mm`, new Date()); } catch { return null; }
}

function toValue(date, time) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return `${format(d, DATE_FMT)}T${time || '00:00'}`;
}

export default function DateTimePicker({ value, onChange, placeholder = 'Pick date & time', disabled }) {
  const [open, setOpen] = useState(false);
  const date = toDateTime(value);
  const timeStr = value ? value.split('T')[1] || '00:00' : '00:00';

  const handleDaySelect = (day) => {
    if (!day) return;
    onChange(toValue(day, timeStr));
  };

  const handleTime = (t) => {
    const base = date || new Date();
    onChange(toValue(base, t));
  };

  const setNow = () => {
    const now = new Date();
    onChange(toValue(now, format(now, TIME_FMT)));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-start text-left font-normal bg-background/50 border-border backdrop-blur-sm h-10 hover:bg-white/[0.06]"
        >
          <CalendarIcon className="w-4 h-4 text-primary/80 mr-2 flex-shrink-0" />
          {date ? (
            <span className="text-sm text-foreground tabular-nums">
              {format(date, 'dd MMM yyyy')}
              <span className="text-muted-foreground mx-1.5">·</span>
              <Clock className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
              {timeStr}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 bg-card/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl" align="start">
        <div className="flex justify-end mb-2">
          <Button type="button" variant="ghost" size="sm" onClick={setNow} className="h-7 text-[11px] text-primary">
            Now
          </Button>
        </div>
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={handleDaySelect}
          autoFocus
          className="rounded-lg"
        />
        <div className="mt-2 flex items-center gap-2 px-1">
          <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            type="time"
            value={timeStr}
            onChange={e => handleTime(e.target.value)}
            className="bg-background/50 border-border h-9 text-sm tabular-nums"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}