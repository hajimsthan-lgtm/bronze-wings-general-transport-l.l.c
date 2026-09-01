/**
 * LoadingSkeleton — shimmer skeleton blocks used as the default page loader
 * across the app (replaces the round spinner). Renders a responsive grid of
 * pulsing cards so the layout is perceived instantly while data loads.
 *
 * Pass `rows` to control how many skeleton cards to show (default 6).
 */
export default function LoadingSkeleton({ rows = 6, className = '' }) {
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