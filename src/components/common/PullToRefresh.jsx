import { useState, useRef, useCallback, useEffect } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';

const MAX_PULL = 90;       // strict boundary — pull clamps here
const TRIGGER = 55;         // threshold to activate refresh
const RESISTANCE = 0.42;    // rubber-band resistance factor

/**
 * Strict-boundary pull-to-refresh.
 * Wraps page content inside the unified scroll container.
 * Dispatches a `global:refresh` window event so any page can re-fetch.
 */
export default function PullToRefresh({ onRefresh, children, className = '' }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const wrapRef = useRef(null);
  const scrollElRef = useRef(null);

  // Find the nearest scrollable ancestor (the unified <main> container)
  const findScrollEl = useCallback(() => {
    let el = wrapRef.current?.parentElement;
    while (el) {
      const ov = window.getComputedStyle(el).overflowY;
      if (ov === 'auto' || ov === 'scroll') return el;
      el = el.parentElement;
    }
    return null;
  }, []);

  const scrollTop = () => scrollElRef.current?.scrollTop ?? window.scrollY;

  const onTouchStart = (e) => {
    if (refreshing) return;
    scrollElRef.current = findScrollEl();
    if (scrollTop() <= 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    } else {
      pulling.current = false;
    }
  };

  const onTouchMove = (e) => {
    if (!pulling.current || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) {
      // Strict boundary — clamp with rubber-band resistance
      const eased = Math.min(diff * RESISTANCE, MAX_PULL);
      setPull(eased);
      // Prevent native scroll bounce while pulling
      if (e.cancelable) e.preventDefault();
    }
  };

  const onTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pull >= TRIGGER) {
      setRefreshing(true);
      setPull(TRIGGER);
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          // Global refresh — let any page listener re-fetch
          window.dispatchEvent(new CustomEvent('global:refresh'));
          await new Promise((r) => setTimeout(r, 900));
        }
      } catch {}
      setRefreshing(false);
    }
    setPull(0);
  };

  // Cleanup on unmount
  useEffect(() => () => { pulling.current = false; }, []);

  const progress = Math.min(pull / TRIGGER, 1);
  const showArrow = !refreshing && pull > 4;

  return (
    <div
      ref={wrapRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className={className}
      style={{ willChange: 'transform' }}
    >
      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: pulling.current ? 'none' : 'transform 0.28s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        {/* Strict-boundary indicator — glass orb with progress fill */}
        <div
          className="flex justify-center overflow-hidden transition-opacity"
          style={{ height: pull, opacity: pull > 0 || refreshing ? 1 : 0 }}
        >
          <div
            className="mt-2 flex items-center justify-center rounded-full transition-all duration-300"
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, rgba(var(--panel-accent-rgb),0.22), rgba(var(--surf-2-rgb),0.85))',
              border: '1px solid rgba(var(--panel-accent-rgb),0.35)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              transform: `scale(${0.7 + progress * 0.3}) rotate(${refreshing ? 0 : progress * 180}deg)`,
            }}
          >
            {refreshing ? (
              <RefreshCw className="w-4 h-4 text-primary animate-spin" strokeWidth={2.5} />
            ) : showArrow ? (
              <ArrowDown
                className="w-4 h-4 transition-colors"
                style={{
                  color: progress >= 1 ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.5)',
                  transform: `rotate(${progress >= 1 ? 180 : 0}deg)`,
                  transition: 'transform 0.2s ease, color 0.2s ease',
                }}
                strokeWidth={2.5}
              />
            ) : null}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}