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
      animation: lorry-road-move 1.6s linear infinite;
    }
    @keyframes lorry-road-move {
      from { transform: translateX(0); }
      to   { transform: translateX(-22px); }
    }
    /* ===== Truck body — drives across the scene (slow) ===== */
    .lorry-truck {
      position: absolute;
      bottom: 10px;
      left: -140px;
      width: 130px;
      height: 56px;
      animation: lorry-drive 9s linear infinite, lorry-bob 1.1s ease-in-out infinite alternate;
    }
    @keyframes lorry-drive {
      0%   { left: -140px; }
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
      animation: lorry-wheel-spin 1.4s linear infinite;
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
      animation: lorry-puff 8s ease-out infinite;
    }
    .lorry-smoke:nth-child(1) { animation-delay: 0.5s; }
    .lorry-smoke:nth-child(2) { animation-delay: 3s; }
    .lorry-smoke:nth-child(3) { animation-delay: 5.5s; }
    @keyframes lorry-puff {
      0%   { opacity: 0; transform: translate(0, 0) scale(0.3); }
      10%  { opacity: 0.3; }
      100% { opacity: 0; transform: translate(-28px, -26px) scale(2); }
    }
    /* ===== Color variants — body panels only ===== */
    .lorry-loader.lorry-violet .lorry-body { fill: #a855f7; }
    .lorry-loader.lorry-violet .lorry-wheel-ring { stroke: #a855f7; }

    .lorry-loader.lorry-green .lorry-body { fill: #10b981; }
    .lorry-loader.lorry-green .lorry-wheel-ring { stroke: #10b981; }

    .lorry-loader.lorry-red .lorry-body { fill: #ef4444; }
    .lorry-loader.lorry-red .lorry-wheel-ring { stroke: #ef4444; }

    .lorry-loader.lorry-yellow .lorry-body { fill: #f59e0b; }
    .lorry-loader.lorry-yellow .lorry-wheel-ring { stroke: #f59e0b; }

    .lorry-loader.lorry-blue .lorry-body { fill: #1ED760; }
    .lorry-loader.lorry-blue .lorry-wheel-ring { stroke: #1ED760; }

    .lorry-loader.lorry-bronze .lorry-body { fill: #B8463A; }
    .lorry-loader.lorry-bronze .lorry-wheel-ring { stroke: #B8463A; }

    /* ===== Realistic material fills (theme-neutral) ===== */
    .lorry-tire { fill: #1a1a1a; }
    .lorry-hub { fill: #333; }
    .lorry-glass { fill: rgba(180,220,255,0.45); }
    .lorry-light { fill: #fffacd; }
    .lorry-grille { fill: #0a0a0a; }
    .lorry-dark { fill: #2a2a2a; }
    .lorry-chrome { fill: #888; stroke: #555; stroke-width: 0.3; }
    .lorry-shadow { fill: rgba(0,0,0,0.25); }

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
          <svg viewBox="0 0 130 56" preserveAspectRatio="xMidYMid meet">
            {/* ===== Ground shadow ===== */}
            <ellipse className="lorry-shadow" cx="65" cy="48" rx="58" ry="3" />

            {/* ===== Trailer container ===== */}
            <rect className="lorry-body" x="2" y="6" width="68" height="30" rx="1.5" />
            {/* Container top edge highlight */}
            <rect x="2" y="6" width="68" height="2" rx="1" fill="rgba(255,255,255,0.18)" />
            {/* Container ridge lines (horizontal panels) */}
            <line x1="2" y1="14" x2="70" y2="14" stroke="rgba(0,0,0,0.18)" strokeWidth="0.5" />
            <line x1="2" y1="22" x2="70" y2="22" stroke="rgba(0,0,0,0.18)" strokeWidth="0.5" />
            <line x1="2" y1="29" x2="70" y2="29" stroke="rgba(0,0,0,0.18)" strokeWidth="0.5" />
            {/* Container vertical ribs */}
            <line x1="20" y1="6" x2="20" y2="36" stroke="rgba(0,0,0,0.12)" strokeWidth="0.5" />
            <line x1="38" y1="6" x2="38" y2="36" stroke="rgba(0,0,0,0.12)" strokeWidth="0.5" />
            <line x1="54" y1="6" x2="54" y2="36" stroke="rgba(0,0,0,0.12)" strokeWidth="0.5" />
            {/* Rear door hinges */}
            <rect className="lorry-dark" x="3" y="8" width="1" height="3" rx="0.3" />
            <rect className="lorry-dark" x="3" y="31" width="1" height="3" rx="0.3" />
            {/* Rear door handle */}
            <rect className="lorry-chrome" x="5" y="20" width="1.5" height="4" rx="0.3" />

            {/* ===== Landing gear (folded) ===== */}
            <rect className="lorry-dark" x="68" y="34" width="2" height="6" rx="0.5" />

            {/* ===== Cab ===== */}
            {/* Cab body with sloped windshield */}
            <path className="lorry-body" d="M72 14 L84 14 L94 18 L98 24 L98 36 L72 36 Z" />
            {/* Cab roof highlight */}
            <path d="M72 14 L84 14 L85 15 L73 15 Z" fill="rgba(255,255,255,0.2)" />
            {/* Windshield */}
            <path className="lorry-glass" d="M84.5 15.5 L92 18.5 L92 23 L84.5 23 Z" />
            {/* Window reflection streak */}
            <path d="M86 16 L88 17 L88 22 L86 21 Z" fill="rgba(255,255,255,0.25)" />
            {/* Side window */}
            <rect className="lorry-glass" x="74" y="17" width="8" height="5" rx="0.8" />
            {/* Door line */}
            <line x1="84" y1="24" x2="84" y2="36" stroke="rgba(0,0,0,0.3)" strokeWidth="0.6" />
            {/* Door handle */}
            <rect className="lorry-chrome" x="79" y="29" width="3" height="1" rx="0.3" />
            {/* Grille */}
            <rect className="lorry-grille" x="93" y="28" width="5" height="6" rx="0.5" />
            <line x1="93" y1="30" x2="98" y2="30" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
            <line x1="93" y1="31.5" x2="98" y2="31.5" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
            <line x1="93" y1="33" x2="98" y2="33" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
            {/* Front bumper */}
            <rect className="lorry-dark" x="92" y="34" width="7" height="3" rx="0.5" />
            {/* Headlight */}
            <ellipse class="lorry-light" cx="96" cy="26" rx="1.8" ry="1.3" />
            {/* Headlight glow */}
            <ellipse cx="96" cy="26" rx="3" ry="2" fill="rgba(255,250,205,0.15)" />
            {/* Exhaust stack */}
            <rect className="lorry-dark" x="74" y="7" width="2.8" height="9" rx="0.6" />
            <ellipse className="lorry-hub" cx="75.4" cy="7" rx="1.4" ry="0.9" />
            {/* Side mirror arm + mirror */}
            <line x1="84" y1="16" x2="80" y2="14" stroke="#555" strokeWidth="0.7" />
            <ellipse className="lorry-dark" cx="80" cy="14" rx="1.5" ry="1" />
            {/* Fuel tank (cylinder under cab) */}
            <ellipse className="lorry-dark" cx="78" cy="37" rx="4" ry="1.8" />
            {/* Mud flap */}
            <rect className="lorry-dark" x="44" y="38" width="8" height="4" rx="0.5" opacity="0.7" />

            {/* ===== Wheels — rear tandem axle + front ===== */}
            {/* Rear axle 1 */}
            <g className="lorry-wheel" style={{ transformOrigin: '14px 40px' }}>
              <circle className="lorry-tire" cx="14" cy="40" r="6.5" />
              <circle className="lorry-hub" cx="14" cy="40" r="3.2" />
              <circle className="lorry-wheel-ring" cx="14" cy="40" r="2.5" fill="none" strokeWidth="1.2" />
              <circle cx="14" cy="40" r="0.8" fill="#555" />
            </g>
            <g className="lorry-wheel" style={{ transformOrigin: '28px 40px' }}>
              <circle className="lorry-tire" cx="28" cy="40" r="6.5" />
              <circle className="lorry-hub" cx="28" cy="40" r="3.2" />
              <circle className="lorry-wheel-ring" cx="28" cy="40" r="2.5" fill="none" strokeWidth="1.2" />
              <circle cx="28" cy="40" r="0.8" fill="#555" />
            </g>
            {/* Rear axle 2 */}
            <g className="lorry-wheel" style={{ transformOrigin: '52px 40px' }}>
              <circle className="lorry-tire" cx="52" cy="40" r="6.5" />
              <circle className="lorry-hub" cx="52" cy="40" r="3.2" />
              <circle className="lorry-wheel-ring" cx="52" cy="40" r="2.5" fill="none" strokeWidth="1.2" />
              <circle cx="52" cy="40" r="0.8" fill="#555" />
            </g>
            <g className="lorry-wheel" style={{ transformOrigin: '64px 40px' }}>
              <circle className="lorry-tire" cx="64" cy="40" r="6.5" />
              <circle className="lorry-hub" cx="64" cy="40" r="3.2" />
              <circle className="lorry-wheel-ring" cx="64" cy="40" r="2.5" fill="none" strokeWidth="1.2" />
              <circle cx="64" cy="40" r="0.8" fill="#555" />
            </g>
            {/* Front cab wheel */}
            <g className="lorry-wheel" style={{ transformOrigin: '88px 40px' }}>
              <circle className="lorry-tire" cx="88" cy="40" r="6" />
              <circle className="lorry-hub" cx="88" cy="40" r="3" />
              <circle className="lorry-wheel-ring" cx="88" cy="40" r="2.3" fill="none" strokeWidth="1.2" />
              <circle cx="88" cy="40" r="0.7" fill="#555" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

export { COLORS };