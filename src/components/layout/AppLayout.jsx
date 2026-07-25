import { Outlet, useLocation } from 'react-router-dom';
import DesktopNav from '@/components/layout/DesktopNav';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';
import AppFooter from '@/components/layout/AppFooter';
import MobileHeader from '@/components/layout/MobileHeader';
import { Bell, Settings, Search } from 'lucide-react';

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-[100dvh] md:h-[100dvh] flex flex-col relative md:overflow-hidden" style={{ background: 'var(--app-bg)' }}>
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

      {/* Layer 3: Dotted ambient grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.14]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(var(--panel-accent-rgb),0.7) 1px, transparent 1.5px)',
          backgroundSize: '26px 26px'
        }}
      />

      {/* Layer 3b: Animated cool wave light (background only — subtle, behind all content) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[18%] -left-[10%] w-[55vw] h-[55vh] rounded-full animate-wave-glow" style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.05), transparent 70%)', filter: 'blur(90px)' }} />
        <div className="absolute top-[18%] -right-[10%] w-[50vw] h-[50vh] rounded-full animate-wave-glow" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05), transparent 70%)', filter: 'blur(90px)', animationDelay: '-3s' }} />
        <div className="absolute -bottom-[15%] left-[25%] w-[50vw] h-[50vh] rounded-full animate-wave-glow" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.05), transparent 70%)', filter: 'blur(90px)', animationDelay: '-5.5s' }} />
      </div>

      {/* Layer 4: Top light leak */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none z-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(var(--panel-accent-rgb),0.12) 0%, transparent 70%)',
          filter: 'blur(80px)'
        }}
      />

      {/* ═══════════════════════════════════════════════════════
          NAVIGATION — overlays content on desktop so scrolling data
          shows through the transparent glass header; in-flow on mobile
          ═══════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-50 md:absolute md:inset-x-0 md:top-0">
        <MobileHeader />
        <DesktopNav />
        <TopBar />
      </div>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT — fixed-height panel; body scrolls internally
          beneath the transparent header
          ═══════════════════════════════════════════════════════ */}
      <main className="flex-1 min-h-0 flex flex-col px-3 md:px-5 lg:px-7 max-w-[1440px] mx-auto w-full relative z-10 pt-3 md:pt-0">
        <div
          key={location.pathname}
          className="animate-fade-in-up flex flex-col rounded-2xl relative overflow-hidden md:flex-1 md:min-h-0"
          style={{
            background: 'var(--panel-bg)',
            backdropFilter: 'var(--panel-blur)',
            WebkitBackdropFilter: 'var(--panel-blur)',
            border: '1px solid var(--panel-border-color)',
            boxShadow: 'var(--panel-inner-highlight), inset 0 0 80px rgba(var(--panel-accent-rgb),0.03), 0 0 0 1px rgba(var(--panel-accent-rgb),0.06), 0 0 40px rgba(var(--panel-accent-rgb),0.05), 0 0 80px rgba(var(--panel-accent2-rgb),0.03), var(--panel-drop-shadow)'
          }}>
          
          {/* Inner top highlight */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(var(--panel-accent-rgb),0.05) 0%, transparent 60%)'
            }}
          />

          {/* Dotted ambient texture across panel */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl opacity-[0.11]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(var(--panel-accent-rgb),0.6) 1px, transparent 1.5px)',
              backgroundSize: '24px 24px'
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

          {/* Scrollable body — content scrolls behind the transparent header */}
          <div className="relative z-10 md:flex-1 md:min-h-0 md:overflow-y-auto thin-scroll">
            <div className="p-4 md:p-6 md:pt-32 pb-28 md:pb-24">
              <Outlet />
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
      <MobileNav />
    </div>
  );
}