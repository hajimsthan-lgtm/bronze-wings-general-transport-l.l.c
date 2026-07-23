import { Outlet, useLocation } from 'react-router-dom';
import DesktopNav from '@/components/layout/DesktopNav';
import MobileNav from '@/components/layout/MobileNav';
import TopBar, { hasSubNavForPath } from '@/components/layout/TopBar';
import AppFooter from '@/components/layout/AppFooter';
import { Bell, Settings, Search } from 'lucide-react';

export default function AppLayout() {
  const location = useLocation();
  const hasSubNav = hasSubNavForPath(location.pathname);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#06080f]">
      {/* ═══════════════════════════════════════════════════════
          AMBIENT BACKGROUND LAYERS
          ═══════════════════════════════════════════════════════ */}
      
      {/* Layer 1: Deep animated ambient gradient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full animate-float opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(var(--panel-accent2-rgb),0.25) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animationDelay: '0s'
          }}
        />
        <div 
          className="absolute top-[50%] right-[10%] w-[400px] h-[400px] rounded-full animate-float opacity-15"
          style={{
            background: 'radial-gradient(circle, rgba(var(--panel-accent-rgb),0.20) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animationDelay: '-3s'
          }}
        />
        <div 
          className="absolute bottom-[10%] left-[40%] w-[350px] h-[350px] rounded-full animate-float opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(var(--panel-accent2-rgb),0.18) 0%, transparent 70%)',
            filter: 'blur(70px)',
            animationDelay: '-5s'
          }}
        />
      </div>

      {/* Layer 2: Noise texture for depth */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] bg-noise bg-[128px]"
      />

      {/* Layer 3: Fine tech grid */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(var(--panel-accent-rgb),0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--panel-accent-rgb),0.3) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Layer 4: Top light leak */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none z-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(var(--panel-accent-rgb),0.12) 0%, transparent 70%)',
          filter: 'blur(80px)'
        }}
      />

      {/* ═══════════════════════════════════════════════════════
          NAVIGATION
          ═══════════════════════════════════════════════════════ */}
      <DesktopNav />
      <TopBar />

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════════ */}
      <main className={`flex-1 pb-28 md:pb-20 px-3 md:px-5 lg:px-7 max-w-[1440px] mx-auto w-full relative z-10 ${hasSubNav ? 'pt-3 md:pt-4' : 'pt-[calc(12px+env(safe-area-inset-top))]'}`}>
        <div
          key={location.pathname}
          className="animate-fade-in-up p-4 md:p-6 rounded-2xl relative overflow-hidden animate-border-pulse"
          style={{
            background: `
              linear-gradient(
                180deg,
                rgba(18, 22, 34, 0.70) 0%,
                rgba(12, 16, 26, 0.88) 50%,
                rgba(9, 12, 20, 0.92) 100%
              )
            `,
            backdropFilter: 'blur(40px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.2)',
            border: '1px solid rgba(var(--panel-accent-rgb),0.10)',
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.05),
              inset 0 0 80px rgba(var(--panel-accent-rgb),0.03),
              0 0 0 1px rgba(var(--panel-accent-rgb),0.06),
              0 0 40px rgba(var(--panel-accent-rgb),0.05),
              0 0 80px rgba(var(--panel-accent2-rgb),0.03),
              0 20px 60px rgba(0,0,0,0.45)
            `
          }}>
          
          {/* Inner top highlight */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(var(--panel-accent-rgb),0.05) 0%, transparent 60%)'
            }}
          />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-20 h-20 pointer-events-none opacity-30" 
            style={{
              background: 'radial-gradient(circle at top left, rgba(var(--panel-accent-rgb),0.12), transparent 70%)'
            }}
          />
          <div className="absolute bottom-0 right-0 w-28 h-28 pointer-events-none opacity-15" 
            style={{
              background: 'radial-gradient(circle at bottom right, rgba(var(--panel-accent2-rgb),0.08), transparent 70%)'
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            <Outlet />
          </div>
        </div>
      </main>

      <AppFooter />
      <MobileNav />
    </div>
  );
}