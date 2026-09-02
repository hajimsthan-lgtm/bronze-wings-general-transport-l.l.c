import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { CalendarDays, Clock } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { toDate, toCanonical } from './datetime/datetimeUtils';

/**
 * FriendlyDateTimePicker — simple manually-writable field.
 *  - Date input: DD-MM-YYYY (the "-" is inserted automatically)
 *  - Time input: HH:MM     (the ":" is inserted automatically)  [datetime mode]
 *  - AM/PM toggle next to the time input                         [datetime mode]
 *  - When the date is fully typed, focus auto-jumps to the time input.
 * Same canonical value contract as the legacy picker:
 *   datetime → "YYYY-MM-DDTHH:mm" (24h),  date → "YYYY-MM-DD"
 */
export default function FriendlyDateTimePicker({
  value, onChange, mode = 'datetime', disabled, className, placeholder, required, id, name,
}) {
  const { dir } = useI18n();
  const d = toDate(value);

  const dateRef = useRef(null);
  const timeRef = useRef(null);

  const [dateRaw, setDateRaw] = useState(() => d ? format(d, 'dd-MM-yyyy') : '');
  const [timeRaw, setTimeRaw] = useState(() => d ? format(d, 'hh:mm') : '');

  useEffect(() => {
    setDateRaw(d ? format(d, 'dd-MM-yyyy') : '');
    setTimeRaw(d ? format(d, 'hh:mm') : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const curH12 = d ? (d.getHours() % 12 === 0 ? 12 : d.getHours() % 12) : 12;
  const curMin = d ? d.getMinutes() : 0;
  const curAm = d ? (d.getHours() < 12 ? 'AM' : 'PM') : 'AM';

  const autoFmtDate = (s) => {
    const digits = s.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 4) return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
    if (digits.length > 2) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return digits;
  };
  const autoFmtTime = (s) => {
    const digits = s.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
    return digits;
  };

  const commitDate = (text) => {
    const t = (text ?? dateRaw).trim();
    if (!t) return;
    let parsed = parse(t, 'dd-MM-yyyy', new Date());
    if (!isValid(parsed)) parsed = parse(t, 'dd/MM/yyyy', new Date());
    if (!isValid(parsed)) parsed = parse(t, 'yyyy-MM-dd', new Date());
    if (isValid(parsed)) {
      const nd = new Date(parsed);
      if (mode === 'datetime') { nd.setHours(d ? d.getHours() : 0, d ? d.getMinutes() : 0, 0, 0); }
      else nd.setHours(0, 0, 0, 0);
      onChange(toCanonical(nd, mode));
    }
  };
  const setTime = (h12, min, meridiem) => {
    const h24 = meridiem === 'PM' ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
    const ex = d || new Date();
    const nd = new Date(ex);
    nd.setHours(h24, min, 0, 0);
    onChange(toCanonical(nd, mode));
  };
  const commitTime = (text) => {
    const t = (text ?? timeRaw).trim();
    if (!t) return;
    const m = t.match(/^(\d{1,2}):?(\d{0,2})$/);
    if (!m) return;
    const h12 = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    if (h12 < 1 || h12 > 12 || min < 0 || min > 59) return;
    setTime(h12, min, curAm);
  };

  const onDateChange = (e) => {
    const v = autoFmtDate(e.target.value);
    setDateRaw(v);
    commitDate(v);
    if (v.length === 10 && mode === 'datetime') {
      setTimeout(() => timeRef.current?.focus(), 0);
    }
  };

  return (
    <div className={cn('flex items-center gap-1.5 w-full', className)} dir={dir}>
      {/* Date — DD-MM-YYYY (auto "-") */}
      <div className="relative flex-1 min-w-0">
        <CalendarDays className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          ref={dateRef}
          type="text"
          id={id}
          name={name}
          disabled={disabled}
          required={required}
          value={dateRaw}
          onChange={onDateChange}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitDate(); timeRef.current?.focus(); } }}
          onBlur={() => commitDate()}
          placeholder="DD-MM-YYYY"
          inputMode="numeric"
          className="h-10 pl-8 pr-3 text-sm tabular-nums font-mono"
        />
      </div>

      {mode === 'datetime' && (
        <>
          {/* Time — HH:MM (auto ":") */}
          <div className="relative w-[84px] flex-shrink-0">
            <Clock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              ref={timeRef}
              type="text"
              disabled={disabled}
              value={timeRaw}
              onChange={(e) => { const v = autoFmtTime(e.target.value); setTimeRaw(v); commitTime(v); }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              onBlur={() => commitTime()}
              placeholder="HH:MM"
              inputMode="numeric"
              className="h-10 pl-8 pr-2 text-sm tabular-nums font-mono"
            />
          </div>
          {/* AM/PM toggle */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-muted/40 border border-border flex-shrink-0">
            <button type="button" disabled={disabled} onClick={() => setTime(curH12, curMin, 'AM')}
              className={cn('h-8 px-2 rounded-lg text-xs font-bold transition-colors', curAm === 'AM' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>AM</button>
            <button type="button" disabled={disabled} onClick={() => setTime(curH12, curMin, 'PM')}
              className={cn('h-8 px-2 rounded-lg text-xs font-bold transition-colors', curAm === 'PM' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>PM</button>
          </div>
        </>
      )}
    </div>
  );
}