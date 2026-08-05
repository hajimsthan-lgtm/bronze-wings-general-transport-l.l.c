import { Link, useLocation, useNavigate } from 'react-router-dom';
import AlertBell from '@/components/layout/AlertBell';
import GlobalDateFilter from '@/components/layout/GlobalDateFilter';
import { useState, useEffect } from 'react';
import { getCompanySettings } from '@/lib/companySettings';
import LiveClock from '@/components/common/LiveClock';
import BrandName from '@/components/layout/BrandName';

import HeaderSubNav from '@/components/layout/headerSubNav';
import { useRailVisible, railVisibility } from '@/lib/railVisibility';
import { Settings as SettingsIcon, Bot, ArrowLeft, ArrowRight } from 'lucide-react';

export default function DesktopNav() {
  const [logoUrl, setLogoUrl] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/';
  const railVisible = useRailVisible();
  useEffect(() => {getCompanySettings().then((s) => setLogoUrl(s.logo_url));}, []);

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
      <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.30) 50%, transparent 100%)' }} />
      {/* centered ambient blue light-leak */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 h-16 w-2/3" style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(59,130,246,0.06), transparent 70%)' }} />

      <div className="relative w-full px-4 md:px-6 h-20 flex items-center justify-between">
        {/* Brand at the left corner */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 group/brand">
            {isDashboard &&
            <div className="relative">
                <div className="absolute inset-0 rounded-xl blur-md opacity-60" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.28) 0%, transparent 70%)' }} />
                {logoUrl ?
              <img src={logoUrl} alt="Bronze Wings" className="relative w-9 h-9 rounded-xl object-contain" style={{
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
          {/* Global date filter — sits right of the brand name, controls all pages */}
          <GlobalDateFilter />
        </div>

        {/* Center cluster — sub-nav tiles */}
        <div className="flex items-center gap-2">
          {/* Page sub-nav tiles — synced with the left rail visibility */}
          <div className={`hidden md:flex transition-opacity duration-500 ${railVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <HeaderSubNav />
          </div>
        </div>

        {/* Right controls — dark glass circles, step-forward at the far right corner */}
        <div className="flex items-center gap-2">
          <LiveClock />
          <Link
            to="/agents"
            aria-label="AI Agents"
            title="AI Agents"
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12px] font-semibold uppercase tracking-wider transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.06))',
              border: '1px solid rgba(16,185,129,0.35)',
              color: '#fff',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 12px rgba(16,185,129,0.22)'
            }}>
            
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">AI Agents</span>
          </Link>
          <AlertBell />
          <Link
            to="/settings"
            aria-label="Settings"
            title="Settings"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 transition-all hover:border-blue-500/30 hover:bg-white/10 hover:text-white">
            
            <SettingsIcon className="w-4 h-4" style={{ color: '#c8c8d4', filter: 'drop-shadow(0 0 3px rgba(200,200,212,0.35))' }} />
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