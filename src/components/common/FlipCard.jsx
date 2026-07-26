import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function FlipCard({ front, back, className = '' }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className={`relative ${className}`} style={{ perspective: '1800px' }}>
      <div
        className="relative w-full transition-transform duration-700"
        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)' }}
      >
        <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>{front}</div>
        <div
          className="absolute inset-0 overflow-y-auto thin-scroll"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {back}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        title="Flip card"
        className="absolute top-3 right-3 z-20 w-9 h-9 rounded-xl bg-white/5 border border-white/10 backdrop-blur text-foreground hover:bg-white/10 flex items-center justify-center transition-colors active:scale-95"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
}