import { useEffect, useRef, useState } from 'react';

/**
 * Smooth requestAnimationFrame count-up. Ends at the exact target value,
 * so underlying data is never altered — only the entrance is animated.
 */
export default function CountUp({
  value = 0,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}) {
  const target = Number(value) || 0;
  const [display, setDisplay] = useState(0);
  const raf = useRef();
  const startTs = useRef();

  useEffect(() => {
    if (target === 0) {
      setDisplay(0);
      return;
    }
    startTs.current = null;
    const step = (ts) => {
      if (startTs.current == null) startTs.current = ts;
      const p = Math.min((ts - startTs.current) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      setDisplay(target * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  const text = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();
  return <span className={className}>{prefix}{text}{suffix}</span>;
}