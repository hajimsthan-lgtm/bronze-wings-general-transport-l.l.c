import { useState, useMemo } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, X, Zap, Sunrise, Sun, Check } from 'lucide-react';
import { format, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { toDate, toCanonical, pad2 } from './datetime/datetimeUtils';

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function fmtDisplay(value, mode) {
  const d = toDate(value);
  if (!d) return null;
  if (mode === 'date') return format(d, 'EEE, dd MMM yyyy');
  return `${format(d, 'EEE, dd MMM yyyy')} · ${format(d, 'h:mm a')}`;
}

/**
 * FriendlyDateTimePicker
 *  - Single clean trigger showing the formatted date & time (or placeholder)
 *  - Popover with quick presets (Now, Today 8AM, Today 1PM, Tomorrow 8AM, Clear)
 *  - Date tab: full month calendar with built-in month/year navigation
 *  - Time tab: AM/PM toggle + tappable hour (1-12) and 5-minute grids
 *  - Same canonical value contract as the legacy picker:
 *      datetime → "YYYY-MM-DDTHH:mm" (24h),  date → "YYYY-MM-DD"
 */
export default function FriendlyDateTimePicker({
  value, onChange, mode = 'datetime', disabled, className, placeholder, required, id, name,
}) {
  const { dir } = useI18n();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('date');
  const d = toDate(value);
  const display = fmtDisplay(value, mode);

  const commitDate = (day) => {
    if (!day) return;
    const nd = new Date(day);
    if (mode === 'datetime') { const ex = d; nd.setHours(ex ? ex.getHours() : 0, ex ? ex.getMinutes() : 0, 0, 0); }
    else nd.setHours(0, 0, 0, 0);
    onChange(toCanonical(nd, mode));
  };

  const setTime = (h12, min, meridiem) => {
    const h24 = meridiem === 'PM' ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
    const ex = d || new Date();
    const nd = new Date(ex);
    nd.setHours(h24, min, 0, 0);
    onChange(toCanonical(nd, mode));
  };

  const setNow = () => onChange(toCanonical(new Date(), mode));
  const clear = () => { onChange(''); setOpen(false); };

  const presets = useMemo(() => {
    const list = [{ label: 'Now', icon: Zap, fn: setNow }];
    const today = new Date();
    if (mode === 'datetime') {
      const mk = (h, m) => { const nd = new Date(today); nd.setHours(h, m, 0, 0); return toCanonical(nd, mode); };
      list.push({ label: 'Today 8AM', icon: Sunrise, fn: () => onChange(mk(8, 0)) });
      list.push({ label: 'Today 1PM', icon: Sun, fn: () => onChange(mk(13, 0)) });
      list.push({ label: 'Tomorrow 8AM', icon: Sunrise, fn: () => { const nd = new Date(today); nd.setDate(nd.getDate() + 1); nd.setHours(8, 0, 0, 0); onChange(toCanonical(nd, mode)); } });
    } else {
      list.push({ label: 'Today', icon: Sunrise, fn: () => onChange(toCanonical(startOfToday(), mode)) });
    }
    return list;
  }, [mode]);

  const curH12 = d ? (d.getHours() % 12 === 0 ? 12 : d.getHours() % 12) : 12;
  const curMin = d ? d.getMinutes() : 0;
  const curAm = d ? (d.getHours() < 12 ? 'AM' : 'PM') : 'AM';

  const chip = 'inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-semibold border transition-colors';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" id={id} name={name} disabled={disabled} required={required}
          className={cn('group flex items-center gap-2 w-full h-10 px-3 rounded-xl border border-input bg-input text-left shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)] transition-colors focus:border-primary/40 disabled:opacity-50', className)}>
          <CalendarDays className={cn('w-4 h-4 flex-shrink-0 transition-colors', open ? 'text-primary' : 'text-muted-foreground group-hover:text-primary')} />
          <span className={cn('flex-1 truncate text-sm', display ? 'text-foreground' : 'text-muted-foreground')}>
            {display || placeholder || (mode === 'date' ? 'Select date' : 'Select date & time')}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent dir={dir} align="start" className="w-[320px] p-3 bg-card/95 backdrop-blur-2xl border border-white/[0.08] rounded-xl shadow-2xl z-[200]">
        {/* Quick presets */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {presets.map((p) => (
            <button key={p.label} type="button" onClick={p.fn}
              className={cn(chip, 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20')}>
              <p.icon className="w-3 h-3" /> {p.label}
            </button>
          ))}
          <button type="button" onClick={clear}
            className={cn(chip, 'border-border text-muted-foreground hover:text-destructive hover:border-destructive/40')}>
            <X className="w-3 h-3" /> Clear
          </button>
        </div>

        {mode === 'datetime' && (
          <div className="flex items-center gap-1 p-0.5 mb-3 rounded-lg bg-muted/40 border border-border">
            <button type="button" onClick={() => setTab('date')}
              className={cn('flex-1 h-8 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors', tab === 'date' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground')}>
              <CalendarDays className="w-3.5 h-3.5" /> Date
            </button>
            <button type="button" onClick={() => setTab('time')}
              className={cn('flex-1 h-8 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors', tab === 'time' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground')}>
              <Clock className="w-3.5 h-3.5" /> Time
            </button>
          </div>
        )}

        {tab === 'date' && (
          <Calendar mode="single" dir={dir} selected={d || undefined} onSelect={commitDate}
            className="rounded-lg" classNames={{ caption_label: 'text-sm font-semibold' }} />
        )}

        {tab === 'time' && mode === 'datetime' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border">
              <button type="button" onClick={() => setTime(curH12, curMin, 'AM')}
                className={cn('flex-1 h-8 rounded-md text-xs font-bold transition-colors', curAm === 'AM' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>AM</button>
              <button type="button" onClick={() => setTime(curH12, curMin, 'PM')}
                className={cn('flex-1 h-8 rounded-md text-xs font-bold transition-colors', curAm === 'PM' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>PM</button>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Hour</p>
              <div className="grid grid-cols-4 gap-1">
                {HOURS_12.map((h) => (
                  <button key={h} type="button" onClick={() => setTime(h, curMin, curAm)}
                    className={cn('h-8 rounded-md text-xs font-semibold border transition-all', h === curH12 ? 'bg-primary text-primary-foreground border-primary shadow scale-105' : 'bg-transparent border-border text-muted-foreground hover:bg-white/[0.06] hover:text-foreground')}>{h}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 px-1">Minute</p>
              <div className="grid grid-cols-6 gap-1">
                {MINUTES.map((m) => (
                  <button key={m} type="button" onClick={() => setTime(curH12, m, curAm)}
                    className={cn('h-8 rounded-md text-xs font-semibold border transition-all', m === curMin ? 'bg-primary text-primary-foreground border-primary shadow scale-105' : 'bg-transparent border-border text-muted-foreground hover:bg-white/[0.06] hover:text-foreground')}>{pad2(m)}</button>
                ))}
              </div>
            </div>
            <button type="button" onClick={setNow} className="self-end text-[11px] text-primary hover:underline flex items-center gap-1"><Zap className="w-3 h-3" /> Set to now</button>
          </div>
        )}

        {mode === 'datetime' && (
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.06]">
            <span className="text-[11px] text-muted-foreground tabular-nums truncate">{display || 'No date set'}</span>
            <Button type="button" size="sm" onClick={() => setOpen(false)} className="h-8"><Check className="w-3.5 h-3.5" /> Done</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}