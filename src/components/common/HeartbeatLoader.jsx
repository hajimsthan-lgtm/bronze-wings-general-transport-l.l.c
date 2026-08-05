import { useEffect, useState } from 'react';

const COLORS = [
  { key: 'hb-violet', name: 'Violet', stroke: '#a855f7', rgb: '168,85,247' },
  { key: 'hb-green',  name: 'Green',  stroke: '#10b981', rgb: '16,185,129' },
  { key: 'hb-red',    name: 'Red',    stroke: '#ef4444', rgb: '239,68,68' },
  { key: 'hb-yellow', name: 'Yellow', stroke: '#f59e0b', rgb: '245,158,11' },
  { key: 'hb-blue',   name: 'Blue',   stroke: '#3b82f6', rgb: '59,130,246' },
];

const ECG_PATH = 'M0,25 L60,25 L75,25 L90,5 L105,45 L120,10 L135,40 L150,25 L165,25 L180,25 L195,25 L210,5 L225,45 L240,10 L255,40 L270,25 L285,25 L300,25 L315,25 L330,5 L345,45 L360,10 L375,40 L390,25 L405,25 L420,25 L435,25 L450,5 L465,45 L480,10 L495,40 L510,25 L525,25 L540,25 L555,25 L570,25 L600,25';

let injected = false;
function injectStyles() {
  if (injected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-hb-compact', 'true');
  style.textContent = `
    .hb-compact {
      position: relative;
      width: 280px;
      height: 50px;
      border: 1px solid #1e1e2e;
      border-radius: 10px;
      background: #0d0d14;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 12px;
      cursor: pointer;
      user-select: none;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .hb-compact:hover { border-color: rgba(255,255,255,0.14); }
    .hb-compact .hb-wave-box {
      position: relative;
      width: 90%;
      height: 70%;
      flex: 1;
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
      height: 40px;
      transform: translateY(-50%);
      border-radius: 50%;
      filter: blur(12px);
      animation: hb-c-pulse 1.6s ease-in-out infinite;
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
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
      animation: hb-c-pulse 1.6s ease-in-out infinite;
    }
    .hb-compact .hb-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      animation: hb-c-pulse 1.6s ease-in-out infinite;
    }
    @keyframes hb-c-pulse {
      0%, 100% { opacity: 0.25; }
      50% { opacity: 1; }
    }
    /* Color variants — pulse matches stroke color */
    .hb-compact.hb-violet .hb-path { stroke: #a855f7; filter: drop-shadow(0 0 4px #a855f7) drop-shadow(0 0 8px #a855f7); }
    .hb-compact.hb-violet .hb-glow { background: radial-gradient(ellipse at center, rgba(168,85,247,0.4), transparent 70%); }
    .hb-compact.hb-violet .hb-dot { background: #a855f7; box-shadow: 0 0 6px #a855f7, 0 0 12px rgba(168,85,247,0.5); }

    .hb-compact.hb-green .hb-path { stroke: #10b981; filter: drop-shadow(0 0 4px #10b981) drop-shadow(0 0 8px #10b981); }
    .hb-compact.hb-green .hb-glow { background: radial-gradient(ellipse at center, rgba(16,185,129,0.4), transparent 70%); }
    .hb-compact.hb-green .hb-dot { background: #10b981; box-shadow: 0 0 6px #10b981, 0 0 12px rgba(16,185,129,0.5); }

    .hb-compact.hb-red .hb-path { stroke: #ef4444; filter: drop-shadow(0 0 4px #ef4444) drop-shadow(0 0 8px #ef4444); }
    .hb-compact.hb-red .hb-glow { background: radial-gradient(ellipse at center, rgba(239,68,68,0.4), transparent 70%); }
    .hb-compact.hb-red .hb-dot { background: #ef4444; box-shadow: 0 0 6px #ef4444, 0 0 12px rgba(239,68,68,0.5); }

    .hb-compact.hb-yellow .hb-path { stroke: #f59e0b; filter: drop-shadow(0 0 4px #f59e0b) drop-shadow(0 0 8px #f59e0b); }
    .hb-compact.hb-yellow .hb-glow { background: radial-gradient(ellipse at center, rgba(245,158,11,0.4), transparent 70%); }
    .hb-compact.hb-yellow .hb-dot { background: #f59e0b; box-shadow: 0 0 6px #f59e0b, 0 0 12px rgba(245,158,11,0.5); }

    .hb-compact.hb-blue .hb-path { stroke: #3b82f6; filter: drop-shadow(0 0 4px #3b82f6) drop-shadow(0 0 8px #3b82f6); }
    .hb-compact.hb-blue .hb-glow { background: radial-gradient(ellipse at center, rgba(59,130,246,0.4), transparent 70%); }
    .hb-compact.hb-blue .hb-dot { background: #3b82f6; box-shadow: 0 0 6px #3b82f6, 0 0 12px rgba(59,130,246,0.5); }
  `;
  document.head.appendChild(style);
  injected = true;
}

export default function HeartbeatLoader({ color = 'violet', className = '' }) {
  const [idx, setIdx] = useState(() => {
    const found = COLORS.findIndex(c => c.key === `hb-${color}`);
    return found >= 0 ? found : 0;
  });

  useEffect(() => { injectStyles(); }, []);

  const current = COLORS[idx];

  const handleClick = () => {
    setIdx(prev => (prev + 1) % COLORS.length);
  };

  return (
    <div
      className={`hb-compact ${current.key} ${className}`}
      onClick={handleClick}
      title="Click to cycle color"
    >
      <div className="hb-wave-box">
        <div className="hb-bg-line" />
        <div className="hb-glow" />
        <svg className="hb-svg" viewBox="0 0 600 50" preserveAspectRatio="none">
          <path d={ECG_PATH} className="hb-path" />
        </svg>
      </div>
      <div className="hb-dot" />
    </div>
  );
}

export { COLORS, ECG_PATH };