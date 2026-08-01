export default function LoadingSpinner({ size = 'md', className = '' }) {
  const scale = { sm: 0.7, md: 1, lg: 1.3 }[size] || 1;
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="relative" style={{ transform: `scale(${scale})` }}>
        {/* outer ring — spins very fast */}
        <div
          className="w-12 h-12 rounded-full"
          style={{
            animation: 'spin 0.45s linear infinite',
            background: `conic-gradient(from 0deg, transparent 0%, rgb(var(--panel-accent-rgb)) 30%, rgb(var(--panel-accent2-rgb)) 60%, transparent 100%)`,
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))',
          }}
        />
        {/* inner ring — counter-spin, even faster */}
        <div
          className="absolute inset-0 m-auto w-7 h-7 rounded-full"
          style={{
            animation: 'spin 0.3s linear infinite reverse',
            background: `conic-gradient(from 180deg, transparent 0%, rgb(var(--panel-accent2-rgb)) 40%, rgb(var(--panel-accent-rgb)) 70%, transparent 100%)`,
            WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px))',
          }}
        />
        {/* center dot pulse */}
        <div
          className="absolute inset-0 m-auto w-2 h-2 rounded-full animate-glow-pulse"
          style={{ background: 'rgb(var(--panel-accent2-rgb))', boxShadow: '0 0 10px rgba(var(--panel-accent-rgb),0.7)' }}
        />
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono">Loading…</p>
    </div>
  );
}