import { Link, useLocation, useNavigate } from 'react-router-dom';
import AlertBell from '@/components/layout/AlertBell';
import GlobalDateFilter from '@/components/layout/GlobalDateFilter';
import { useState, useEffect, useRef } from 'react';
import { getCompanySettings } from '@/lib/companySettings';
import LiveClock from '@/components/common/LiveClock';
import BrandName from '@/components/layout/BrandName';
import PageTitleIndicator from '@/components/layout/PageTitleIndicator';

import HeaderSubNav from '@/components/layout/headerSubNav';
import { useRailVisible, railVisibility } from '@/lib/railVisibility';
import { useTheme } from '@/lib/theme';
import { Settings as SettingsIcon, ArrowLeft, ArrowRight, Sun, Moon } from 'lucide-react';

export default function DesktopNav() {
  const [logoUrl, setLogoUrl] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/';
  const railVisible = useRailVisible();
  const { mode, toggleMode } = useTheme();
  useEffect(() => {getCompanySettings().then((s) => setLogoUrl(s.logo_url));}, []);

  const [scrolling, setScrolling] = useState(false);
  const scrollTimer = useRef(null);
  const scrollingRef = useRef(false);
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main) return;
    const onScroll = () => {
      if (!scrollingRef.current) {scrollingRef.current = true;setScrolling(true);}
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => {scrollingRef.current = false;setScrolling(false);}, 150);
    };
    main.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {main.removeEventListener('scroll', onScroll, { capture: true });clearTimeout(scrollTimer.current);};
  }, []);

  const vanishStyle = { opacity: scrolling ? 0 : 1, transition: 'opacity 0.15s ease', pointerEvents: scrolling ? 'none' : 'auto' };

  return (
    <nav
      className="hidden md:block sticky top-0 z-50"
      onMouseEnter={() => railVisibility.set(true)}>
      
      {/* dark satin glass surface */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, var(--header-tint-1) 0%, var(--header-tint-2) 100%)',
        backdropFilter: 'blur(14px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.3)'
      }} />
      {/* top specular highlight */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.16) 50%, transparent 100%)' }} />
      {/* gradient bottom hairline */}
      <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(30,215,96,0.30) 50%, transparent 100%)' }} />
      {/* centered ambient blue light-leak */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 h-16 w-2/3" style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(30,215,96,0.06), transparent 70%)' }} />

      <div className="relative w-full px-4 md:px-6 h-20 flex items-center justify-between">
        {/* Brand at the left corner */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group/brand">
            {isDashboard &&
            <div className="relative">
                <div className="absolute inset-0 rounded-xl blur-md opacity-60" style={{ background: 'radial-gradient(circle, rgba(30,215,96,0.28) 0%, transparent 70%)' }} />
                {logoUrl ?
              <img src={logoUrl} alt="Bronze Wings" className="relative w-9 h-9 rounded-xl object-contain hidden" style={{
                border: '1px solid rgba(var(--panel-accent-rgb),0.30)',
                boxShadow: '-3px -3px 7px rgba(255,255,255,0.05), 4px 4px 10px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -2px 4px rgba(0,0,0,0.25), 0 0 14px -4px rgba(var(--panel-accent-rgb),0.45)'
              }} /> :
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--background-elevated)))',
                border: '1px solid rgba(var(--panel-accent-rgb),0.30)',
                boxShadow: '-3px -3px 7px rgba(255,255,255,0.05), 4px 4px 10px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.28), 0 0 14px -4px rgba(var(--panel-accent-rgb),0.45)'
              }}>
                  <span className="text-sm font-bold" style={{ color: 'rgb(var(--panel-accent-rgb))' }}>BW</span>
                </div>}
              </div>
            }
            <BrandName variant="desktop" />
          </Link>
          <div className="w-px h-7 hidden lg:block" style={{ background: 'hsl(var(--border))' }} />
          <PageTitleIndicator />
        </div>

        {/* Center cluster — sub-nav tiles */}
        <div className="flex items-center gap-2" style={vanishStyle}>
          {/* Page sub-nav tiles — synced with the left rail visibility */}
          <div className={`hidden md:flex transition-opacity duration-500 ${railVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <HeaderSubNav />
          </div>
        </div>

        {/* Right controls — dark glass circles */}
        <div className="flex items-center gap-2" style={vanishStyle}>
            <GlobalDateFilter />
          <LiveClock />
          <AlertBell />
          <button
            onClick={toggleMode}
            aria-label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300"
            style={{
              background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              color: 'hsl(var(--muted-foreground))'
            }}>
            
            {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            to="/settings"
            aria-label="Settings"
            title="Settings"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 transition-all hover:border-blue-500/30 hover:bg-white/10 hover:text-white">
            
            <SettingsIcon className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </Link>
          {/* Step-back button — moved to right side, before forward */}
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            title="Go back"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 transition-all hover:border-blue-500/30 hover:bg-white/10 hover:text-white">
            
            <ArrowLeft className="w-4 h-4" />
          </button>
          {/* Step-forward button — right corner */}
          <button
            onClick={() => navigate(1)}
            aria-label="Go forward"
            title="Go forward"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 transition-all hover:border-blue-500/30 hover:bg-white/10 hover:text-white">
            
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>);

}