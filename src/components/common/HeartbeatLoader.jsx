import { useEffect } from 'react';

const COLORS = ['violet', 'green', 'red', 'yellow', 'blue', 'bronze'];

let injected = false;
function injectStyles() {
  if (injected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-hb-compact', 'true');
  style.textContent = `
    .lorry-loader {
      position: relative;
      width: 280px;
      height: 72px;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      user-select: none;
      overflow: hidden;
    }
    .lorry-scene {
      position: relative;
      width: 100%;
      height: 100%;
    }
    /* ===== Road ===== */
    .lorry-road {
      position: absolute;
      left: 0; right: 0;
      bottom: 8px;
      height: 2px;
      background: hsl(var(--border));
      border-radius: 2px;
      overflow: hidden;
    }
    .lorry-road::before {
      content: '';
      position: absolute;
      left: 0; top: -1px;
      width: 200%;
      height: 4px;
      background-image: repeating-linear-gradient(
        90deg,
        transparent 0,
        transparent 10px,
        hsl(var(--muted-foreground)) 10px,
        hsl(var(--muted-foreground)) 22px
      );
      opacity: 0.35;
      animation: lorry-road-move 0.5s linear infinite;
    }
    @keyframes lorry-road-move {
      from { transform: translateX(0); }
      to   { transform: translateX(-22px); }
    }
    /* ===== Truck body — drives across the scene ===== */
    .lorry-truck {
      position: absolute;
      bottom: 10px;
      left: -130px;
      width: 120px;
      height: 52px;
      animation: lorry-drive 2.6s linear infinite, lorry-bob 0.35s ease-in-out infinite alternate;
    }
    @keyframes lorry-drive {
      0%   { left: -130px; }
      100% { left: 100%; }
    }
    @keyframes lorry-bob {
      from { transform: translateY(0); }
      to   { transform: translateY(-1.5px); }
    }
    .lorry-truck svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    /* ===== Wheels ===== */
    .lorry-wheel {
      animation: lorry-wheel-spin 0.45s linear infinite;
      transform-origin: center;
    }
    @keyframes lorry-wheel-spin {
      to { transform: rotate(360deg); }
    }
    /* ===== Exhaust puffs — trail from the exhaust stack ===== */
    .lorry-smoke {
      position: absolute;
      bottom: 30px;
      left: -20px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: hsl(var(--muted-foreground));
      opacity: 0;
      animation: lorry-puff 2.6s ease-out infinite;
    }
    .lorry-smoke:nth-child(1) { animation-delay: 0.3s; }
    .lorry-smoke:nth-child(2) { animation-delay: 1.1s; }
    .lorry-smoke:nth-child(3) { animation-delay: 1.9s; }
    @keyframes lorry-puff {
      0%   { opacity: 0; transform: translate(0, 0) scale(0.3); }
      10%  { opacity: 0.3; }
      100% { opacity: 0; transform: translate(-28px, -26px) scale(2); }
    }
    /* ===== Color variants ===== */
    .lorry-loader.lorry-violet .lorry-truck svg path,
    .lorry-loader.lorry-violet .lorry-truck svg rect { fill: #a855f7; }
    .lorry-loader.lorry-violet .lorry-truck svg circle { fill: #1a1a1a; }
    .lorry-loader.lorry-violet .lorry-wheel-ring { stroke: #a855f7; }

    .lorry-loader.lorry-green .lorry-truck svg path,
    .lorry-loader.lorry-green .lorry-truck svg rect { fill: #10b981; }
    .lorry-loader.lorry-green .lorry-truck svg circle { fill: #1a1a1a; }
    .lorry-loader.lorry-green .lorry-wheel-ring { stroke: #10b981; }

    .lorry-loader.lorry-red .lorry-truck svg path,
    .lorry-loader.lorry-red .lorry-truck svg rect { fill: #ef4444; }
    .lorry-loader.lorry-red .lorry-truck svg circle { fill: #1a1a1a; }
    .lorry-loader.lorry-red .lorry-wheel-ring { stroke: #ef4444; }

    .lorry-loader.lorry-yellow .lorry-truck svg path,
    .lorry-loader.lorry-yellow .lorry-truck svg rect { fill: #f59e0b; }
    .lorry-loader.lorry-yellow .lorry-truck svg circle { fill: #1a1a1a; }
    .lorry-loader.lorry-yellow .lorry-wheel-ring { stroke: #f59e0b; }

    .lorry-loader.lorry-blue .lorry-truck svg path,
    .lorry-loader.lorry-blue .lorry-truck svg rect { fill: #3b82f6; }
    .lorry-loader.lorry-blue .lorry-truck svg circle { fill: #1a1a1a; }
    .lorry-loader.lorry-blue .lorry-wheel-ring { stroke: #3b82f6; }

    .lorry-loader.lorry-bronze .lorry-truck svg path,
    .lorry-loader.lorry-bronze .lorry-truck svg rect { fill: #B8463A; }
    .lorry-loader.lorry-bronze .lorry-truck svg circle { fill: #1a1a1a; }
    .lorry-loader.lorry-bronze .lorry-wheel-ring { stroke: #B8463A; }

    @media (prefers-reduced-motion: reduce) {
      .lorry-truck, .lorry-wheel, .lorry-smoke, .lorry-road::before { animation: none !important; }
    }
  `;
  document.head.appendChild(style);
  injected = true;
}

/**
 * Lorry driving loader — a truck with spinning wheels on a moving road.
 * Same API as the previous heartbeat loader (drop-in replacement).
 * @param {string} color - one of: violet, green, red, yellow, blue (default), bronze
 */
export default function HeartbeatLoader({ color = 'blue', className = '' }) {
  useEffect(() => { injectStyles(); }, []);
  const safeColor = COLORS.includes(color) ? color : 'blue';

  return (
    <div className={`lorry-loader lorry-${safeColor} ${className}`}>
      <div className="lorry-scene">
        <div className="lorry-road" />
        <div className="lorry-smoke" />
        <div className="lorry-smoke" />
        <div className="lorry-smoke" />
        <div className="lorry-truck">
          <svg viewBox="0 0 120 52" preserveAspectRatio="xMidYMid meet">
            {/* ===== Trailer container ===== */}
            <rect x="2" y="8" width="62" height="26" rx="1.5" />
            {/* Container ridge lines */}
            <line x1="2" y1="15" x2="64" y2="15" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
            <line x1="2" y1="22" x2="64" y2="22" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
            <line x1="2" y1="29" x2="64" y2="29" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
            {/* Container vertical ribs */}
            <line x1="18" y1="8" x2="18" y2="34" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <line x1="34" y1="8" x2="34" y2="34" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <line x1="50" y1="8" x2="50" y2="34" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

            {/* ===== Hitch gap ===== */}

            {/* ===== Cab ===== */}
            {/* Cab body */}
            <path d="M66 16 L78 16 L88 20 L92 24 L92 34 L66 34 Z" />
            {/* Windshield */}
            <path d="M78.5 17.5 L86.5 21 L86.5 24 L78.5 24 Z" fill="rgba(255,255,255,0.28)" />
            {/* Door line */}
            <line x1="78" y1="24" x2="78" y2="34" stroke="rgba(0,0,0,0.25)" strokeWidth="0.6" />
            {/* Door handle */}
            <rect x="74" y="27" width="2.5" height="1" rx="0.3" fill="rgba(255,255,255,0.35)" />
            {/* Grille */}
            <rect x="87" y="28" width="4.5" height="5" rx="0.5" fill="rgba(0,0,0,0.3)" />
            <line x1="87" y1="30" x2="91.5" y2="30" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
            <line x1="87" y1="31.5" x2="91.5" y2="31.5" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
            {/* Headlight */}
            <ellipse cx="90" cy="26" rx="1.6" ry="1.2" fill="rgba(255,255,235,0.75)" />
            {/* Exhaust stack */}
            <rect x="68" y="10" width="2.5" height="8" rx="0.6" />
            <ellipse cx="69.25" cy="10" rx="1.25" ry="0.8" fill="rgba(0,0,0,0.4)" />
            {/* Side mirror */}
            <line x1="78" y1="18" x2="75.5" y2="16.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.6" />
            <ellipse cx="75.5" cy="16.5" rx="1.2" ry="0.8" fill="rgba(255,255,255,0.15)" />

            {/* ===== Wheels — rear tandem axle ===== */}
            <g className="lorry-wheel" style={{ transformOrigin: '14px 38px' }}>
              <circle cx="14" cy="38" r="6" />
              <circle className="lorry-wheel-ring" cx="14" cy="38" r="3" fill="none" strokeWidth="1.5" />
            </g>
            <g className="lorry-wheel" style={{ transformOrigin: '26px 38px' }}>
              <circle cx="26" cy="38" r="6" />
              <circle className="lorry-wheel-ring" cx="26" cy="38" r="3" fill="none" strokeWidth="1.5" />
            </g>
            <g className="lorry-wheel" style={{ transformOrigin: '50px 38px' }}>
              <circle cx="50" cy="38" r="6" />
              <circle className="lorry-wheel-ring" cx="50" cy="38" r="3" fill="none" strokeWidth="1.5" />
            </g>
            {/* Front cab wheel */}
            <g className="lorry-wheel" style={{ transformOrigin: '82px 38px' }}>
              <circle cx="82" cy="38" r="6" />
              <circle className="lorry-wheel-ring" cx="82" cy="38" r="3" fill="none" strokeWidth="1.5" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

export { COLORS };