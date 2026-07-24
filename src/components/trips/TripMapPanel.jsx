import { useState, useEffect } from 'react';
import { Navigation, MapPin } from 'lucide-react';

export default function TripMapPanel({ from, to }) {
  const [route, setRoute] = useState({ from, to });

  // Debounce so the iframe doesn't reload on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setRoute({ from, to }), 450);
    return () => clearTimeout(id);
  }, [from, to]);

  const hasRoute = route.from && route.to;
  const src = hasRoute
    ? `https://www.google.com/maps?saddr=${encodeURIComponent(route.from)}&daddr=${encodeURIComponent(route.to)}&output=embed`
    : `https://www.google.com/maps?q=Dubai&output=embed`;

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Route Map</span>
        </div>
        {hasRoute ? (
          <span className="text-[11px] text-muted-foreground truncate max-w-[60%]">
            <span className="text-primary/80">{route.from}</span> → <span className="text-emerald-400/80">{route.to}</span>
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Enter both locations
          </span>
        )}
      </div>
      <iframe
        title="Trip Route Map"
        src={src}
        className="w-full h-[260px] border-0 block"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}