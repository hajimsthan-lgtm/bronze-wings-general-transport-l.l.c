/**
 * LoadingSkeleton — shimmer skeleton blocks used as the default page loader.
 * `layout` controls the shape so the skeleton matches the real content:
 *   - 'grid'  (default): card grid (entity cards)
 *   - 'list':            horizontal rows (list-row views)
 *   - 'stats':           KPI tiles + chart block (analytics views)
 * Pass `rows` to control how many skeleton items to show (default 6).
 */
export default function LoadingSkeleton({ rows = 6, layout = 'grid', className = '' }) {
  if (layout === 'list') {
    return (
      <div className={`w-full space-y-2 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 border border-border/50 bg-card/40 flex items-center gap-3 overflow-hidden"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="w-10 h-10 rounded-xl shimmer-bg animate-shimmer flex-shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-3 w-1/3 rounded-full shimmer-bg animate-shimmer" />
              <div className="h-2.5 w-1/2 rounded-full shimmer-bg animate-shimmer" />
            </div>
            <div className="hidden md:block w-28 space-y-2 flex-shrink-0">
              <div className="h-2.5 w-full rounded-full shimmer-bg animate-shimmer" />
              <div className="h-2.5 w-2/3 ml-auto rounded-full shimmer-bg animate-shimmer" />
            </div>
            <div className="w-14 h-3 rounded-full shimmer-bg animate-shimmer flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (layout === 'stats') {
    return (
      <div className={`w-full ${className}`}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 border border-border/50 bg-card/40"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="h-3 w-16 rounded-full shimmer-bg animate-shimmer mb-3" />
              <div className="h-7 w-24 rounded-full shimmer-bg animate-shimmer mb-2" />
              <div className="h-2.5 w-12 rounded-full shimmer-bg animate-shimmer" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-6 border border-border/50 bg-card/40 h-64 overflow-hidden">
          <div className="h-3 w-24 rounded-full shimmer-bg animate-shimmer mb-4" />
          <div className="h-48 w-full rounded-xl shimmer-bg animate-shimmer opacity-50" />
        </div>
      </div>
    );
  }

  // grid (default)
  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 border border-border/50 bg-card/40 overflow-hidden"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl shimmer-bg animate-shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded-full shimmer-bg animate-shimmer" />
                <div className="h-2.5 w-1/2 rounded-full shimmer-bg animate-shimmer" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-2.5 w-full rounded-full shimmer-bg animate-shimmer" />
              <div className="h-2.5 w-4/5 rounded-full shimmer-bg animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}