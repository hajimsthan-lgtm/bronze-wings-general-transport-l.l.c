import { useEffect, useState } from 'react';
import { getCompanySettings } from '@/lib/companySettings';

export default function AppFooter() {
  const [s, setS] = useState(null);
  const [opacity, setOpacity] = useState(1);
  useEffect(() => { getCompanySettings().then(setS); }, []);
  const company = s?.company_name || 'General Transport L.L.C';

  useEffect(() => {
    let dimTimer;
    const reset = () => {
      setOpacity(1);
      clearTimeout(dimTimer);
      // visible for 10s, then dim gradually over the next 10s (10s linear transition)
      dimTimer = setTimeout(() => setOpacity(0), 10000);
    };
    reset();
    const events = ['mousemove', 'scroll', 'click', 'touchstart', 'keydown'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => { events.forEach((e) => window.removeEventListener(e, reset)); clearTimeout(dimTimer); };
  }, []);

  return (
    <footer className="hidden md:block fixed bottom-0 left-0 right-0 z-40 pointer-events-none" style={{ opacity, transition: 'opacity 10s linear' }}>
      <div
        className="w-full flex items-center justify-center"
        style={{
          height: 42,
          background: 'hsl(var(--sidebar-background))',
          backdropFilter: 'blur(18px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
          borderTop: '1px solid hsl(var(--sidebar-border))',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <span
          className="text-[15px] font-bold uppercase tracking-[0.18em] animate-gold-shine"
          style={{
            backgroundImage: 'linear-gradient(90deg, rgb(var(--panel-accent-rgb)) 0%, #ffffff 45%, rgb(var(--panel-accent2-rgb)) 55%, rgb(var(--panel-accent-rgb)) 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 10px rgba(var(--panel-accent-rgb),0.5))',
          }}
        >
          {company}
        </span>
      </div>
    </footer>
  );
}