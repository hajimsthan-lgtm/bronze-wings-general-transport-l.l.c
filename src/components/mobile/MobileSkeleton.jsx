/**
 * Skeleton loading placeholders — mobile only.
 * Usage: <MobileSkeleton type="stat" count={4} /> or <MobileSkeleton type="list" count={5} />
 */
export default function MobileSkeleton({ type = 'card', count = 3, className = '' }) {
  if (type === 'stat') {
    return (
      <div className={`md:hidden flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[150px] h-[110px] rounded-2xl bg-muted/30 skel-block" />
        ))}
      </div>
    );
  }
  if (type === 'list') {
    return (
      <div className={`md:hidden space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-muted/30 skel-block" />
        ))}
      </div>
    );
  }
  return (
    <div className={`md:hidden space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-muted/30 skel-block" />
      ))}
    </div>
  );
}