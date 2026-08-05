import HeartbeatLoader from './HeartbeatLoader';

export default function LoadingSpinner({ size = 'md', className = '', color = 'violet' }) {
  const scaleMap = { sm: 0.8, md: 1, lg: 1.15 };
  const scale = scaleMap[size] || 1;
  return (
    <div
      className={`flex flex-col items-center justify-center py-10 px-4 w-full ${className}`}
      style={{
        position: 'relative',
        zIndex: 9999,
        isolation: 'isolate',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
      }}
    >
      <div style={{ transform: `scale(${scale})`, backdropFilter: 'none', WebkitBackdropFilter: 'none' }}>
        <HeartbeatLoader color={color} />
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono">Loading…</p>
    </div>
  );
}