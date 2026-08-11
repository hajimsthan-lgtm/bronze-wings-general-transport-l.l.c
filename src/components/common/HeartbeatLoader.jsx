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
      width: 240px;
      height: 64px;
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
    /* ===== Truck body ===== */
    .lorry-truck {
      position: absolute;
      bottom: 10px;
      left: 50%;
      width: 72px;
      height: 40px;
      transform: translateX(-50%);
      animation: lorry-bob 0.35s ease-in-out infinite alternate;
    }
    @keyframes lorry-bob {
      from { transform: translateX(-50%) translateY(0); }
      to   { transform: translateX(-50%) translateY(-1.5px); }
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
    /* ===== Exhaust puffs ===== */
    .lorry-smoke {
      position: absolute;
      bottom: 22px;
      left: 50%;
      margin-left: -42px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: hsl(var(--muted-foreground));
      opacity: 0;
      animation: lorry-puff 1.2s ease-out infinite;
    }
    .lorry-smoke:nth-child(1) { animation-delay: 0s; }
    .lorry-smoke:nth-child(2) { animation-delay: 0.4s; }
    .lorry-smoke:nth-child(3) { animation-delay: 0.8s; }
    @keyframes lorry-puff {
      0%   { opacity: 0; transform: translate(0, 0) scale(0.4); }
      20%  { opacity: 0.4; }
      100% { opacity: 0; transform: translate(-22px, -16px) scale(1.6); }
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
          <svg viewBox="0 0 72 40" preserveAspectRatio="xMidYMid meet">
            {/* Cargo box */}
            <rect x="2" y="6" width="40" height="22" rx="2" />
            {/* Cab */}
            <path d="M42 14 L52 14 L60 20 L60 28 L42 28 Z" />
            {/* Window */}
            <rect x="46" y="17" width="10" height="6" rx="1" fill="rgba(255,255,255,0.25)" />
            {/* Headlight */}
            <circle cx="59" cy="25" r="1.5" fill="rgba(255,255,255,0.6)" />
            {/* Front wheel */}
            <g className="lorry-wheel" style={{ transformOrigin: '52px 30px' }}>
              <circle cx="52" cy="30" r="6" />
              <circle className="lorry-wheel-ring" cx="52" cy="30" r="3" fill="none" strokeWidth="1.5" />
            </g>
            {/* Rear wheel */}
            <g className="lorry-wheel" style={{ transformOrigin: '14px 30px' }}>
              <circle cx="14" cy="30" r="6" />
              <circle className="lorry-wheel-ring" cx="14" cy="30" r="3" fill="none" strokeWidth="1.5" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

export { COLORS };