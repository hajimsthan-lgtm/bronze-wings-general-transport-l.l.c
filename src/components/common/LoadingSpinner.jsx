export default function LoadingSpinner({ size = 'md', className = '' }) {
  const scale = { sm: 0.7, md: 1, lg: 1.3 }[size] || 1;
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="relative" style={{ transform: `scale(${scale})` }}>
        {/* outer rotating gradient ring */}
        <div
          className="w-16 h-16 rounded-full animate-spin"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, rgb(var(--panel-accent-rgb)) 40%, rgb(var(--panel-accent2-rgb)) 70%, transparent 100%)`,
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 4px), #000 calc(100% - 3px))',
          }}
        />
        {/* inner pulsing core */}
        <div
          className="absolute inset-0 m-auto w-6 h-6 rounded-full animate-glow-pulse"
          style={{
            background: 'radial-gradient(circle, rgb(var(--panel-accent-rgb)) 0%, rgb(var(--panel-accent2-rgb)) 100%)',
            boxShadow: '0 0 16px rgba(var(--panel-accent-rgb),0.55)',
          }}
        />
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono">Loading…</p>
    </div>
  );
}