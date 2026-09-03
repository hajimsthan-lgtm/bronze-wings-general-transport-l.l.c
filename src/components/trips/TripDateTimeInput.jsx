import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Two-column datetime input for trip forms.
 *  Left  → Date (DD-MM-YYYY) with one-click calendar picker
 *  Right → Time (HH:MM) with iPhone-style AM/PM segmented toggle
 * Internal value remains "YYYY-MM-DDTHH:mm" (24h).
 * When date is fully written (10 chars), focus auto-jumps to the time column.
 * When time is fully written (5 chars), focus auto-jumps to the AM/PM toggle.
 */

// internal "YYYY-MM-DDTHH:mm" → { date: "DD-MM-YYYY", time12: "hh", minute: "mm", ampm }
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

// Validate a DD-MM-YYYY date string (real calendar check)
function isValidDate(str) {
  const m = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!m) return false;
  const [, dd, mm, yy] = m;
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yy, 10);
  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > 2100) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;
  return true;
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

// Auto-format raw digits into HH:MM
function autoFormatTime(raw) {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 4);
  let out = '';
  if (digits.length > 0) out += digits.slice(0, 2);
  if (digits.length > 2) out += ':' + digits.slice(2, 4);
  return out;
}

// Convert DD-MM-YYYY → YYYY-MM-DD (for native date input value)
function toISODate(ddmmyyyy) {
  const m = ddmmyyyy.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

export default function TripDateTimeInput({ value, onChange, placeholder, className, disabled }) {
  const parsed = parseInternal(value);
  const [dateStr, setDateStr] = useState(parsed.date);
  const [timeStr, setTimeStr] = useState(parsed.time12 && parsed.minute ? `${parsed.time12}:${parsed.minute}` : '');
  const [ampm, setAmpm] = useState(parsed.ampm);
  const [editing, setEditing] = useState(false);

  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);
  const ampmRef = useRef(null);
  const nativeDateRef = useRef(null);
  const blurTimerRef = useRef(null);

  // Sync from external value when not actively editing
  useEffect(() => {
    if (editing) return;
    const p = parseInternal(value);
    setDateStr(p.date);
    setTimeStr(p.time12 && p.minute ? `${p.time12}:${p.minute}` : '');
    setAmpm(p.ampm);
  }, [value, editing]);

  // Clear any pending blur timer on unmount
  useEffect(() => () => clearTimeout(blurTimerRef.current), []);

  // Auto-jump: when date is fully written (10 chars), focus the time input
  const jumpToTime = () => {
    setTimeout(() => {
      timeInputRef.current?.focus();
      timeInputRef.current?.select();
    }, 0);
  };

  // Auto-jump: when time is fully written (5 chars), focus the AM/PM toggle
  const jumpToAmpm = () => {
    setTimeout(() => ampmRef.current?.focus(), 0);
  };

  // Emit internal value whenever any part changes
  const emit = useCallback((newDate, newTime, newAmpm) => {
    const tm = newTime.match(/^(\d{2}):(\d{2})$/);
    const time12 = tm ? tm[1] : '';
    const minute = tm ? tm[2] : '';
    const internal = toInternal({ date: newDate, time12, minute, ampm: newAmpm });
    if (internal) onChange(internal);
    else if (!newDate && !newTime) onChange('');
  }, [onChange]);

  // Shared blur handler — only clears editing if focus didn't move to another element in this component
  const handleBlur = () => {
    clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => {
      if (document.activeElement === timeInputRef.current ||
          document.activeElement === dateInputRef.current ||
          document.activeElement === ampmRef.current ||
          document.activeElement === nativeDateRef.current) return;
      setEditing(false);
    }, 150);
  };

  // Date change — auto-format + cursor preservation + validation on jump
  const handleDateChange = (e) => {
    const input = e.target;
    const raw = input.value;
    const cursorPos = input.selectionStart || 0;
    const digitsBefore = (raw.slice(0, cursorPos).match(/\d/g) || []).length;

    if (raw === '') { setDateStr(''); emit('', timeStr, ampm); return; }
    const formatted = autoFormatDate(raw);

    // When date is fully written (10 chars), validate before jumping
    if (formatted.length === 10) {
      if (!isValidDate(formatted)) {
        // Invalid date — clear it and stay on the date field
        setDateStr('');
        emit('', timeStr, ampm);
        return;
      }
      // Valid date — keep it and jump to time
      setDateStr(formatted);
      emit(formatted, timeStr, ampm);
      jumpToTime();
      return;
    }

    setDateStr(formatted);
    emit(formatted, timeStr, ampm);

    // Restore cursor position based on digit count
    requestAnimationFrame(() => {
      if (!dateInputRef.current) return;
      let newCursor = 0;
      let counted = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          counted++;
          if (counted === digitsBefore) { newCursor = i + 1; break; }
        }
      }
      if (counted < digitsBefore) newCursor = formatted.length;
      dateInputRef.current.setSelectionRange(newCursor, newCursor);
    });
  };

  // Time change — auto-format + cursor preservation + jump to AM/PM when complete
  const handleTimeChange = (e) => {
    const input = e.target;
    const raw = input.value;
    const cursorPos = input.selectionStart || 0;
    const digitsBefore = (raw.slice(0, cursorPos).match(/\d/g) || []).length;

    if (raw === '') { setTimeStr(''); emit(dateStr, '', ampm); return; }
    const formatted = autoFormatTime(raw);
    setTimeStr(formatted);
    emit(dateStr, formatted, ampm);

    // Jump to AM/PM when time is fully written (5 chars)
    if (formatted.length === 5) { jumpToAmpm(); return; }

    requestAnimationFrame(() => {
      if (!timeInputRef.current) return;
      let newCursor = 0;
      let counted = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          counted++;
          if (counted === digitsBefore) { newCursor = i + 1; break; }
        }
      }
      if (counted < digitsBefore) newCursor = formatted.length;
      timeInputRef.current.setSelectionRange(newCursor, newCursor);
    });
  };

  // Calendar picker — native date input (overlay, opacity-0 so showPicker works)
  const handleNativeDate = (e) => {
    const v = e.target.value; // "YYYY-MM-DD"
    if (!v) return;
    const [, yy, mm, dd] = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const formatted = `${dd}-${mm}-${yy}`;
    setDateStr(formatted);
    emit(formatted, timeStr, ampm);
    // After picking a date, jump to time
    setTimeout(() => timeInputRef.current?.focus(), 50);
  };

  const openCalendar = () => {
    if (disabled) return;
    if (nativeDateRef.current && typeof nativeDateRef.current.showPicker === 'function') {
      try { nativeDateRef.current.showPicker(); return; } catch (e) {}
    }
    nativeDateRef.current?.focus();
    nativeDateRef.current?.click();
  };

  const setAm = () => { if (ampm !== 'AM') { setAmpm('AM'); emit(dateStr, timeStr, 'AM'); } };
  const setPm = () => { if (ampm !== 'PM') { setAmpm('PM'); emit(dateStr, timeStr, 'PM'); } };

  return (
    <div className="flex gap-1.5 w-full min-w-0">
      {/* Date column — DD-MM-YYYY + calendar picker */}
      <div className="relative flex-1 min-w-0">
        <Input
          ref={dateInputRef}
          type="text"
          value={dateStr}
          onChange={handleDateChange}
          onFocus={() => { setEditing(true); clearTimeout(blurTimerRef.current); }}
          onBlur={handleBlur}
          placeholder="DD-MM-YYYY"
          disabled={disabled}
          maxLength={10}
          className={cn('font-mono text-xs tabular-nums pl-3 pr-7 min-w-0', className)}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={openCalendar}
          disabled={disabled}
          className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors z-10"
          title="Pick date"
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>
        {/* Native date input — opacity-0 overlay so showPicker() works */}
        <input
          ref={nativeDateRef}
          type="date"
          value={toISODate(dateStr)}
          onChange={handleNativeDate}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        />
      </div>

      {/* Time column — HH:MM */}
      <Input
        ref={timeInputRef}
        type="text"
        value={timeStr}
        onChange={handleTimeChange}
        onFocus={() => { setEditing(true); clearTimeout(blurTimerRef.current); }}
        onBlur={handleBlur}
        placeholder="HH:MM"
        disabled={disabled}
        maxLength={5}
        className={cn('font-mono text-xs tabular-nums w-[56px] text-center px-1.5 flex-shrink-0', className)}
      />

      {/* iPhone-style AM/PM segmented toggle — AM green, PM blue */}
      <div
        className="flex items-center bg-muted/60 rounded-full p-[3px] h-9 flex-shrink-0 border border-border/50"
        role="group"
        aria-label="AM / PM"
      >
        <button
          ref={ampmRef}
          type="button"
          onClick={setAm}
          disabled={disabled}
          onFocus={() => { setEditing(true); clearTimeout(blurTimerRef.current); }}
          onBlur={handleBlur}
          className={cn(
            'flex items-center justify-center h-[30px] w-[34px] rounded-full text-[11px] font-bold transition-all duration-300',
            ampm === 'AM'
              ? 'bg-green-500 text-white shadow-md shadow-green-500/40 scale-105'
              : 'text-muted-foreground hover:text-foreground/80'
          )}
          title="AM"
        >
          AM
        </button>
        <button
          type="button"
          onClick={setPm}
          disabled={disabled}
          onFocus={() => { setEditing(true); clearTimeout(blurTimerRef.current); }}
          onBlur={handleBlur}
          className={cn(
            'flex items-center justify-center h-[30px] w-[34px] rounded-full text-[11px] font-bold transition-all duration-300',
            ampm === 'PM'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/40 scale-105'
              : 'text-muted-foreground hover:text-foreground/80'
          )}
          title="PM"
        >
          PM
        </button>
      </div>
    </div>
  );
}