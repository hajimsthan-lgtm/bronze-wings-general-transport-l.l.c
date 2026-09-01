import { useRef, useEffect, useMemo } from 'react';
import { pad2 } from './datetimeUtils';

const STEP = 15;

export default function TimeScrollList({ value, onChange, onDone }) {
  const ref = useRef(null);
  const [h, m] = value ? value.split(':').map(Number) : [0, 0];

  const slots = useMemo(() => Array.from({ length: (24 * 60) / STEP }, (_, i) => {
    const total = i * STEP;
    const hh = Math.floor(total / 60);
    const mm = total % 60;
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    const ap = hh >= 12 ? 'PM' : 'AM';
    return { h24: hh, m: mm, label: `${pad2(h12)}:${pad2(mm)} ${ap}` };
  }), []);

  const nearest = useMemo(() => {
    const idx = Math.round((h * 60 + m) / STEP) % slots.length;
    return idx;
  }, [h, m, slots.length]);

  useEffect(() => { if (ref.current) ref.current.scrollTop = nearest * 36; }, [nearest]);

  return (
    <div ref={ref} className="h-44 overflow-y-scroll no-scrollbar flex flex-col gap-0.5 pr-1">
      {slots.map((s, i) => {
        const active = i === nearest;
        return (
          <button key={i} type="button" onClick={() => { onChange(`${pad2(s.h24)}:${pad2(s.m)}`); onDone?.(); }} className={`h-9 rounded-lg text-sm tabular-nums transition-colors ${active ? 'bg-primary/15 text-primary font-semibold' : 'text-muted-foreground hover:bg-white/[0.06] hover:text-foreground'}`}>{s.label}</button>
        );
      })}
    </div>
  );
}