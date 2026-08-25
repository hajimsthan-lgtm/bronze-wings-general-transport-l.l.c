export default function Section({ title, icon: Icon, accent = '148,163,184', delay = 0, children }) {
  return (
    <div
      className="trip-section animate-stagger-in"
      style={{ '--section-accent': accent, animationDelay: `${delay}ms`, overflow: 'visible', zIndex: 1 }}
    >
      <div className="flex items-center gap-2.5 mb-3">
        {Icon && (
          <span className="trip-section-icon">
            <Icon className="w-4 h-4" />
          </span>
        )}
        <p className="text-[11px] text-white/70 uppercase tracking-wider font-semibold">{title}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}