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
        className="w-full flex items-center justify-between px-6"
        style={{
          height: 42,
          background: 'linear-gradient(180deg, rgba(var(--surf-1-rgb),0.72) 0%, rgba(var(--surf-2-rgb),0.88) 100%)',
          backdropFilter: 'blur(22px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
          borderTop: '1px solid rgba(var(--panel-accent-rgb),0.14)',
          boxShadow: '0 -6px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(145deg, rgba(var(--panel-accent-rgb),0.22), rgba(var(--panel-accent-rgb),0.08))', border: '1px solid rgba(var(--panel-accent-rgb),0.3)' }}>
            <span className="text-[10px] font-bold" style={{ color: 'rgb(var(--panel-accent-rgb))' }}>BW</span>
          </div>
          <span className="text-xs font-semibold tracking-tight text-foreground/80 truncate">{company}</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60 hidden lg:block">General Transport · Fleet & Finance</span>
        <span className="text-[10px] text-muted-foreground/50 hidden sm:block">© {new Date().getFullYear()} · All rights reserved</span>
      </div>
    </footer>
  );
}