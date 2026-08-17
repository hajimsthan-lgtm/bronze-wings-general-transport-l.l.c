import { useRef, useEffect, useState, useCallback } from 'react';

const ITEM_H = 38;
const VISIBLE = 5;
const WHEEL_H = ITEM_H * VISIBLE;
const PAD = ITEM_H * 2;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function Wheel({ items, initialIndex, onSelect, onSettle, autoFocus, ariaLabel }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const [selected, setSelected] = useState(initialIndex);
  const typedDigits = useRef('');
  const digitTimer = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = initialIndex * ITEM_H;
    }
    if (autoFocus && ref.current) {
      ref.current.focus();
    }
  }, []); // eslint-disable-line

  useEffect(() => () => {
    clearTimeout(timer.current);
    clearTimeout(digitTimer.current);
  }, []);

  const scrollToIdx = (idx) => {
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    if (clamped !== selected) {
      setSelected(clamped);
      ref.current?.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' });
      onSelect(clamped);
    }
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        scrollToIdx(selected - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        scrollToIdx(selected + 1);
        break;
      case 'PageUp':
        e.preventDefault();
        scrollToIdx(selected - 5);
        break;
      case 'PageDown':
        e.preventDefault();
        scrollToIdx(selected + 5);
        break;
      case 'Home':
        e.preventDefault();
        scrollToIdx(0);
        break;
      case 'End':
        e.preventDefault();
        scrollToIdx(items.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        onSettle?.();
        break;
      default:
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          typedDigits.current += e.key;
          clearTimeout(digitTimer.current);
          digitTimer.current = setTimeout(() => { typedDigits.current = ''; }, 800);
          const num = parseInt(typedDigits.current, 10);
          if (num >= 0 && num < items.length) {
            scrollToIdx(num);
          } else if (num >= items.length) {
            typedDigits.current = e.key;
            const num2 = parseInt(e.key, 10);
            if (num2 < items.length) scrollToIdx(num2);
          }
        }
        break;
    }
  };

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
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="spinbutton"
      aria-valuenow={selected}
      aria-valuemin={0}
      aria-valuemax={items.length - 1}
      aria-label={ariaLabel}
      className="overflow-y-scroll no-scrollbar relative z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-lg"
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
      <Wheel items={HOURS} initialIndex={initial[0] || 0} onSelect={handleHourSelect} autoFocus ariaLabel="Hour" />
      <span className="text-lg text-muted-foreground font-light z-10 px-0.5">:</span>
      <Wheel items={MINUTES} initialIndex={initial[1] || 0} onSelect={handleMinuteSelect} onSettle={handleMinuteSettle} ariaLabel="Minute" />
    </div>
  );
}