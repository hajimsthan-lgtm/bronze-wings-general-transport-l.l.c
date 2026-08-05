export default function LoadingSpinner({ size = 'md', className = '' }) {
  const scale = { sm: 0.7, md: 1, lg: 1.3 }[size] || 1;
  const colors = [
    { c: '#a855f7', label: 'violet' },
    { c: '#f43f5e', label: 'red' },
    { c: '#10b981', label: 'green' },
    { c: '#f5c542', label: 'yellow' },
  ];
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="relative" style={{ transform: `scale(${scale})`, width: '56px', height: '56px' }}>
        {/* Four color dots — heart-pulse rhythm, each staggered */}
        {colors.map((col, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: '50%',
              left: '50%',
              width: '14px',
              height: '14px',
              margin: '-7px 0 0 -7px',
              background: col.c,
              boxShadow: `0 0 8px ${col.c}, 0 0 20px ${col.c}66`,
              transform: 'translate(0,0)',
              animation: `heart-pulse-${i} 1.4s ease-in-out infinite`,
            }}
          />
        ))}
        {/* ECG-style trace ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '1.5px solid rgba(var(--panel-accent-rgb),0.18)',
            animation: 'heart-ring 1.4s ease-out infinite',
          }}
        />
      </div>
      <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono">Loading…</p>
      <style>{`
        @keyframes heart-pulse-0 {
          0%, 100% { transform: translate(0,0) scale(0.4); opacity: 0.3; }
          8% { transform: translate(0,0) scale(1.3); opacity: 1; }
          16% { transform: translate(0,0) scale(0.7); opacity: 0.5; }
          24% { transform: translate(0,0) scale(1.0); opacity: 0.8; }
          32% { transform: translate(0,0) scale(0.4); opacity: 0.3; }
        }
        @keyframes heart-pulse-1 {
          0%, 100% { transform: translate(0,0) scale(0.4); opacity: 0.3; }
          8% { transform: translate(0,0) scale(0.4); opacity: 0.3; }
          16% { transform: translate(0,0) scale(0.4); opacity: 0.3; }
          24% { transform: translate(0,0) scale(0.4); opacity: 0.3; }
          32% { transform: translate(0,0) scale(1.3); opacity: 1; }
          40% { transform: translate(0,0) scale(0.7); opacity: 0.5; }
          48% { transform: translate(0,0) scale(1.0); opacity: 0.8; }
          56% { transform: translate(0,0) scale(0.4); opacity: 0.3; }
        }
        @keyframes heart-pulse-2 {
          0%, 100% { transform: translate(0,0) scale(0.4); opacity: 0.3; }
          40% { transform: translate(0,0) scale(0.4); opacity: 0.3; }
          48% { transform: translate(0,0) scale(1.3); opacity: 1; }
          56% { transform: translate(0,0) scale(0.7); opacity: 0.5; }
          64% { transform: translate(0,0) scale(1.0); opacity: 0.8; }
          72% { transform: translate(0,0) scale(0.4); opacity: 0.3; }
        }
        @keyframes heart-pulse-3 {
          0%, 100% { transform: translate(0,0) scale(0.4); opacity: 0.3; }
          56% { transform: translate(0,0) scale(0.4); opacity: 0.3; }
          64% { transform: translate(0,0) scale(1.3); opacity: 1; }
          72% { transform: translate(0,0) scale(0.7); opacity: 0.5; }
          80% { transform: translate(0,0) scale(1.0); opacity: 0.8; }
          88% { transform: translate(0,0) scale(0.4); opacity: 0.3; }
        }
        @keyframes heart-ring {
          0% { transform: scale(0.8); opacity: 0.6; }
          30% { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}