export default function LoadingSpinner({ size = 'md', className = '' }) {
  const scale = { sm: 0.7, md: 1, lg: 1.3 }[size] || 1;
  const Wheel = ({ cx }) => (
    <g className="animate-wheel-spin" style={{ transformOrigin: `${cx}px 49px` }}>
      <circle cx={cx} cy="49" r="6.5" fill="#141414" stroke="rgba(255,255,255,0.20)" strokeWidth="1" />
      <circle cx={cx} cy="49" r="2.6" fill="#3a3a3a" />
      <line x1={cx} y1="44" x2={cx} y2="54" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" />
    </g>
  );
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="relative w-60 h-20 overflow-hidden" style={{ transform: `scale(${scale})` }}>
        {/* ground line */}
        <div className="absolute bottom-4 left-0 right-0 h-px bg-white/10" />
        {/* moving road dashes */}
        <div className="absolute bottom-3 left-0 right-0 h-[3px] animate-road-stripes" style={{ background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.30) 0 16px, transparent 16px 32px)' }} />

        {/* realistic truck driving across */}
        <div className="absolute bottom-3 left-0 animate-truck-drive">
          <svg width="128" height="58" viewBox="0 0 128 58" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 5px 8px rgba(0,0,0,0.45))' }}>
            {/* trailer body */}
            <rect x="2" y="9" width="72" height="35" rx="3" fill="hsl(var(--card))" stroke="rgba(255,255,255,0.16)" />
            <rect x="2" y="9" width="72" height="35" rx="3" fill="url(#boxGrad)" />
            <line x1="38" y1="11" x2="38" y2="42" stroke="rgba(0,0,0,0.28)" strokeWidth="1" />
            <line x1="2" y1="26" x2="74" y2="26" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            {/* cab */}
            <path d="M74 19 L96 19 L103 29 L103 44 L74 44 Z" fill="hsl(var(--primary))" />
            <path d="M74 19 L96 19 L103 29 L96 29 L96 19 Z" fill="rgba(255,255,255,0.16)" />
            {/* windshield */}
            <path d="M84 22 L95 22 L100 29 L84 29 Z" fill="rgba(180,220,255,0.55)" stroke="rgba(0,0,0,0.22)" />
            {/* door line */}
            <line x1="84" y1="30" x2="84" y2="43" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
            {/* bumper + headlight */}
            <rect x="101" y="40" width="6" height="6" rx="1" fill="rgba(255,255,255,0.30)" />
            <circle cx="102" cy="34" r="1.6" fill="rgba(255,240,180,0.9)" />
            {/* chassis */}
            <rect x="6" y="44" width="100" height="5" rx="2" fill="rgba(0,0,0,0.38)" />
            {/* wheels */}
            <Wheel cx="22" />
            <Wheel cx="56" />
            <Wheel cx="93" />
            <defs>
              <linearGradient id="boxGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="rgba(255,255,255,0.10)" />
                <stop offset="1" stopColor="rgba(0,0,0,0.14)" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-mono">Loading…</p>
    </div>
  );
}