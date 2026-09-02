import { useState, useEffect, useRef } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarDays, Clock } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import MaskedInput from './datetime/MaskedInput';
import CalendarPopover from './datetime/CalendarPopover';
import TimePicker from './datetime/TimePicker';
import {
  fromDateRaw, fromTimeRaw, applyDate, applyTime, applyTime24, timeStr24,
  DATE_SEGS, DATE_SEPS, TIME_SEGS, TIME_SEPS,
} from './datetime/datetimeUtils';

/* ─────────────────────────────────────────────────────────────
   Canonical internal value:
     • datetime mode → "YYYY-MM-DDTHH:mm"  (24h)
     • date mode     → "YYYY-MM-DD"
   The masked inputs display "DD-MM-YYYY" (date cell) and
   "HH:MM AM/PM" (time cell). Each cell has its own inline SVG icon
   and its own popup (calendar / 5-mode time picker).
   ───────────────────────────────────────────────────────────── */

export default function DateTimePicker({
  value, onChange, mode = 'datetime', disabled, className,
  placeholder: _placeholder, required, id, name,
}) {
  const { dir } = useI18n();
  const timeInputRef = useRef(null);
  const dateInputRef = useRef(null);

  if (mode === 'date') {
    return (
      <div className={cn('relative flex items-stretch rounded-xl border border-input bg-input shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)] focus-within:border-primary/40 transition-colors', className)}>
        <DateField value={value} onChange={onChange} mode="date" disabled={disabled} id={id} name={name} required={required} dir={dir} dateInputRef={dateInputRef} className="flex-1 min-w-0" />
      </div>
    );
  }

  return (
    <div className={cn('flex items-stretch rounded-xl border border-input bg-input shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)] focus-within:border-primary/40 transition-colors', className)}>
      <DateField value={value} onChange={onChange} mode="datetime" disabled={disabled} id={id} name={name} required={required} dir={dir} dateInputRef={dateInputRef} onNext={() => timeInputRef.current?.focus()} className="flex-[3] min-w-0" />
      <div className="w-px bg-border/50 my-1.5" />
      <TimeField value={value} onChange={onChange} disabled={disabled} dir={dir} inputRef={timeInputRef} className="flex-[2] min-w-0" />
    </div>
  );
}

function DateField({ value, onChange, mode, disabled, id, name, required, dir, dateInputRef, onNext, className }) {
  const [raw, setRaw] = useState(() => fromDateRaw(value));
  const [open, setOpen] = useState(false);
  const editingRef = useRef(false);
  useEffect(() => { if (!editingRef.current) setRaw(fromDateRaw(value)); }, [value]);
  const commit = (r) => { const c = applyDate(value, r, mode); if (c) { onChange(c); return true; } return false; };
  const revert = () => setRaw(fromDateRaw(value));
  const clear = () => { onChange(''); setRaw({}); setOpen(false); };

  return (
    <div className={cn('relative flex items-stretch focus-within:bg-white/[0.04] rounded-lg', className)}>
      <Popover open={open} onOpenChange={(o) => setOpen(o)}>
        <PopoverTrigger asChild>
          <button type="button" tabIndex={-1} disabled={disabled} aria-label="Open calendar" className={cn('absolute left-1.5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-7 h-7 rounded-md transition-colors', open ? 'text-primary' : 'text-muted-foreground hover:text-primary')}>
            <CalendarDays className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent dir={dir} align="start" className="w-auto p-3 bg-card/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl z-[200]">
          <CalendarPopover value={value} mode={mode} onChange={onChange} onClose={() => setOpen(false)} onNext={onNext} dir={dir} dateInputRef={dateInputRef} />
        </PopoverContent>
      </Popover>
      <MaskedInput segs={DATE_SEGS} seps={DATE_SEPS} raw={raw} setRaw={setRaw} onCommit={commit} onRevert={revert} onClear={clear} editingRef={editingRef} bare disabled={disabled} id={id} name={name} required={required} ariaLabel="Date" className="h-full" />
    </div>
  );
}

function TimeField({ value, onChange, disabled, dir, inputRef, className }) {
  const [raw, setRaw] = useState(() => fromTimeRaw(value));
  const [open, setOpen] = useState(false);
  const editingRef = useRef(false);
  useEffect(() => { if (!editingRef.current) setRaw(fromTimeRaw(value)); }, [value]);
  const commit = (r) => { const c = applyTime(value, r); if (c) { onChange(c); return true; } return false; };
  const revert = () => setRaw(fromTimeRaw(value));
  const clear = () => { onChange(''); setRaw({}); setOpen(false); };
  const timeStr = timeStr24(value);
  const onTimeChange = (hhmm24) => { const c = applyTime24(value, hhmm24); if (c) onChange(c); };

  return (
    <div className={cn('relative flex items-stretch focus-within:bg-white/[0.04] rounded-lg', className)}>
      <Popover open={open} onOpenChange={(o) => setOpen(o)}>
        <PopoverTrigger asChild>
          <button type="button" tabIndex={-1} disabled={disabled} aria-label="Open time picker" className={cn('absolute left-1.5 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-7 h-7 rounded-md transition-colors', open ? 'text-primary' : 'text-muted-foreground hover:text-primary')}>
            <Clock className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent dir={dir} align="end" className="w-auto p-3 bg-card/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl z-[200]">
          <TimePicker timeStr={timeStr} onTimeChange={onTimeChange} onClose={() => setOpen(false)} dir={dir} />
        </PopoverContent>
      </Popover>
      <MaskedInput segs={TIME_SEGS} seps={TIME_SEPS} raw={raw} setRaw={setRaw} onCommit={commit} onRevert={revert} onClear={clear} editingRef={editingRef} bare disabled={disabled} ariaLabel="Time" inputRef={inputRef} className="h-full" />
    </div>
  );
}