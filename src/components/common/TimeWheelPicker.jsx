import { useRef, useEffect, useState, useCallback } from 'react';

const ITEM_H = 38;
const VISIBLE = 5;
const WHEEL_H = ITEM_H * VISIBLE;
const PAD = ITEM_H * 2;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function Wheel({ items, initialIndex, onSelect, onSettle }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const [selected, setSelected] = useState(initialIndex);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = initialIndex * ITEM_H;
    }
  }, []); // eslint-disable-line

  const handleScroll = useCallback(() => {
    if (!ref.current) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      if (ref.current.scrollTop !== clamped * ITEM_H) {
        ref.current.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' });
      }
      setSelected(clamped);
      onSelect(clamped);
      onSettle?.();
    }, 100);
  }, [items.length, onSelect, onSettle]);

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="overflow-y-scroll no-scrollbar relative z-10"
      style={{
        height: WHEEL_H,
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        maskImage: 'linear-gradient(to bottom, transparent 5%, black 28%, black 72%, transparent 95%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 5%, black 28%, black 72%, transparent 95%)',
      }}
    >
      <div style={{ paddingTop: PAD, paddingBottom: PAD }}>
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center justify-center tabular-nums transition-all duration-150"
            style={{
              height: ITEM_H,
              scrollSnapAlign: 'center',
              fontSize: i === selected ? '17px' : '14px',
              color: i === selected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              fontWeight: i === selected ? 700 : 400,
              opacity: i === selected ? 1 : 0.45,
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TimeWheelPicker({ value, onChange, onDone }) {
  const initial = value ? value.split(':').map(Number) : [0, 0];
  const hoursRef = useRef(initial[0] || 0);
  const minutesRef = useRef(initial[1] || 0);
  const closeTimer = useRef(null);

  const updateTime = useCallback((h, m) => {
    hoursRef.current = h;
    minutesRef.current = m;
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }, [onChange]);

  const handleHourSelect = useCallback((idx) => {
    updateTime(idx, minutesRef.current);
  }, [updateTime]);

  const handleMinuteSelect = useCallback((idx) => {
    updateTime(hoursRef.current, idx);
  }, [updateTime]);

  const handleMinuteSettle = useCallback(() => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => onDone?.(), 800);
  }, [onDone]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return (
    <div className="relative flex items-center justify-center gap-1 py-1">
      <div
        className="absolute left-3 right-3 rounded-lg bg-primary/[0.06] border-y border-primary/20 pointer-events-none"
        style={{ top: '50%', height: ITEM_H, transform: 'translateY(-50%)' }}
      />
      <Wheel items={HOURS} initialIndex={initial[0] || 0} onSelect={handleHourSelect} />
      <span className="text-lg text-muted-foreground font-light z-10 px-0.5">:</span>
      <Wheel items={MINUTES} initialIndex={initial[1] || 0} onSelect={handleMinuteSelect} onSettle={handleMinuteSettle} />
    </div>
  );
}