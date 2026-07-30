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

  // one cycle = company name + all quotes; duplicated for a seamless loop
  const cycle = [{ kind: 'name', text: company }, ...QUOTES];
  const items = [...cycle, ...cycle];

  return (
    <footer className="hidden md:block fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div
        className="w-full overflow-hidden"
        style={{
          height: 42,
          background: 'rgba(10,14,23,0.38)',
          backdropFilter: 'blur(18px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center h-full w-max animate-marquee-left" style={{ willChange: 'transform' }}>
          {items.map((it, i) => (
            <span key={i} className="flex items-center shrink-0">
              {it.kind === 'name' ? (
                <span
                  className="px-5 text-[13px] font-bold uppercase tracking-[0.14em]"
                  style={{
                    backgroundImage: 'linear-gradient(100deg, #ffffff 0%, rgb(var(--panel-accent2-rgb)) 50%, #ffffff 100%)',
                    WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 7px rgba(var(--panel-accent2-rgb),0.4))',
                  }}
                >
                  {it.text}
                </span>
              ) : (
                <span
                  className="px-5 text-[11px] font-medium italic"
                  style={{ color: it.color, textShadow: `0 0 8px ${it.color}66` }}
                >
                  “{it.text}”
                </span>
              )}
              <span className="text-white/15 text-[7px]">◆</span>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}