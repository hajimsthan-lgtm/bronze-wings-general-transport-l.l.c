import { Link, useLocation } from 'react-router-dom';
import AlertBell from '@/components/layout/AlertBell';
import { useState, useEffect } from 'react';
import { getCompanySettings } from '@/lib/companySettings';
import LiveClock from '@/components/common/LiveClock';
import BrandName from '@/components/layout/BrandName';
import TopQuickIcons from '@/components/layout/TopQuickIcons';
import HeaderSubNav from '@/components/layout/headerSubNav';
import { useRailVisible, railVisibility } from '@/lib/railVisibility';
import { Settings as SettingsIcon } from 'lucide-react';

export default function DesktopNav() {
  const [logoUrl, setLogoUrl] = useState('');
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const railVisible = useRailVisible();
  useEffect(() => { getCompanySettings().then((s) => setLogoUrl(s.logo_url)); }, []);

  return (
    <nav
      className="hidden md:block sticky top-0 z-50"
      onMouseEnter={() => railVisibility.set(true)}
    >
      {/* dark satin glass surface */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, var(--header-tint-1) 0%, var(--header-tint-2) 100%)',
        backdropFilter: 'blur(14px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.3)',
      }} />
      {/* top specular highlight */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.16) 50%, transparent 100%)' }} />
      {/* gradient bottom hairline */}
      <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.30) 50%, transparent 100%)' }} />
      {/* centered ambient blue light-leak */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 h-16 w-2/3" style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(59,130,246,0.06), transparent 70%)' }} />

      <div className="relative max-w-[1440px] mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group/brand">
          {isDashboard && (
            <div className="relative">
              <div className="absolute inset-0 rounded-xl blur-md opacity-60" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.28) 0%, transparent 70%)' }} />
              {logoUrl ?
              <img src={logoUrl} alt="Bronze Wings" className="relative w-9 h-9 rounded-xl object-contain" style={{
                border: '1px solid rgba(var(--panel-accent-rgb),0.30)',
                boxShadow: '-3px -3px 7px rgba(255,255,255,0.05), 4px 4px 10px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -2px 4px rgba(0,0,0,0.25), 0 0 14px -4px rgba(var(--panel-accent-rgb),0.45)',
              }} /> :
              <div className="relative w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--background-elevated)))',
                  border: '1px solid rgba(var(--panel-accent-rgb),0.30)',
                  boxShadow: '-3px -3px 7px rgba(255,255,255,0.05), 4px 4px 10px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 4px rgba(0,0,0,0.28), 0 0 14px -4px rgba(var(--panel-accent-rgb),0.45)',
                }}>
                <span className="text-sm font-bold" style={{ color: 'rgb(var(--panel-accent-rgb))' }}>BW</span>
              </div>}
            </div>
          )}
          <BrandName variant="desktop" />
        </Link>

        {/* Page sub-nav tiles — synced with the left rail visibility */}
        <div className={`hidden md:flex transition-opacity duration-500 ${railVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <HeaderSubNav />
        </div>

        {/* Right controls — dark glass circles */}
        <div className="flex items-center gap-2">
          <LiveClock />
          <TopQuickIcons />
          <AlertBell />
          <Link
            to="/settings"
            aria-label="Settings"
            title="Settings"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 transition-all hover:border-blue-500/30 hover:bg-white/10 hover:text-white"
          >
            <SettingsIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}