import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Progressive rendering hook — keeps the DOM small when a list grows large.
 * Returns only the first `visibleCount` items; an IntersectionObserver on the
 * sentinel ref loads the next batch when the user scrolls near the bottom.
 *
 * Usage:
 *   const { visible, sentinelRef, sentinelProps, hasMore } = useProgressiveRender(items);
 *   return <>
 *     {visible.map(...)}
 *     {hasMore && <div ref={sentinelRef} {...sentinelProps}>Loading more…</div>}
 *   </>
 *
 * @param {Array} items     full array (filtered/sorted)
 * @param {number} pageSize rows per batch (default 50)
 * @param {React.Ref} scrollRoot optional scroll container for the IO root
 */
export function useProgressiveRender(items, pageSize = 50, scrollRoot = null) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef(null);

  // Reset to first page whenever the source array reference changes
  useEffect(() => { setVisibleCount(pageSize); }, [items, pageSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount((c) => c + pageSize); },
      { root: scrollRoot && scrollRoot.current ? scrollRoot.current : null, rootMargin: '300px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [items, pageSize, scrollRoot]);

  const visible = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  // Props to spread on the sentinel element
  const sentinelProps = {
    ref: sentinelRef,
    role: 'status',
    'aria-label': hasMore ? `Loading more, ${visibleCount} of ${items.length}` : `All ${items.length} loaded`,
  };

  return { visible, sentinelRef, sentinelProps, hasMore, visibleCount, totalCount: items.length };
}

export default useProgressiveRender;