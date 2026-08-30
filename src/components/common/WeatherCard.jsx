import { Cloud } from 'lucide-react';

export default function WeatherCard({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl p-4 text-white ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.30) 0%, rgba(168,85,247,0.20) 50%, rgba(var(--surf-2-rgb),0.70) 100%)',
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-violet-500/30 blur-3xl pointer-events-none" />
      <div className="relative flex items-center gap-3">
        <Cloud className="w-8 h-8 text-white/80" />
        <div>
          <p className="text-3xl font-bold leading-none">21°</p>
          <p className="text-xs opacity-70 mt-1">Partly cloudy</p>
        </div>
      </div>
    </div>
  );
}