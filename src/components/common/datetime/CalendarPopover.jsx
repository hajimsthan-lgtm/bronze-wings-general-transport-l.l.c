import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, parse, isValid, startOfMonth, isSameMonth, setYear as dfSetYear, setMonth as dfSetMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { toDate, toCanonical } from './datetimeUtils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function CalendarPopover({ value, mode, onChange, onClose, onNext, dir, dateInputRef }) {
  const [calView, setCalView] = useState('days');
  const [displayMonth, setDisplayMonth] = useState(() => startOfMonth(toDate(value) || new Date()));
  const [decade, setDecade] = useState(() => Math.floor((toDate(value) || new Date()).getFullYear() / 10) * 10);
  const [manualText, setManualText] = useState('');
  const date = toDate(value);
  const navBtn = 'inline-flex items-center justify-center h-7 w-7 rounded-md bg-transparent border border-border text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors flex-shrink-0';

  const handleClear = () => { onChange(''); onClose(); };
  const setNow = () => { onChange(toCanonical(new Date(), mode)); onClose(); };

  const handleDaySelect = (day) => {
    if (!day) return;
    const d = new Date(day);
    if (mode === 'datetime') { const ex = toDate(value); d.setHours(ex ? ex.getHours() : 0, ex ? ex.getMinutes() : 0, 0, 0); }
    else d.setHours(0, 0, 0, 0);
    onChange(toCanonical(d, mode));
    if (mode === 'date') onClose();
  };

  const shiftMonth = (d) => setDisplayMonth((m) => startOfMonth(new Date(m.getFullYear(), m.getMonth() + d, 1)));
  const shiftYear = (d) => { setDisplayMonth((m) => startOfMonth(new Date(m.getFullYear() + d, m.getMonth(), 1))); setDecade((dd) => dd + d * 10); };
  const shiftDecade = (d) => setDecade((dd) => dd + d * 10);
  const pickMonth = (i) => { setDisplayMonth((m) => startOfMonth(dfSetMonth(dfSetYear(m, displayMonth.getFullYear()), i))); setCalView('days'); };
  const pickYear = (y) => { setDisplayMonth((m) => startOfMonth(dfSetYear(m, y))); setCalView('months'); };

  const autoFormat = (s) => { const d = s.replace(/\D/g, '').slice(0, 8); if (d.length > 4) return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`; if (d.length > 2) return `${d.slice(0, 2)}-${d.slice(2)}`; return d; };
  const commitManual = (override) => {
    const t = (override !== undefined ? override : manualText).trim();
    if (!t) return;
    let d = parse(t, 'dd-MM-yyyy', new Date());
    if (!isValid(d)) d = parse(t, 'yyyy-MM-dd', new Date());
    if (isValid(d)) {
      setDisplayMonth(startOfMonth(d));
      const out = new Date(d);
      if (mode === 'datetime') { const ex = toDate(value); out.setHours(ex ? ex.getHours() : 0, ex ? ex.getMinutes() : 0, 0, 0); }
      else out.setHours(0, 0, 0, 0);
      onChange(toCanonical(out, mode));
      setCalView('days');
      onNext?.();
    }
  };

  return (
    <div className="w-full md:w-[17rem]">
      <div className="flex justify-between items-center mb-2">
        <Button type="button" variant="ghost" size="sm" onClick={handleClear} className="h-7 text-[11px] text-muted-foreground hover:text-destructive gap-1"><X className="w-3 h-3" /> Clear</Button>
        <Button type="button" variant="ghost" size="sm" onClick={setNow} className="h-7 text-[11px] text-primary">{mode === 'date' ? 'Today' : 'Now'}</Button>
      </div>
      {calView === 'days' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <button type="button" aria-label="Previous month" onClick={() => shiftMonth(-1)} className={navBtn}>{dir === 'rtl' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
            <button type="button" onClick={() => setCalView('months')} className="text-sm font-semibold px-2 py-1 rounded-md hover:bg-white/[0.06] text-foreground transition-colors">{format(displayMonth, 'MMMM yyyy')}</button>
            <button type="button" aria-label="Next month" onClick={() => shiftMonth(1)} className={navBtn}>{dir === 'rtl' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
          </div>
          <Calendar mode="single" dir={dir} month={displayMonth} onMonthChange={setDisplayMonth} selected={date || undefined} onSelect={handleDaySelect} autoFocus classNames={{ caption: 'hidden', nav: 'hidden' }} className="rounded-lg" />
        </div>
      )}
      {calView === 'months' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <button type="button" aria-label="Previous year" onClick={() => shiftYear(-1)} className={navBtn}>{dir === 'rtl' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
            <button type="button" onClick={() => setCalView('years')} className="text-sm font-semibold px-2 py-1 rounded-md hover:bg-white/[0.06] text-foreground transition-colors">{displayMonth.getFullYear()}</button>
            <button type="button" aria-label="Next year" onClick={() => shiftYear(1)} className={navBtn}>{dir === 'rtl' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {MONTHS.map((m, i) => (
              <button key={m} type="button" onClick={() => pickMonth(i)} className={cn('px-1 py-2 rounded-md text-xs font-medium transition-colors border', isSameMonth(displayMonth, new Date(displayMonth.getFullYear(), i, 1)) ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-transparent hover:bg-white/[0.06] hover:text-foreground')}>{m}</button>
            ))}
          </div>
        </div>
      )}
      {calView === 'years' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <button type="button" aria-label="Previous decade" onClick={() => shiftDecade(-1)} className={navBtn}>{dir === 'rtl' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>
            <span className="text-sm font-semibold px-2 py-1 text-foreground">{decade}–{decade + 11}</span>
            <button type="button" aria-label="Next decade" onClick={() => shiftDecade(1)} className={navBtn}>{dir === 'rtl' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }, (_, i) => decade + i).map((y) => (
              <button key={y} type="button" onClick={() => pickYear(y)} className={cn('px-1 py-2 rounded-md text-xs font-medium transition-colors border', displayMonth.getFullYear() === y ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-transparent hover:bg-white/[0.06] hover:text-foreground')}>{y}</button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06] mt-2">
        <Input ref={dateInputRef} type="text" inputMode="numeric" value={manualText} onChange={(e) => { const v = autoFormat(e.target.value); setManualText(v); if (v.length === 10) commitManual(v); }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitManual(); } }} placeholder="Type DD-MM-YYYY" className="h-8 text-sm tabular-nums font-mono" />
      </div>
    </div>
  );
}