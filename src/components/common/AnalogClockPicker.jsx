import { useRef, useEffect, useState } from 'react';

const SIZE = 240;
const C = SIZE / 2;
const DIAL_R = 108;
const NUM_R = 82;
const HAND_R = 72;

export default function AnalogClockPicker({ value, onChange, onDone, variant = 'custom' }) {
  const [mode, setMode] = useState('hour');
  const [hour24, setHour24] = useState(0);
  const [minute, setMinute] = useState(0);
  const [isPM, setIsPM] = useState(false);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef(null);
  const timerRef = useRef(null);
  const typedDigitsRef = useRef('');
  const digitTimerRef = useRef(null);

  // Refs for latest values (avoid stale closures in pointer/keyboard handlers)
  const hour24Ref = useRef(0);
  const minuteRef = useRef(0);
  const isPMRef = useRef(false);
  const modeRef = useRef('hour');
  hour24Ref.current = hour24;
  minuteRef.current = minute;
  isPMRef.current = isPM;
  modeRef.current = mode;

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      setHour24(h || 0);
      setMinute(m || 0);
      setIsPM((h || 0) >= 12);
      hour24Ref.current = h || 0;
      minuteRef.current = m || 0;
      isPMRef.current = (h || 0) >= 12;
    }
  }, []);

  // Auto-focus the clock on mount for keyboard users
  useEffect(() => {
    svgRef.current?.focus();
  }, []);

  useEffect(() => () => {
    clearTimeout(timerRef.current);
    clearTimeout(digitTimerRef.current);
  }, []);

  const displayHour = hour24 % 12 || 12;

  const getAngle = (e) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  const updateFromAngle = (e) => {
    const angle = getAngle(e);
    if (angle == null) return;
    if (modeRef.current === 'hour') {
      const h12 = Math.round(angle / 30) % 12;
      const newHour24 = isPMRef.current ? h12 + 12 : h12;
      setHour24(newHour24);
      hour24Ref.current = newHour24;
      onChange?.(`${String(newHour24).padStart(2, '0')}:${String(minuteRef.current).padStart(2, '0')}`);
    } else {
      const m = Math.round(angle / 6) % 60;
      setMinute(m);
      minuteRef.current = m;
      onChange?.(`${String(hour24Ref.current).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    setDragging(true);
    clearTimeout(timerRef.current);
    try { svgRef.current?.setPointerCapture(e.pointerId); } catch {}
    updateFromAngle(e);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    updateFromAngle(e);
  };

  const handlePointerUp = (e) => {
    if (!dragging) return;
    setDragging(false);
    try { svgRef.current?.releasePointerCapture(e.pointerId); } catch {}
    if (modeRef.current === 'hour') {
      timerRef.current = setTimeout(() => setMode('minute'), 300);
    } else {
      timerRef.current = setTimeout(() => onDone?.(), 400);
    }
  };

  const commitHour = (newH) => {
    setHour24(newH);
    hour24Ref.current = newH;
    const pm = newH >= 12;
    setIsPM(pm);
    isPMRef.current = pm;
    onChange?.(`${String(newH).padStart(2, '0')}:${String(minuteRef.current).padStart(2, '0')}`);
  };

  const commitMinute = (newM) => {
    setMinute(newM);
    minuteRef.current = newM;
    onChange?.(`${String(hour24Ref.current).padStart(2, '0')}:${String(newM).padStart(2, '0')}`);
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        if (modeRef.current === 'hour') {
          commitHour((hour24Ref.current + 23) % 24);
        } else {
          commitMinute((minuteRef.current + 59) % 60);
        }
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        if (modeRef.current === 'hour') {
          commitHour((hour24Ref.current + 1) % 24);
        } else {
          commitMinute((minuteRef.current + 1) % 60);
        }
        break;
      case 'PageUp':
        e.preventDefault();
        if (modeRef.current === 'hour') {
          commitHour((hour24Ref.current + 6) % 24);
        } else {
          commitMinute((minuteRef.current + 10) % 60);
        }
        break;
      case 'PageDown':
        e.preventDefault();
        if (modeRef.current === 'hour') {
          commitHour((hour24Ref.current + 18) % 24);
        } else {
          commitMinute((minuteRef.current + 50) % 60);
        }
        break;
      case 'Home':
        e.preventDefault();
        if (modeRef.current === 'hour') commitHour(0);
        else commitMinute(0);
        break;
      case 'End':
        e.preventDefault();
        if (modeRef.current === 'hour') commitHour(23);
        else commitMinute(59);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (modeRef.current === 'hour') {
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setMode('minute'), 200);
        } else {
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => onDone?.(), 200);
        }
        break;
      default:
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          typedDigitsRef.current += e.key;
          clearTimeout(digitTimerRef.current);
          digitTimerRef.current = setTimeout(() => { typedDigitsRef.current = ''; }, 800);
          if (modeRef.current === 'hour') {
            const num = parseInt(typedDigitsRef.current, 10);
            if (num >= 1 && num <= 12) {
              const h12 = num % 12;
              commitHour(isPMRef.current ? h12 + 12 : h12);
            } else if (num > 12) {
              typedDigitsRef.current = e.key;
              const num2 = parseInt(e.key, 10);
              if (num2 >= 1 && num2 <= 9) {
                const h12 = num2 % 12;
                commitHour(isPMRef.current ? h12 + 12 : h12);
              }
            }
          } else {
            const num = parseInt(typedDigitsRef.current, 10);
            if (num >= 0 && num <= 59) {
              commitMinute(num);
            } else if (num > 59) {
              typedDigitsRef.current = e.key;
              const num2 = parseInt(e.key, 10);
              if (num2 >= 0 && num2 <= 5) commitMinute(num2);
            }
          }
        }
        break;
    }
  };

  // Hand position
  const handAngle = mode === 'hour' ? (hour24 % 12) * 30 : minute * 6;
  const handRad = (handAngle - 90) * Math.PI / 180;
  const handX = C + HAND_R * Math.cos(handRad);
  const handY = C + HAND_R * Math.sin(handRad);

  // Numbers
  const numbers = mode === 'hour'
    ? Array.from({ length: 12 }, (_, i) => ({ value: i + 1, angle: (i + 1) * 30 }))
    : Array.from({ length: 12 }, (_, i) => ({ value: i * 5, angle: i * 30 }));

  const isCustom = variant === 'custom';

  return (
    <div className="flex flex-col items-center gap-2 py-1">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-primary/80">
        {mode === 'hour' ? 'Select Hour' : 'Select Minute'}
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-[200px] h-[200px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded-full"
        style={{ touchAction: 'none' }}
        tabIndex={0}
        role="slider"
        aria-valuenow={mode === 'hour' ? hour24 : minute}
        aria-valuemin={0}
        aria-valuemax={mode === 'hour' ? 23 : 59}
        aria-label={mode === 'hour' ? 'Hour' : 'Minute'}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <defs>
          <radialGradient id={`dial-${variant}`} cx="50%" cy="40%">
            <stop offset="0%" stopColor="hsl(var(--card))" />
            <stop offset="100%" stopColor="hsl(var(--background-elevated))" />
          </radialGradient>
          <linearGradient id={`hand-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary-light))" />
          </linearGradient>
          {isCustom && (
            <filter id={`glow-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Dial */}
        <circle
          cx={C} cy={C} r={DIAL_R}
          fill={isCustom ? `url(#dial-${variant})` : 'hsl(var(--card))'}
          stroke={isCustom ? 'rgba(var(--panel-accent-rgb), 0.25)' : 'hsl(var(--border))'}
          strokeWidth="1.5"
        />

        {/* Tick marks */}
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i * 6 - 90) * Math.PI / 180;
          const major = i % 5 === 0;
          const r1 = DIAL_R - (major ? 12 : 6);
          const r2 = DIAL_R - 2;
          return (
            <line
              key={i}
              x1={C + r1 * Math.cos(a)} y1={C + r1 * Math.sin(a)}
              x2={C + r2 * Math.cos(a)} y2={C + r2 * Math.sin(a)}
              stroke={major ? 'hsl(var(--muted-foreground))' : 'hsl(var(--border))'}
              strokeWidth={major ? 1.5 : 1}
              opacity={major ? 0.5 : 0.25}
            />
          );
        })}

        {/* Numbers */}
        <g key={mode} style={{ animation: 'fadeIn 0.25s ease both' }}>
          {numbers.map(({ value, angle }) => {
            const rad = (angle - 90) * Math.PI / 180;
            const x = C + NUM_R * Math.cos(rad);
            const y = C + NUM_R * Math.sin(rad);
            const isSelected = mode === 'hour' ? value === displayHour : value === minute;
            return (
              <text
                key={value}
                x={x} y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isSelected ? '16' : '13'}
                fontWeight={isSelected ? '700' : '400'}
                fill={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'}
                style={isCustom && isSelected ? { filter: 'drop-shadow(0 0 3px hsl(var(--primary)))' } : {}}
              >
                {mode === 'minute' ? String(value).padStart(2, '0') : value}
              </text>
            );
          })}
        </g>

        {/* Hand */}
        <line
          x1={C} y1={C} x2={handX} y2={handY}
          stroke={isCustom ? `url(#hand-${variant})` : 'hsl(var(--primary))'}
          strokeWidth={isCustom ? 3 : 2.5}
          strokeLinecap="round"
          filter={isCustom ? `url(#glow-${variant})` : undefined}
        />
        {/* Center dot */}
        <circle cx={C} cy={C} r={isCustom ? 6 : 5} fill="hsl(var(--primary))" />
        <circle cx={C} cy={C} r={isCustom ? 2.5 : 2} fill="hsl(var(--background))" />
      </svg>

      {/* AM/PM toggle — hour mode only */}
      {mode === 'hour' && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setIsPM(false);
              const newH = hour24Ref.current % 12;
              setHour24(newH);
              hour24Ref.current = newH;
              onChange?.(`${String(newH).padStart(2, '0')}:${String(minuteRef.current).padStart(2, '0')}`);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !isPM ? 'bg-primary/20 border border-primary/40 text-primary' : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPM(true);
              const newH = (hour24Ref.current % 12) + 12;
              setHour24(newH);
              hour24Ref.current = newH;
              onChange?.(`${String(newH).padStart(2, '0')}:${String(minuteRef.current).padStart(2, '0')}`);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isPM ? 'bg-primary/20 border border-primary/40 text-primary' : 'border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            PM
          </button>
        </div>
      )}
    </div>
  );
}