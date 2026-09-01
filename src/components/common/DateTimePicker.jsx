import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarIcon, Clock, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { format, parse, isValid, startOfMonth, isSameMonth, setYear as dfSetYear, setMonth as dfSetMonth } from 'date-fns';
import TimeWheelPicker from './TimeWheelPicker';
import AnalogClockPicker from './AnalogClockPicker';
import { usePickerStyle } from '@/lib/dateTimePickerStyle';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────
   Canonical internal value:
     • datetime mode → "YYYY-MM-DDTHH:mm"  (24h)
     • date mode     → "YYYY-MM-DD"
   The masked input displays "DD-MM-YYYY HH:MM AM" (datetime) or
   "DD-MM-YYYY" (date). Typed chars replace placeholder letters
   in place, live, per keystroke — never reverting.
   ───────────────────────────────────────────────────────────── */

const MODE_CFG = {
  datetime: {
    segs: [
      { key: 'day', len: 2, ph: 'D', kind: 'num', label: 'Day' },
      { key: 'month', len: 2, ph: 'M', kind: 'num', label: 'Month' },
      { key: 'year', len: 4, ph: 'Y', kind: 'num', label: 'Year' },
      { key: 'hour', len: 2, ph: 'H', kind: 'hour', label: 'Hour' },
      { key: 'minute', len: 2, ph: 'M', kind: 'num', label: 'Minute' },
      { key: 'meridiem', len: 2, ph: ['A', 'M'], kind: 'ampm', label: 'AM/PM' },
    ],
    seps: ['-', '-', ' ', ':', ' '],
  },
  date: {
    segs: [
      { key: 'day', len: 2, ph: 'D', kind: 'num', label: 'Day' },
      { key: 'month', len: 2, ph: 'M', kind: 'num', label: 'Month' },
      { key: 'year', len: 4, ph: 'Y', kind: 'num', label: 'Year' },
    ],
    seps: ['-', '-'],
  },
};

const pad2 = (n) => String(n).padStart(2, '0');

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isValid(d) ? d : null;
}

