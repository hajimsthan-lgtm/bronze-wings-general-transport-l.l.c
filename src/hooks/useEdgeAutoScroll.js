import { useEffect, useRef } from 'react';

/**
 * Edge-triggered auto-scroll for wide overflow containers.
 * On mousemove, if the cursor is within `edgeThreshold`px of the left/right
 * edge, the container smoothly scrolls in that direction — no clicking needed.
 *
 * Usage:
 *   const scrollRef = useEdgeAutoScroll();
 *   <div ref={scrollRef} className="overflow-auto">...</div>
 */
export function useEdgeAutoScroll(enabled = true) {
  const ref = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    let rafId = null;
    let direction = 0;
    const speed = 18;
    const edgeThreshold = 70;

    const tick = () => {
      if (direction !== 0 && el.scrollWidth > el.clientWidth) {
        el.scrollLeft += direction * speed;
        rafId = requestAnimationFrame(tick);
      }
    };

    const stop = () => {
      direction = 0;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;

      if (el.scrollWidth <= el.clientWidth) return;

      if (x < edgeThreshold) {
        direction = -1 * (1 - x / edgeThreshold);
      } else if (x > rect.width - edgeThreshold) {
        direction = 1 * (1 - (rect.width - x) / edgeThreshold);
      } else {
        direction = 0;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }

      if (direction !== 0 && !rafId) {
        rafId = requestAnimationFrame(tick);
      }
    };

    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', stop);

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', stop);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  return ref;
}