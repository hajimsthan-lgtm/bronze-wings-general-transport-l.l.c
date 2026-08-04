import { Link, useLocation } from 'react-router-dom';
import AlertBell from '@/components/layout/AlertBell';
import { useState, useEffect } from 'react';
import { getCompanySettings } from '@/lib/companySettings';
import LiveClock from '@/components/common/LiveClock';
import BrandName from '@/components/layout/BrandName';

import HeaderSubNav from '@/components/layout/headerSubNav';
import { useRailVisible, railVisibility } from '@/lib/railVisibility';
import { Settings as SettingsIcon, LayoutDashboard, Bot } from 'lucide-react';

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
        <div className="flex items-center gap-3">
          {/* Dashboard — round, far left, hidden on dashboard */}
          {!isDashboard && (
            <Link
              to="/"
              aria-label="Dashboard"
              title="Dashboard"
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 transition-all duration-300 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-white"
            >
              <LayoutDashboard className="w-4 h-4" />
            </Link>
          )}
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group/brand">
...
          <BrandName variant="desktop" />
          </Link>
        </div>

        {/* Page sub-nav tiles — synced with the left rail visibility */}
        <div className={`hidden md:flex transition-opacity duration-500 ${railVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <HeaderSubNav />
        </div>

        {/* Right controls — dark glass circles */}
        <div className="flex items-center gap-2">
          <LiveClock />
          <AlertBell />
          <Link
            to="/settings"
            aria-label="Settings"
            title="Settings"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 transition-all hover:border-blue-500/30 hover:bg-white/10 hover:text-white"
          >
            <SettingsIcon className="w-4 h-4" />
          </Link>
          {/* AI Agents — round, far right */}
          <Link
            to="/agents"
            aria-label="AI Agents"
            title="AI Agents"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-white"
          >
            <Bot className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}