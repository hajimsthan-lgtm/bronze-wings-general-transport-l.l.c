import { useEffect, useRef } from 'react';

const COLOR_MAP = {
  violet: { stroke: '#a855f7', rgb: '168,85,247' },
  green:  { stroke: '#10b981', rgb: '16,185,129' },
  red:    { stroke: '#ef4444', rgb: '239,68,68' },
  yellow: { stroke: '#f59e0b', rgb: '245,158,11' },
  blue:   { stroke: '#3b82f6', rgb: '59,130,246' },
  pink:   { stroke: '#ec4899', rgb: '236,72,153' },
  cyan:   { stroke: '#06b6d4', rgb: '6,182,212' },
};

const ECG_PATH = 'M0,40 L100,40 L120,40 L140,10 L160,70 L180,25 L200,55 L220,40 L240,40 L260,40 L280,40 L300,10 L320,70 L340,25 L360,55 L380,40 L400,40 L420,40 L440,40 L460,10 L480,70 L500,25 L520,55 L540,40 L560,40 L580,40 L600,10 L620,70 L640,25 L660,55 L680,40 L700,40 L720,40 L740,40 L800,40';

let styleId = null;
function injectStyles() {
  if (styleId || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-heartbeat', 'true');
  style.textContent = `
    .heartbeat-loader {
      position: relative;
      width: 100%;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .heartbeat-loader .hb-bg-line {
      position: absolute;
      left: 0; right: 0; top: 50%;
      height: 2px;
      background: rgba(255,255,255,0.06);
      transform: translateY(-1px);
    }
    .heartbeat-loader .hb-glow {
      position: absolute;
      left: 0; right: 0; top: 50%;
      height: 60px;
      transform: translateY(-50%);
      border-radius: 50%;
      filter: blur(16px);
      opacity: 0.3;
      animation: hb-pulse 1.8s ease-in-out infinite;
      pointer-events: none;
    }
    .heartbeat-loader .hb-svg {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .heartbeat-loader .hb-path {
      fill: none;
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
      animation: hb-pulse 1.8s ease-in-out infinite;
      filter: drop-shadow(0 0 8px var(--hb-stroke)) drop-shadow(0 0 16px var(--hb-stroke));
    }
    .heartbeat-loader .hb-path-draw {
      stroke-dasharray: 2000;
      stroke-dashoffset: 2000;
      animation: hb-draw 3.6s linear infinite;
    }
    @keyframes hb-pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
    @keyframes hb-draw {
      0% { stroke-dashoffset: 2000; }
      50% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: -2000; }
    }
    /* Color variants */
    .heartbeat-loader.violet { --hb-stroke: #a855f7; }
    .heartbeat-loader.violet .hb-glow { background: radial-gradient(ellipse at center, rgba(168,85,247,0.35), transparent 70%); }
    .heartbeat-loader.violet .hb-path { stroke: #a855f7; }

    .heartbeat-loader.green { --hb-stroke: #10b981; }
    .heartbeat-loader.green .hb-glow { background: radial-gradient(ellipse at center, rgba(16,185,129,0.35), transparent 70%); }
    .heartbeat-loader.green .hb-path { stroke: #10b981; }

    .heartbeat-loader.red { --hb-stroke: #ef4444; }
    .heartbeat-loader.red .hb-glow { background: radial-gradient(ellipse at center, rgba(239,68,68,0.35), transparent 70%); }
    .heartbeat-loader.red .hb-path { stroke: #ef4444; }

    .heartbeat-loader.yellow { --hb-stroke: #f59e0b; }
    .heartbeat-loader.yellow .hb-glow { background: radial-gradient(ellipse at center, rgba(245,158,11,0.35), transparent 70%); }
    .heartbeat-loader.yellow .hb-path { stroke: #f59e0b; }

    .heartbeat-loader.blue { --hb-stroke: #3b82f6; }
    .heartbeat-loader.blue .hb-glow { background: radial-gradient(ellipse at center, rgba(59,130,246,0.35), transparent 70%); }
    .heartbeat-loader.blue .hb-path { stroke: #3b82f6; }

    .heartbeat-loader.pink { --hb-stroke: #ec4899; }
    .heartbeat-loader.pink .hb-glow { background: radial-gradient(ellipse at center, rgba(236,72,153,0.35), transparent 70%); }
    .heartbeat-loader.pink .hb-path { stroke: #ec4899; }

    .heartbeat-loader.cyan { --hb-stroke: #06b6d4; }
    .heartbeat-loader.cyan .hb-glow { background: radial-gradient(ellipse at center, rgba(6,182,212,0.35), transparent 70%); }
    .heartbeat-loader.cyan .hb-path { stroke: #06b6d4; }
  `;
  document.head.appendChild(style);
  styleId = true;
}

export default function HeartbeatLoader({ color = 'violet', animateDraw = true, className = '' }) {
  useEffect(() => { injectStyles(); }, []);
  const variant = COLOR_MAP[color] ? color : 'violet';
  return (
    <div className={`heartbeat-loader ${variant} ${className}`}>
      <div className="hb-bg-line" />
      <div className="hb-glow" />
      <svg className="hb-svg" viewBox="0 0 800 80" preserveAspectRatio="none">
        <path
          d={ECG_PATH}
          className={`hb-path ${animateDraw ? 'hb-path-draw' : ''}`}
        />
      </svg>
    </div>
  );
}

export { COLOR_MAP, ECG_PATH };