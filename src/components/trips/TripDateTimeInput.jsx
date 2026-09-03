import { useState, useEffect, useRef } from 'react';
import { Calendar, Sun, Moon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Two-column datetime input for trip forms.
 *  Left  → Date (DD-MM-YYYY) with one-click calendar picker
 *  Right → Time (HH:MM) with AM/PM toggle
 * Internal value remains "YYYY-MM-DDTHH:mm" (24h, same as DateTimePicker).
 */

// internal "YYYY-MM-DDTHH:mm" → { date: "DD-MM-YYYY", time12: "hh", minute: "mm", ampm: "AM"|"PM" }
function parseInternal(v) {
  if (!v) return { date: '', time12: '', minute: '', ampm: 'AM' };
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return { date: '', time12: '', minute: '', ampm: 'AM' };
  const [, yy, mm, dd, hh, mi] = m;
  let h24 = parseInt(hh, 10);
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return {
    date: `${dd}-${mm}-${yy}`,
    time12: String(h12).padStart(2, '0'),
    minute: mi,
    ampm,
  };
}

// { date, time12, minute, ampm } → internal "YYYY-MM-DDTHH:mm"
function toInternal({ date, time12, minute, ampm }) {
  const dm = date.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!dm) return '';
  const [, dd, mm, yy] = dm;
  if (!time12 || !minute) return '';
  let h = parseInt(time12, 10);
  if (isNaN(h)) return '';
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${yy}-${mm}-${dd}T${String(h).padStart(2, '0')}:${minute}`;
}

// Auto-format raw digits into DD-MM-YYYY
function autoFormatDate(raw) {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 8);
  let out = '';
  if (digits.length > 0) out += digits.slice(0, 2);
  if (digits.length > 2) out += '-' + digits.slice(2, 4);
  if (digits.length > 4) out += '-' + digits.slice(4, 8);
  return out;
}

// Auto-format raw digits into HH:MM (12h)
function autoFormatTime(raw) {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 4);
  let out = '';
  if (digits.length > 0) out += digits.slice(0, 2);
  if (digits.length > 2) out += ':' + digits.slice(2, 4);
  return out;
}

export default function TripDateTimeInput({ value, onChange, placeholder, className, disabled }) {
  const parsed = parseInternal(value);
  const [dateStr, setDateStr] = useState(parsed.date);
  const [timeStr, setTimeStr] = useState(parsed.time12 && parsed.minute ? `${parsed.time12}:${parsed.minute}` : '');
  const [ampm, setAmpm] = useState(parsed.ampm);
  const [editing, setEditing] = useState(false);
  const dateInputRef = useRef(null);
  const nativeDateRef = useRef(null);

  // Sync from external value when not actively editing
  useEffect(() => {
    if (editing) return;
    const p = parseInternal(value);
    setDateStr(p.date);
    setTimeStr(p.time12 && p.minute ? `${p.time12}:${p.minute}` : '');
    setAmpm(p.ampm);
  }, [value, editing]);

  // Emit internal value whenever any part changes
  const emit = (newDate, newTime, newAmpm) => {
    const tm = newTime.match(/^(\d{2}):(\d{2})$/);
    const time12 = tm ? tm[1] : '';
    const minute = tm ? tm[2] : '';
    const internal = toInternal({ date: newDate, time12, minute, ampm: newAmpm });
    if (internal) onChange(internal);
    else if (!newDate && !newTime) onChange('');
  };

  const handleDateChange = (e) => {
    const raw = e.target.value;
    if (raw === '') { setDateStr(''); emit('', timeStr, ampm); return; }
    const formatted = autoFormatDate(raw);
    setDateStr(formatted);
    emit(formatted, timeStr, ampm);
  };

  const handleTimeChange = (e) => {
    const raw = e.target.value;
    if (raw === '') { setTimeStr(''); emit(dateStr, '', ampm); return; }
    const formatted = autoFormatTime(raw);
    setTimeStr(formatted);
    emit(dateStr, formatted, ampm);
  };

  // Calendar picker — native date input converts to DD-MM-YYYY
  const handleNativeDate = (e) => {
    const v = e.target.value; // "YYYY-MM-DD"
    if (!v) return;
    const [, yy, mm, dd] = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const formatted = `${dd}-${mm}-${yy}`;
    setDateStr(formatted);
    emit(formatted, timeStr, ampm);
  };

  const toggleAmpm = () => {
    const next = ampm === 'AM' ? 'PM' : 'AM';
    setAmpm(next);
    emit(dateStr, timeStr, next);
  };

  return (
    <div className="flex gap-2 w-full">
      {/* Date column — DD-MM-YYYY + calendar picker */}
      <div className="relative flex-1 min-w-0">
        <Input
          ref={dateInputRef}
          type="text"
          value={dateStr}
          onChange={handleDateChange}
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
          placeholder="DD-MM-YYYY"
          disabled={disabled}
          className={cn('font-mono text-sm tabular-nums pr-9', className)}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => !disabled && nativeDateRef.current?.showPicker?.()}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          title="Pick date"
        >
          <Calendar className="w-4 h-4" />
        </button>
        <input
          ref={nativeDateRef}
          type="date"
          value={dateStr ? (() => { const m = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/); return m ? `${m[3]}-${m[2]}-${m[1]}` : ''; })() : ''}
          onChange={handleNativeDate}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {/* Time column — HH:MM + AM/PM toggle */}
      <div className="flex gap-1.5 items-center flex-shrink-0">
        <Input
          type="text"
          value={timeStr}
          onChange={handleTimeChange}
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
          placeholder="HH:MM"
          disabled={disabled}
          className={cn('font-mono text-sm tabular-nums w-20 text-center', className)}
        />
        <button
          type="button"
          onClick={toggleAmpm}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1 h-9 px-2.5 rounded-lg border text-xs font-bold transition-all flex-shrink-0',
            ampm === 'AM'
              ? 'border-amber-500/40 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
              : 'border-indigo-500/40 bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25'
          )}
          title="Toggle AM / PM"
        >
          {ampm === 'AM' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          {ampm}
        </button>
      </div>
    </div>
  );
}