import { useEffect, useState } from 'react';
import { getCompanySettings } from '@/lib/companySettings';

export default function AppFooter() {
  const [s, setS] = useState(null);
  useEffect(() => { getCompanySettings().then(setS); }, []);
  const company = s?.company_name || 'General Transport L.L.C';

  return (
    <footer className="hidden md:block fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
      <div
        className="w-full flex items-center justify-center"
        style={{
          height: 42,
          background: 'rgba(10,14,23,0.38)',
          backdropFilter: 'blur(18px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <span
          className="text-[15px] font-bold uppercase tracking-[0.18em]"
          style={{
            backgroundImage: 'linear-gradient(90deg, #ff6b6b 0%, #f59e0b 16%, #facc15 28%, #34d399 40%, #22d3ee 52%, #60a5fa 64%, #a78bfa 76%, #f472b6 88%, #ff6b6b 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.40))',
          }}
        >
          {company}
        </span>
      </div>
    </footer>
  );
}