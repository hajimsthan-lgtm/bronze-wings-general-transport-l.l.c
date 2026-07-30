import { Truck } from 'lucide-react';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const scale = { sm: 0.7, md: 1, lg: 1.3 }[size] || 1;
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="relative w-52 h-16 overflow-hidden" style={{ transform: `scale(${scale})` }}>
        {/* road */}
        <div
          className="absolute bottom-3 left-0 right-0 h-[3px] animate-road-stripes"
          style={{ background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.32) 0 14px, transparent 14px 28px)' }}
        />
        {/* truck driving across & going big */}
        <div className="absolute bottom-3 left-0 animate-truck-go-big">
          <Truck
            className="w-10 h-10"
            style={{ color: 'hsl(var(--primary))', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))' }}
          />
        </div>
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono">Loading…</p>
    </div>
  );
}