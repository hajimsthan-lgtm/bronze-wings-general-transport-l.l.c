import { useEffect, useState } from 'react';
import { getCompanySettings } from '@/lib/companySettings';

const QUOTES = [
  { text: 'Moving the nation, one kilometer at a time', color: '#60a5fa' },
  { text: 'Heavy hauls, heavier trust', color: '#f59e0b' },
  { text: 'On time, every time', color: '#34d399' },
  { text: 'Driven by precision', color: '#a78bfa' },
  { text: 'From desert to depot, we deliver', color: '#f43f5e' },
  { text: 'Fleet first, freight forward', color: '#22d3ee' },
];

export default function AppFooter() {
  const [s, setS] = useState(null);
  useEffect(() => { getCompanySettings().then(setS); }, []);
  const company = s?.company_name || 'General Transport L.L.C';

  // build a seamless loop: company name + quotes, duplicated
  const cycle = [{ kind: 'name', text: company }, ...QUOTES];
  const lines = [...cycle, ...cycle];

  return (
    <footer className="hidden md:block fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-8 pb-3">
        <div
          className="pointer-events-auto mx-auto flex items-center overflow-hidden rounded-2xl"
          style={{
            height: 44,
            background: 'rgba(10,14,23,0.78)',
            backdropFilter: 'blur(22px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 -10px 30px rgba(0,0,0,0.5)',
          }}
        >
          {/* vertical marquee — company name (shining) + colored quotes */}
          <div className="relative w-full h-full overflow-hidden">
            <div className="absolute inset-x-0 top-0 flex flex-col items-center animate-marquee-up" style={{ willChange: 'transform' }}>
              {lines.map((l, i) => l.kind === 'name' ? (
                <span
                  key={i}
                  className="flex items-center justify-center h-[44px] text-[13px] font-bold tracking-[0.12em] uppercase"
                  style={{
                    backgroundImage: 'linear-gradient(100deg, #ffffff 0%, rgb(var(--panel-accent2-rgb)) 50%, #ffffff 100%)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 8px rgba(var(--panel-accent2-rgb),0.4))',
                  }}
                >
                  {l.text}
                </span>
              ) : (
                <span
                  key={i}
                  className="flex items-center justify-center h-[44px] text-[11px] font-medium italic"
                  style={{ color: l.color, textShadow: `0 0 8px ${l.color}66` }}
                >
                  “{l.text}”
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}