function toCanonical(d, mode) {
  if (!d || !isValid(d)) return '';
  const datePart = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  return mode === 'date' ? datePart : `${datePart}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function fromCanonical(value, mode) {
  const d = toDate(value);
  if (!d) return {};
  const raw = {
    day: pad2(d.getDate()),
    month: pad2(d.getMonth() + 1),
    year: String(d.getFullYear()),
  };
  if (mode === 'datetime') {
    const h24 = d.getHours();
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    raw.hour = pad2(h12);
    raw.minute = pad2(d.getMinutes());
    raw.meridiem = h24 >= 12 ? 'PM' : 'AM';
  }
  return raw;
}

// Build per-char display array: { ch, typed } — typed=true → foreground, false → muted placeholder, null → separator
function buildChars(raw, mode) {
  const { segs, seps } = MODE_CFG[mode];
  const chars = [];
  segs.forEach((seg, i) => {
    const val = raw[seg.key] || '';
    for (let s = 0; s < seg.len; s++) {
      if (s < val.length) {
        chars.push({ ch: val[s], typed: true });
      } else if (Array.isArray(seg.ph)) {
        chars.push({ ch: seg.ph[s], typed: false });
      } else {
        chars.push({ ch: seg.ph, typed: false });
      }
    }
    if (i < segs.length - 1) chars.push({ ch: seps[i], typed: null });
  });
  return chars;
}

// Sentinel string for the transparent input: typed chars stay, unfilled slots become spaces, separators literal.
function buildSentinel(raw, mode) {
  return buildChars(raw, mode).map((c) => (c.typed === null ? c.ch : c.typed ? c.ch : ' ')).join('');
}

// Validate a single segment's filled value.
function segValid(seg, val) {
  if (!val || val.length < seg.len) return false;
  if (seg.kind === 'ampm') return val === 'AM' || val === 'PM';
  const n = parseInt(val, 10);
  if (seg.key === 'day') return n >= 1 && n <= 31;
  if (seg.key === 'month') return n >= 1 && n <= 12;
  if (seg.key === 'hour') return n >= 1 && n <= 12;
  if (seg.key === 'minute') return n >= 0 && n <= 59;
  if (seg.key === 'year') return val.length === 4 && n > 0;
  return true;
}

function isComplete(raw, mode) {
  return MODE_CFG[mode].segs.every((s) => (raw[s.key] || '').length >= s.len);
}

function rawToDate(raw, mode) {
  if (!isComplete(raw, mode)) return null;
  const day = parseInt(raw.day, 10);
  const month = parseInt(raw.month, 10);
  const year = parseInt(raw.year, 10);
  let h24 = 0, min = 0;
  if (mode === 'datetime') {
    const h12 = parseInt(raw.hour, 10);
    min = parseInt(raw.minute, 10);
    h24 = raw.meridiem === 'PM' ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
  }
  const d = new Date(year, month - 1, day, h24, min, 0, 0);
  // reject overflow (e.g. 31 Feb)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return isValid(d) ? d : null;
}

export default function DateTimePicker({
  value,
  onChange,
  mode = 'datetime',
  disabled,
  className,
  placeholder: _placeholder, // mask replaces placeholder
}) {
  const { dir } = useI18n();
  const cfg = MODE_CFG[mode];
  const [raw, setRaw] = useState(() => fromCanonical(value, mode));
  const [activeSeg, setActiveSeg] = useState(cfg.segs[0].key);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [calView, setCalView] = useState('days'); // days | months | years
  const [displayMonth, setDisplayMonth] = useState(() => startOfMonth(toDate(value) || new Date()));
  const [manualText, setManualText] = useState('');
  const [manualTime, setManualTime] = useState('');
  const [decade, setDecade] = useState(() => Math.floor((toDate(value) || new Date()).getFullYear() / 10) * 10);
  const inputRef = useRef(null);
  const dateInputRef = useRef(null);
  const timeInputRef = useRef(null);
  const editingRef = useRef(false);
  const rawRef = useRef(raw);
  rawRef.current = raw;
  const pickerStyle = usePickerStyle();

  // seg start positions in the mask
  const segStart = useMemo(() => {
    const map = {};
    let pos = 0;
    cfg.segs.forEach((s, i) => {
      map[s.key] = pos;
      pos += s.len + (i < cfg.segs.length - 1 ? 1 : 0); // +sep
    });
    return map;
  }, [cfg]);

  // Sync raw from external value when not editing.
  useEffect(() => {
    if (!editingRef.current) {
      setRaw(fromCanonical(value, mode));
      setError(false);
    }
  }, [value, mode]);

  const date = toDate(value);
  const timeStr = useMemo(() => {
    if (mode !== 'datetime' || !date) return '00:00';
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  }, [date, mode]);

  const caretPos = useMemo(() => {
    const seg = cfg.segs.find((s) => s.key === activeSeg) || cfg.segs[0];
    return segStart[seg.key] + Math.min((raw[seg.key] || '').length, seg.len);
  }, [activeSeg, raw, segStart, cfg]);

  // Position caret after each keystroke while editing.
  useEffect(() => {
    if (editing && inputRef.current) {
      const el = inputRef.current;
      requestAnimationFrame(() => {
        try { el.setSelectionRange(caretPos, caretPos); } catch {}
      });
    }
  }, [caretPos, editing, raw]);

  const commitIfReady = useCallback((nextRaw) => {
    if (isComplete(nextRaw, mode)) {
      const d = rawToDate(nextRaw, mode);
      if (d) {
        onChange(toCanonical(d, mode));
        setError(false);
        return true;
      }
      setError(true);
      return false;
    }
    return false;
  }, [mode, onChange]);

  const firstIncompleteSeg = useCallback((r) => {
    for (const s of cfg.segs) {
      if ((r[s.key] || '').length < s.len) return s.key;
    }
    return cfg.segs[cfg.segs.length - 1].key;
  }, [cfg]);

  const handleFocus = () => {
    editingRef.current = true;
    setEditing(true);
    setError(false);
    setActiveSeg(firstIncompleteSeg(raw));
  };

  const handleBlur = () => {
    editingRef.current = false;
    setEditing(false);
    // If something was typed but incomplete/invalid → error + revert to last committed value.
    const anyTyped = cfg.segs.some((s) => (raw[s.key] || '').length > 0);
    if (anyTyped && !isComplete(raw, mode)) {
      setError(true);
      setRaw(fromCanonical(value, mode));
    } else if (anyTyped && isComplete(raw, mode) && !rawToDate(raw, mode)) {
      setError(true);
      setRaw(fromCanonical(value, mode));
    }
  };

  const advanceToNext = useCallback((fromKey, r) => {
    const idx = cfg.segs.findIndex((s) => s.key === fromKey);
    for (let i = idx + 1; i < cfg.segs.length; i++) {
      if ((r[cfg.segs[i].key] || '').length < cfg.segs[i].len) return cfg.segs[i].key;
    }
    return fromKey;
  }, [cfg]);

  const handleKeyDown = (e) => {
    // Ignore modifier combos (Ctrl/Cmd/Meta/Alt) so copy/paste/DevTools still work.
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const key = e.key;

    if (key === 'ArrowLeft') {
      e.preventDefault();
      const idx = cfg.segs.findIndex((s) => s.key === activeSeg);
      if (idx > 0) setActiveSeg(cfg.segs[idx - 1].key);
      return;
    }
    if (key === 'ArrowRight' || key === 'Tab') {
      // Let Tab move to next field naturally unless we're mid-segment; only intercept ArrowRight.
      if (key === 'ArrowRight') {
        e.preventDefault();
        const idx = cfg.segs.findIndex((s) => s.key === activeSeg);
        if (idx < cfg.segs.length - 1) setActiveSeg(cfg.segs[idx + 1].key);
      }
      return;
    }
    if (key === 'Backspace') {
      e.preventDefault();
      setError(false);
      const r = rawRef.current;
      const cur = r[activeSeg] || '';
      if (cur.length > 0) {
        const next = { ...r, [activeSeg]: cur.slice(0, -1) };
        rawRef.current = next; setRaw(next);
      } else {
        const idx = cfg.segs.findIndex((s) => s.key === activeSeg);
        if (idx > 0) {
          const pk = cfg.segs[idx - 1].key;
          setActiveSeg(pk);
          const next = { ...r, [pk]: (r[pk] || '').slice(0, -1) };
          rawRef.current = next; setRaw(next);
        }
      }
      return;
    }
    if (key === 'Delete') {
      e.preventDefault();
      const next = { ...rawRef.current, [activeSeg]: '' };
      rawRef.current = next; setRaw(next);
      return;
    }
    if (key === 'Enter') {
      e.preventDefault();
      const d = rawToDate(rawRef.current, mode);
      if (d) { commitIfReady(rawRef.current); inputRef.current?.blur(); }
      else { setError(true); }
      return;
    }
    if (key === 'Escape') {
      e.preventDefault();
      const reverted = fromCanonical(value, mode);
      rawRef.current = reverted; setRaw(reverted);
      setError(false);
      inputRef.current?.blur();
      return;
    }

    // Character input
    if (key.length !== 1) return;
    e.preventDefault();
    const seg = cfg.segs.find((s) => s.key === activeSeg);
    if (!seg) return;

    const r0 = rawRef.current;
    const cur = r0[seg.key] || '';
    let nextVal = cur;
    let nextActive = activeSeg;
    let invalidFull = false;

    if (seg.kind === 'ampm') {
      if (cur.length >= seg.len) return; // segment full
      const up = key.toUpperCase();
      if (cur.length === 0) {
        if (up !== 'A' && up !== 'P') return;
        nextVal = up;
        nextActive = seg.key; // wait for 'M' to complete AM/PM
      } else {
        if (up !== 'M') return;
        nextVal = cur + up;
        nextActive = advanceToNext(seg.key, { ...r0, [seg.key]: nextVal });
      }
    } else if (seg.kind === 'num' || seg.kind === 'hour') {
      if (!/\d/.test(key)) return;
      if (cur.length >= seg.len) return; // segment full
      if (seg.key === 'minute' && cur.length === 0 && key > '5') return; // minute tens 0-5
      nextVal = cur + key;
      if (nextVal.length === seg.len) {
        if (!segValid(seg, nextVal)) {
          invalidFull = true;
        } else {
          nextActive = advanceToNext(seg.key, { ...r0, [seg.key]: nextVal });
        }
      } else {
        nextActive = seg.key;
      }
    } else {
      return;
    }

    const next = { ...r0, [seg.key]: nextVal };
    rawRef.current = next;
    setRaw(next);
    if (invalidFull) {
      setError(true);
    } else {
      setError(false);
      commitIfReady(next);
      setActiveSeg(nextActive);
    }
  };

  const handleClear = () => {
    onChange('');
    setRaw({});
    setError(false);
    setActiveSeg(cfg.segs[0].key);
    setOpen(false);
  };

  const setNow = () => {
    const now = new Date();
    onChange(toCanonical(now, mode));
    setRaw(fromCanonical(toCanonical(now, mode), mode));
    setOpen(false);
  };

  // Calendar handlers
  const handleDaySelect = (day) => {
    if (!day) return;
    const base = mode === 'datetime' ? (toDate(value) || new Date()) : day;
    const d = new Date(day);
    if (mode === 'datetime') {
      const existing = toDate(value);
      d.setHours(existing ? existing.getHours() : 0, existing ? existing.getMinutes() : 0, 0, 0);
    }
    onChange(toCanonical(d, mode));
    setRaw(fromCanonical(toCanonical(d, mode), mode));
    if (mode === 'datetime') {
      // advance to time section
      setCalView('days');
    } else {
      setOpen(false);
    }
  };

  const handleTime = (t) => {
    const [h, m] = t.split(':').map(Number);
    const base = toDate(value) || new Date();
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    onChange(toCanonical(d, mode));
    setRaw(fromCanonical(toCanonical(d, mode), mode));
  };

  const openPopover = (o) => {
    setOpen(o);
    if (o) {
      setCalView('days');
      const d = toDate(value) || new Date();
      setDisplayMonth(startOfMonth(d));
      setDecade(Math.floor(d.getFullYear() / 10) * 10);
      setManualText('');
      setManualTime('');
    }
  };

  const shiftMonth = (delta) => setDisplayMonth((d) => startOfMonth(new Date(d.getFullYear(), d.getMonth() + delta, 1)));
  const shiftYear = (delta) => {
    setDisplayMonth((d) => startOfMonth(new Date(d.getFullYear() + delta, d.getMonth(), 1)));
    setDecade((dd) => dd + delta * 10);
  };
  const shiftDecade = (delta) => setDecade((dd) => dd + delta * 10);

  const pickMonth = (mIdx) => {
    setDisplayMonth((d) => startOfMonth(dfSetMonth(dfSetYear(d, displayMonth.getFullYear()), mIdx)));
    setCalView('days');
  };
  const pickYear = (y) => {
    setDisplayMonth((d) => startOfMonth(dfSetYear(d, y)));
    setCalView('months');
  };

  // Manual date entry inside popup → jump calendar (and select if complete)
  const autoFormat = (s) => {
    const d = s.replace(/\D/g, '').slice(0, 8);
    if (d.length > 4) return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
    if (d.length > 2) return `${d.slice(0, 2)}-${d.slice(2)}`;
    return d;
  };
  const commitManual = (override) => {
    const t = (override !== undefined ? override : manualText).trim();
    if (!t) return;
    let d = parse(t, 'dd-MM-yyyy', new Date());
    if (!isValid(d)) d = parse(t, 'yyyy-MM-dd', new Date());
    if (isValid(d)) {
      setDisplayMonth(startOfMonth(d));
      const base = mode === 'datetime' ? (toDate(value) || new Date()) : new Date(d);
      const out = new Date(d);
      if (mode === 'datetime') {
        const ex = toDate(value);
        out.setHours(ex ? ex.getHours() : 0, ex ? ex.getMinutes() : 0, 0, 0);
      } else { out.setHours(0, 0, 0, 0); }
      onChange(toCanonical(out, mode));
      setRaw(fromCanonical(toCanonical(out, mode), mode));
      setCalView('days');
    }
  };

  // Allow digits, colon, and AM/PM letters only; uppercase for consistency
  const autoFormatTime = (s) => s.toUpperCase().replace(/[^0-9:APM]/g, '');

  const commitManualTime = () => {
    const t = manualTime.trim().toUpperCase();
    if (!t) return;
    const m = t.match(/^(\d{1,2}):?(\d{2})\s*([AP]M)?$/);
    if (!m) return;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    const ap = m[3];
    if (ap === 'PM' && h !== 12) h += 12;
    else if (ap === 'AM' && h === 12) h = 0;
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      handleTime(`${pad2(h)}:${pad2(min)}`);
      setManualTime('');
    }
  };

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const navBtn = 'inline-flex items-center justify-center h-7 w-7 rounded-md bg-transparent border border-border text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors flex-shrink-0';
  const chars = buildChars(raw, mode);
  const sentinel = buildSentinel(raw, mode);
  const hasValue = !!value;

  return (
    <div className={cn('relative w-full', className)}>
      <div className="flex items-stretch gap-1.5">
        {/* Masked text input with two-tone overlay */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={sentinel}
            disabled={disabled}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onChange={() => { /* controlled via keydown; swallow IME/compose */ }}
            onPaste={(e) => e.preventDefault()}
            aria-label={mode === 'date' ? 'Date' : 'Date and time'}
            spellCheck={false}
            autoComplete="off"
            className={cn(
              'w-full h-10 rounded-xl border bg-input px-3 py-1 text-sm font-mono tabular-nums leading-none transition-all duration-200',
              'text-transparent caret-foreground',
              'shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)]',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none',
              error
                ? 'border-destructive/70 focus-visible:shadow-[0_0_0_3px_hsl(var(--destructive)/0.18)]'
                : 'focus-visible:border-primary/40 focus-visible:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03),0_0_0_3px_rgba(var(--panel-accent-rgb),0.15)]',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          {/* Two-tone overlay: typed chars foreground, placeholder letters muted */}
          <div
            aria-hidden
            className="absolute inset-0 flex items-center px-3 py-1 text-sm font-mono tabular-nums leading-none pointer-events-none whitespace-pre select-none"
          >
            {chars.map((c, i) => (
              <span
                key={i}
                className={c.typed === null ? '' : c.typed ? 'text-foreground' : 'text-muted-foreground/45'}
              >
                {c.ch}
              </span>
            ))}
          </div>
          {error && (
            <p className="absolute -bottom-4 left-0 text-[10px] text-destructive">Invalid date</p>
          )}
        </div>

        {/* Clear */}
        {hasValue && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="h-10 w-9 p-0 flex-shrink-0 text-muted-foreground hover:text-destructive"
            aria-label="Clear"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {/* Calendar popover trigger */}
        <Popover open={open} onOpenChange={openPopover}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="h-10 w-10 p-0 flex-shrink-0 justify-center bg-background/50 border-border backdrop-blur-sm hover:bg-white/[0.06]"
              aria-label="Open calendar"
            >
              <CalendarIcon className="w-4 h-4 text-primary/80" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            dir={dir}
            align="end"
            className="w-auto p-3 bg-card/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl z-[200]"
          >
            {/* Top row: Clear / Now */}
            <div className="flex justify-between items-center mb-2">
              <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="h-7 text-[11px] text-muted-foreground hover:text-destructive gap-1">
                <X className="w-3 h-3" /> Clear
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={setNow} className="h-7 text-[11px] text-primary">
                {mode === 'date' ? 'Today' : 'Now'}
              </Button>
            </div>

            <div className={cn('flex gap-3', mode === 'datetime' ? 'flex-col md:flex-row' : 'flex-col')}>
              {/* Left column: calendar + manual date entry */}
              <div className="flex flex-col gap-2 w-full md:w-[17rem]">
                {calView === 'days' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                      <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)} className={navBtn}>
                        {dir === 'rtl' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalView('months')}
                        className="text-sm font-semibold px-2 py-1 rounded-md hover:bg-white/[0.06] text-foreground transition-colors"
                        title="Pick month & year"
                      >
                        {format(displayMonth, 'MMMM yyyy')}
                      </button>
                      <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} className={navBtn}>
                        {dir === 'rtl' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </div>
                    <Calendar
                      mode="single"
                      dir={dir}
                      month={displayMonth}
                      onMonthChange={setDisplayMonth}
                      selected={date || undefined}
                      onSelect={handleDaySelect}
                      autoFocus
                      classNames={{ caption: 'hidden', nav: 'hidden' }}
                      className="rounded-lg"
                    />
                  </div>
                )}

                {calView === 'months' && (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center justify-between px-1">
                      <button type="button" aria-label="Previous year" onClick={() => shiftYear(-1)} className={navBtn}>
                        {dir === 'rtl' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalView('years')}
                        className="text-sm font-semibold px-2 py-1 rounded-md hover:bg-white/[0.06] text-foreground transition-colors"
                        title="Pick year"
                      >
                        {displayMonth.getFullYear()}
                      </button>
                      <button type="button" aria-label="Next year" onClick={() => shiftYear(1)} className={navBtn}>
                        {dir === 'rtl' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {MONTHS.map((m, i) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => pickMonth(i)}
                          className={cn(
                            'px-1 py-2 rounded-md text-xs font-medium transition-colors border',
                            isSameMonth(displayMonth, new Date(displayMonth.getFullYear(), i, 1))
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-transparent text-muted-foreground border-transparent hover:bg-white/[0.06] hover:text-foreground'
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {calView === 'years' && (
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center justify-between px-1">
                      <button type="button" aria-label="Previous decade" onClick={() => shiftDecade(-1)} className={navBtn}>
                        {dir === 'rtl' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                      </button>
                      <span className="text-sm font-semibold px-2 py-1 text-foreground">{decade}–{decade + 11}</span>
                      <button type="button" aria-label="Next decade" onClick={() => shiftDecade(1)} className={navBtn}>
                        {dir === 'rtl' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {Array.from({ length: 12 }, (_, i) => decade + i).map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => pickYear(y)}
                          className={cn(
                            'px-1 py-2 rounded-md text-xs font-medium transition-colors border',
                            displayMonth.getFullYear() === y
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-transparent text-muted-foreground border-transparent hover:bg-white/[0.06] hover:text-foreground'
                          )}
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manual date entry — no Go button; auto-jumps to time on complete */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                  <Input
                    ref={dateInputRef}
                    type="text"
                    inputMode="numeric"
                    value={manualText}
                    onChange={(e) => {
                      const v = autoFormat(e.target.value);
                      setManualText(v);
                      if (v.length === 10) { commitManual(v); timeInputRef.current?.focus(); }
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitManual(); timeInputRef.current?.focus(); } }}
                    placeholder="Type DD-MM-YYYY"
                    className="h-8 text-sm tabular-nums font-mono"
                  />
                </div>
              </div>

              {/* Right column: time picker + manual time entry — datetime only */}
              {mode === 'datetime' && (
                <div className="flex flex-col gap-2 w-full md:w-[15rem] md:border-l md:border-white/[0.06] md:pl-3">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/80 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pick Time
                    </span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="h-7 text-[11px] text-primary gap-1">
                      <Check className="w-3.5 h-3.5" /> Done
                    </Button>
                  </div>
                  {pickerStyle === 'analog_custom' ? (
                    <AnalogClockPicker value={timeStr} onChange={handleTime} variant="custom" />
                  ) : pickerStyle === 'analog_library' ? (
                    <AnalogClockPicker value={timeStr} onChange={handleTime} variant="library" />
                  ) : (
                    <TimeWheelPicker value={timeStr} onChange={handleTime} />
                  )}
                  {/* Manual time entry + Go button */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                    <Input
                      ref={timeInputRef}
                      type="text"
                      value={manualTime}
                      onChange={(e) => setManualTime(autoFormatTime(e.target.value))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitManualTime(); } }}
                      placeholder="Type HH:MM AM/PM"
                      className="h-8 text-sm tabular-nums font-mono"
                    />
                    <Button type="button" size="sm" onClick={commitManualTime} className="h-8 px-3">Go</Button>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {date && !editing && !error && (
        <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {format(date, 'dd MMM yyyy')}{mode === 'datetime' ? ` · ${format(date, 'hh:mm a')}` : ''}
        </p>
      )}
    </div>
  );
}