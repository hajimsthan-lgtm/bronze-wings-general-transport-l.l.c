import { useEffect } from 'react';

const COLORS = ['violet', 'green', 'red', 'yellow', 'blue'];

const ECG_PATH = 'M0,25 L60,25 L75,25 L90,5 L105,45 L120,10 L135,40 L150,25 L165,25 L180,25 L195,25 L210,5 L225,45 L240,10 L255,40 L270,25 L285,25 L300,25 L315,25 L330,5 L345,45 L360,10 L375,40 L390,25 L405,25 L420,25 L435,25 L450,5 L465,45 L480,10 L495,40 L510,25 L525,25 L540,25 L555,25 L570,25 L600,25';

let injected = false;
function injectStyles() {
  if (injected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-hb-compact', 'true');
  style.textContent = `
    .hb-compact {
      position: relative;
      width: 240px;
      height: 40px;
      border: 1px solid #1e1e2e;
      border-radius: 8px;
      background: #0d0d14;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      user-select: none;
    }
    .hb-compact .hb-wave-box {
      position: relative;
      width: 92%;
      height: 75%;
    }
    .hb-compact .hb-bg-line {
      position: absolute;
      left: 0; right: 0; top: 50%;
      height: 1px;
      background: rgba(255,255,255,0.06);
      transform: translateY(-0.5px);
    }
    .hb-compact .hb-glow {
      position: absolute;
      left: 0; right: 0; top: 50%;
      height: 30px;
      transform: translateY(-50%);
      border-radius: 50%;
      filter: blur(10px);
      animation: hb-glow-pulse 2s ease-in-out infinite;
      pointer-events: none;
    }
    .hb-compact .hb-svg {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .hb-compact .hb-path {
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 1000;
      stroke-dashoffset: 1000;
      animation: hb-draw-beat 2s ease-in-out infinite;
    }
    @keyframes hb-draw-beat {
      0%   { stroke-dashoffset: 1000; opacity: 0.3; }
      50%  { stroke-dashoffset: 0; opacity: 1; }
      100% { stroke-dashoffset: -1000; opacity: 0.3; }
    }
    @keyframes hb-glow-pulse {
      0%, 100% { opacity: 0.15; }
      50%      { opacity: 0.45; }
    }
    /* ===== 5 fixed scenario colors ===== */
    .hb-compact.hb-violet .hb-path { stroke: #a855f7; filter: drop-shadow(0 0 3px #a855f7) drop-shadow(0 0 6px #a855f7); }
    .hb-compact.hb-violet .hb-glow { background: radial-gradient(ellipse at center, rgba(168,85,247,0.4), transparent 70%); }

    .hb-compact.hb-green .hb-path { stroke: #10b981; filter: drop-shadow(0 0 3px #10b981) drop-shadow(0 0 6px #10b981); }
    .hb-compact.hb-green .hb-glow { background: radial-gradient(ellipse at center, rgba(16,185,129,0.4), transparent 70%); }

    .hb-compact.hb-red .hb-path { stroke: #ef4444; filter: drop-shadow(0 0 3px #ef4444) drop-shadow(0 0 6px #ef4444); }
    .hb-compact.hb-red .hb-glow { background: radial-gradient(ellipse at center, rgba(239,68,68,0.4), transparent 70%); }

    .hb-compact.hb-yellow .hb-path { stroke: #f59e0b; filter: drop-shadow(0 0 3px #f59e0b) drop-shadow(0 0 6px #f59e0b); }
    .hb-compact.hb-yellow .hb-glow { background: radial-gradient(ellipse at center, rgba(245,158,11,0.4), transparent 70%); }

    .hb-compact.hb-blue .hb-path { stroke: #3b82f6; filter: drop-shadow(0 0 3px #3b82f6) drop-shadow(0 0 6px #3b82f6); }
    .hb-compact.hb-blue .hb-glow { background: radial-gradient(ellipse at center, rgba(59,130,246,0.4), transparent 70%); }
  `;
  document.head.appendChild(style);
  injected = true;
}

/**
 * Compact heartbeat ECG loader with 5 fixed scenario colors.
 * @param {string} color - one of: violet (default), green (save/success), red (error/delete), yellow (pending), blue (sync/refresh)
 */
export default function HeartbeatLoader({ color = 'violet', className = '' }) {
  useEffect(() => { injectStyles(); }, []);
  const safeColor = COLORS.includes(color) ? color : 'violet';

  return (
    <div className={`hb-compact hb-${safeColor} ${className}`}>
      <div className="hb-wave-box">
        <div className="hb-bg-line" />
        <div className="hb-glow" />
        <svg className="hb-svg" viewBox="0 0 600 50" preserveAspectRatio="none">
          <path d={ECG_PATH} className="hb-path" />
        </svg>
      </div>
    </div>
  );
}

export { COLORS, ECG_PATH };