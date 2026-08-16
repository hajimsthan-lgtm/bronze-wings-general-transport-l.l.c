/**
 * Floating Action Button — mobile only.
 * Renders fixed bottom-right, above the bottom nav.
 * Usage: <MobileFAB icon={Plus} onClick={() => setOpen(true)} label="New Trip" />
 */
export default function MobileFAB({ icon: Icon, onClick, label = 'Add', color, className = '' }) {
  if (!Icon) return null;
  return (
    <button
      className={`md:hidden fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform duration-150 ${className}`}
      onClick={onClick}
      aria-label={label}
      style={{
        background: color || 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        boxShadow: '0 8px 28px rgba(0,0,0,0.30), 0 0 0 1px rgba(var(--panel-accent-rgb),0.20)',
      }}
    >
      <Icon className="w-6 h-6" strokeWidth={2.4} />
    </button>
  );
}