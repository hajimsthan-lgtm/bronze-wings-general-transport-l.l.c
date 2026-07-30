import { useEffect, useState } from 'react';
import { getCompanySettings } from '@/lib/companySettings';

export default function AppFooter() {
  const [s, setS] = useState(null);
  useEffect(() => { getCompanySettings().then(setS); }, []);
  const company = s?.company_name || 'General Transport L.L.C';

  // company name only, repeated for a seamless loop
  const items = Array(6).fill(company);

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
        {/* Smooth continuous professional scroll */}
        <div className="flex items-center h-full w-max animate-marquee-freeze-roll" style={{ willChange: 'transform' }}>
          {items.map((it, i) => (
            <span key={i} className="flex items-center shrink-0">
              <span
                className="px-6 text-[14px] font-bold uppercase tracking-[0.16em]"
                style={{
                  backgroundImage: 'linear-gradient(90deg, #ff6b6b 0%, #f59e0b 16%, #facc15 28%, #34d399 40%, #22d3ee 52%, #60a5fa 64%, #a78bfa 76%, #f472b6 88%, #ff6b6b 100%)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.40))',
                  animation: 'footer-color-shift 8s linear infinite',
                }}
              >
                {it}
              </span>
              <span className="text-white/15 text-[8px]">◆</span>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}