import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Clock, ChevronLeft, Check, X } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import TimeWheelPicker from './TimeWheelPicker';
import AnalogClockPicker from './AnalogClockPicker';
import { usePickerStyle } from '@/lib/dateTimePickerStyle';

const DATE_FMT = 'yyyy-MM-dd';
const TIME_FMT = 'HH:mm';

// value is a "YYYY-MM-DDTHH:mm" string (same format as datetime-local),
// but trips may store full ISO strings with seconds/timezone — handle both.
function toDateTime(value) {
  if (!value) return null;
  try {
    const d = parse(value, `yyyy-MM-dd'T'HH:mm`, new Date());
    if (isValid(d)) return d;
    const native = new Date(value);
    return isValid(native) ? native : null;
  } catch { return null; }
}

function toValue(date, time) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return `${format(d, DATE_FMT)}T${time || '00:00'}`;
}

// Convert internal value → display string "DD-MM-YYYY HH:MM AM/PM"
function toDisplay(value) {
  const d = toDateTime(value);
  if (!d) return '';
  return format(d, 'dd-MM-yyyy hh:mm a');
}

// Parse a display string "DD-MM-YYYY HH:MM AM/PM" → internal value
function parseDisplay(str) {
  if (!str || !str.trim()) return '';
  // Try strict parse first
  const d = parse(str.trim(), 'dd-MM-yyyy hh:mm a', new Date());
  if (isValid(d)) return toValue(d, format(d, TIME_FMT));
  // Fallback: try other common formats
  const d2 = parse(str.trim(), 'dd-MM-yyyy HH:mm', new Date());
  if (isValid(d2)) return toValue(d2, format(d2, TIME_FMT));
  const d3 = parse(str.trim(), 'dd/MM/yyyy hh:mm a', new Date());
  if (isValid(d3)) return toValue(d3, format(d3, TIME_FMT));
  return null; // invalid
}

// Auto-format as user types: inserts dashes, colon, space, AM/PM
function autoFormat(raw) {
  // Strip everything except digits and letters A/P/M
  let digits = raw.replace(/[^0-9apmAPM]/g, '');
  // We'll rebuild with separators: DD-MM-YYYY HH:MM AM
  let out = '';
  let di = 0;
  const template = ['D', 'D', '-', 'M', 'M', '-', 'Y', 'Y', 'Y', 'Y', ' ', 'H', 'H', ':', 'M', 'M', ' ', 'A'];
  for (let i = 0; i < template.length && di < digits.length; i++) {
    const t = template[i];
    if (t === '-' || t === ' ' || t === ':') {
      out += t;
    } else if (t === 'A') {
      // AM/PM portion — grab trailing letters
      const letters = digits.slice(di).match(/^[aApPmM]+/);
      if (letters) {
        out += letters[0].toUpperCase();
        di += letters[0].length;
      }
      break;
    } else {
      // digit slot
      if (/\d/.test(digits[di])) {
        out += digits[di];
        di++;
      } else {
        break;
      }
    }
  }
  return out;
}

export default function DateTimePicker({ value, onChange, placeholder = 'Pick date & time', disabled }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('date');
  const [manualText, setManualText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const pickerStyle = usePickerStyle();
  const date = toDateTime(value);
  const timeStr = value ? (value.split('T')[1] || '00:00').slice(0, 5) || '00:00' : '00:00';

  // Sync manual text when not editing
  useEffect(() => {
    if (!isEditing) {
      setManualText(toDisplay(value));
    }
  }, [value, isEditing]);

  const handleDaySelect = (day) => {
    if (!day) return;
    onChange(toValue(day, timeStr));
    setStep('time');
  };

  const handleTime = (t) => {
    const base = date || new Date();
    onChange(toValue(base, t));
  };

  const handleTimeDone = () => {
    setOpen(false);
    setStep('date');
  };

  const handleOpenChange = (o) => {
    setOpen(o);
    if (!o) setStep('date');
  };

  const setNow = () => {
    const now = new Date();
    onChange(toValue(now, format(now, TIME_FMT)));
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setOpen(false);
    setStep('date');
    setManualText('');
  };

  // Manual input handlers
  const handleManualChange = (e) => {
    const raw = e.target.value;
    setIsEditing(true);
    const formatted = autoFormat(raw);
    // Ensure placeholder vanishes as soon as the user types anything
    setManualText(formatted === '' && raw !== '' ? raw : formatted);
  };

  const handleManualBlur = () => {
    setIsEditing(false);
    if (!manualText.trim()) {
      onChange('');
      return;
    }
    const parsed = parseDisplay(manualText);
    if (parsed !== null) {
      onChange(parsed);
    } else {
      // Invalid — revert to current value's display
      setManualText(toDisplay(value));
    }
  };

  const handleManualKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex items-stretch gap-1.5">
        {/* Manual text input with auto-format */}
        <input
          type="text"
          value={manualText}
          onChange={handleManualChange}
          onBlur={handleManualBlur}
          onKeyDown={handleManualKeyDown}
          disabled={disabled}
          placeholder="DD-MM-YYYY HH:MM AM"
          className="flex-1 h-10 rounded-xl border border-input bg-input px-3 py-1 text-sm text-foreground shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)] transition-all duration-300 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/40 focus-visible:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03),0_0_0_3px_rgba(var(--panel-accent-rgb),0.15)] disabled:cursor-not-allowed disabled:opacity-50 font-mono tabular-nums"
        />
        {/* Calendar picker button */}
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="h-10 w-10 p-0 flex-shrink-0 justify-center bg-background/50 border-border backdrop-blur-sm hover:bg-white/[0.06]"
            >
              <CalendarIcon className="w-4 h-4 text-primary/80" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3 bg-card/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl" align="end">
            {step === 'date' ? (
              <>
                <div className="flex justify-between mb-2">
                  <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="h-7 text-[11px] text-muted-foreground hover:text-red-500 gap-1">
                    <X className="w-3 h-3" /> Clear
                  </Button>
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
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2 px-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setStep('date')} className="h-7 text-[11px] text-muted-foreground hover:text-foreground gap-1">
                    <ChevronLeft className="w-3.5 h-3.5" /> Date
                  </Button>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/80 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pick Time
                  </span>
                  <Button type="button" variant="ghost" size="sm" onClick={handleTimeDone} className="h-7 text-[11px] text-primary gap-1">
                    <Check className="w-3.5 h-3.5" /> Done
                  </Button>
                </div>
                {pickerStyle === 'analog_custom' ? (
                  <AnalogClockPicker value={timeStr} onChange={handleTime} onDone={handleTimeDone} variant="custom" />
                ) : pickerStyle === 'analog_library' ? (
                  <AnalogClockPicker value={timeStr} onChange={handleTime} onDone={handleTimeDone} variant="library" />
                ) : (
                  <TimeWheelPicker value={timeStr} onChange={handleTime} onDone={handleTimeDone} />
                )}
              </>
            )}
          </PopoverContent>
        </Popover>
      </div>
      {date && !isEditing && (
        <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {format(date, 'dd MMM yyyy')} · {timeStr}
        </p>
      )}
    </div>
  );
}