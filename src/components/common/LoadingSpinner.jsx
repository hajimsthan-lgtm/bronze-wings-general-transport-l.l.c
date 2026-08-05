import HeartbeatLoader from './HeartbeatLoader';

export default function LoadingSpinner({ size = 'md', className = '', color = 'violet' }) {
  const heightMap = { sm: '50px', md: '80px', lg: '110px' };
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 w-full ${className}`}>
      <div style={{ width: '100%', maxWidth: '420px', height: heightMap[size] || '80px' }}>
        <HeartbeatLoader color={color} />
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono">Loading…</p>
    </div>
  );
}