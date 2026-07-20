import { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = (e) => {
    if (window.scrollY <= 0 && !refreshing) {
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
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
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