import { Star } from 'lucide-react';

export default function FleetStars({ value = 0, size = 14, className = '' }) {
  const full = Math.round(value);
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={i < full ? 'text-amber-400 fill-amber-400' : 'text-white/20'}
          style={{ width: size, height: size }}
        />
      ))}
    </div>
  );
}