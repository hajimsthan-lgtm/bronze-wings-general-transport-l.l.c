import { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const wrapRef = useRef(null);

  // Detect the nearest scroll container so pull-to-refresh only fires at its top
  const scrollTop = () => {
    let el = wrapRef.current?.parentElement;
    while (el) {
      const ov = window.getComputedStyle(el).overflowY;
      if (ov === 'auto' || ov === 'scroll') return el.scrollTop;
      el = el.parentElement;
    }
    return window.scrollY;
  };

  const onTouchStart = (e) => {
    if (scrollTop() <= 0 && !refreshing) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  };

  const onTouchMove = (e) => {
    if (!pulling.current || refreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0) setPull(Math.min(diff * 0.4, 70));
  };

  const onTouchEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pull > 50) {
      setRefreshing(true);
      setPull(40);
      try { await onRefresh?.(); } catch {}
      setRefreshing(false);
    }
    setPull(0);
  };

  return (
    <div ref={wrapRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: pulling.current ? 'none' : 'transform 0.2s ease',
        }}
      >
        <div className="flex justify-center overflow-hidden" style={{ height: pull }}>
          <RefreshCw className={`text-primary mt-2 ${refreshing ? 'animate-spin' : ''}`} size={20} />
        </div>
        {children}
      </div>
    </div>
  );
}