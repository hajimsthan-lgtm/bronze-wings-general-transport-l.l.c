/**
 * Floating Action Button — mobile only.
 * Scroll-aware: dims while scrolling, brightens immediately when scroll stops.
 * Usage: <MobileFAB icon={Plus} onClick={() => setOpen(true)} label="New Trip" />
 */
import { useState, useEffect, useRef } from 'react';

export default function MobileFAB({ icon: Icon, onClick, label = 'Add', color, className = '' }) {
  const [scrolling, setScrolling] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      if (!scrolling) setScrolling(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setScrolling(false), 150);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scrolling]);

  if (!Icon) return null;

  return (
    <button
      className={`md:hidden fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-all duration-200 ${className}`}
      onClick={onClick}
      aria-label={label}
      style={{
        background: color || 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        boxShadow: '0 8px 28px rgba(0,0,0,0.30), 0 0 0 1px rgba(var(--panel-accent-rgb),0.20)',
        opacity: scrolling ? 0.45 : 1,
        transform: scrolling ? 'scale(0.92)' : 'scale(1)',
      }}
    >
      <Icon className="w-6 h-6" strokeWidth={2.4} />
    </button>
  );
}