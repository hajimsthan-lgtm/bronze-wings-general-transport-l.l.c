import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * DateTimePicker — DD/MM/YYYY text input + calendar picker.
 *
 * Uses a text input with DD/MM/YYYY auto-format (not native date input,
 * which displays in browser locale). A hidden native <input type="date">
 * powers the calendar picker via showPicker().
 *
 * External API preserved:
 *   • datetime mode → value is "YYYY-MM-DDTHH:mm" (24h)
 *   • date mode     → value is "YYYY-MM-DDTHH:mm" (DatePicker strips T)
 */

// ── helpers ──

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
    date: `${dd}/${mm}/${yy}`,
    time12: String(h12).padStart(2, '0'),
    minute: mi,
    ampm,
  };
}

function toInternal({ date, time12, minute, ampm }) {
  const dm = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!dm) return '';
  const [, dd, mm, yy] = dm;
  if (!time12 || !minute) return '';
  let h = parseInt(time12, 10);
  if (isNaN(h)) return '';
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${yy}-${mm}-${dd}T${String(h).padStart(2, '0')}:${minute}`;
}

function isValidDate(str) {
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
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

function autoFormatDate(raw) {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 8);
  let out = '';
  if (digits.length > 0) out += digits.slice(0, 2);
  if (digits.length > 2) out += '/' + digits.slice(2, 4);
  if (digits.length > 4) out += '/' + digits.slice(4, 8);
  return out;
}

function autoFormatTime(raw) {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 4);
  let out = '';
  if (digits.length > 0) out += digits.slice(0, 2);
  if (digits.length > 2) out += ':' + digits.slice(2, 4);
  return out;
}

function toISODate(ddmmyyyy) {
  const m = ddmmyyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
}

// ── component ──

export default function DateTimePicker({
  value, onChange, mode = 'datetime', disabled, className,
  placeholder: _placeholder, required, id, name,
}) {
  const parsed = parseInternal(value);
  const isDateOnly = mode === 'date';
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

  useEffect(() => () => clearTimeout(blurTimerRef.current), []);

  const emit = useCallback((newDate, newTime, newAmpm) => {
    const tm = newTime.match(/^(\d{2}):(\d{2})$/);
    const time12 = tm ? tm[1] : '';
    const minute = tm ? tm[2] : '';
    const internal = toInternal({ date: newDate, time12, minute, ampm: newAmpm });
    if (internal) onChange(internal);
    else if (!newDate && !newTime) onChange('');
  }, [onChange, onChange]);

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

  const jumpToTime = () => {
    if (isDateOnly) return;
    setTimeout(() => {
      timeInputRef.current?.focus();
      timeInputRef.current?.select();
    }, 0);
  };

  const handleDateChange = (e) => {
    const input = e.target;
    const raw = input.value;
    const cursorPos = input.selectionStart || 0;
    const digitsBefore = (raw.slice(0, cursorPos).match(/\d/g) || []).length;

    if (raw === '') { setDateStr(''); emit('', timeStr, ampm); return; }
    const formatted = autoFormatDate(raw);

    if (formatted.length === 10) {
      if (!isValidDate(formatted)) {
        setDateStr('');
        emit('', timeStr, ampm);
        return;
      }
      setDateStr(formatted);
      emit(formatted, timeStr, ampm);
      jumpToTime();
      return;
    }

    setDateStr(formatted);
    emit(formatted, timeStr, ampm);

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

  const handleTimeChange = (e) => {
    const input = e.target;
    const raw = input.value;
    const cursorPos = input.selectionStart || 0;
    const digitsBefore = (raw.slice(0, cursorPos).match(/\d/g) || []).length;

    if (raw === '') { setTimeStr(''); emit(dateStr, '', ampm); return; }
    const formatted = autoFormatTime(raw);
    setTimeStr(formatted);
    emit(dateStr, formatted, ampm);

    if (formatted.length === 5) {
      setTimeout(() => ampmRef.current?.focus(), 0);
      return;
    }

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

  const handleNativeDate = (e) => {
    const v = e.target.value;
    if (!v) return;
    const [, yy, mm, dd] = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const formatted = `${dd}/${mm}/${yy}`;
    setDateStr(formatted);
    emit(formatted, timeStr, ampm);
    if (!isDateOnly) setTimeout(() => timeInputRef.current?.focus(), 50);
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

  if (isDateOnly) {
    return (
      <div className="relative w-full">
        <input type="hidden" id={id} name={name} value={toISODate(dateStr) || ''} disabled={disabled} required={required} />
        <div className="relative">
          <Input
            ref={dateInputRef}
            type="text"
            value={dateStr}
            onChange={handleDateChange}
            onFocus={() => { setEditing(true); clearTimeout(blurTimerRef.current); }}
            onBlur={handleBlur}
            placeholder="DD/MM/YYYY"
            disabled={disabled}
            maxLength={10}
            className={cn('font-mono text-sm tabular-nums pl-3 pr-7', className)}
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
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 w-full min-w-0">
      <input type="hidden" id={id} name={name} value={toInternal({ date: dateStr, time12: timeStr.split(':')[0], minute: timeStr.split(':')[1], ampm }) || ''} disabled={disabled} required={required} />
      {/* Date column — DD/MM/YYYY + calendar picker */}
      <div className="relative flex-1 min-w-0">
        <Input
          ref={dateInputRef}
          type="text"
          value={dateStr}
          onChange={handleDateChange}
          onFocus={() => { setEditing(true); clearTimeout(blurTimerRef.current); }}
          onBlur={handleBlur}
          placeholder="DD/MM/YYYY"
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

      {/* AM/PM segmented toggle */}
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