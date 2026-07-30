import { Outlet, useLocation } from 'react-router-dom';
import DesktopNav from '@/components/layout/DesktopNav';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';
import MobileHeader from '@/components/layout/MobileHeader';
import EdgeQuickRail from '@/components/dashboard/EdgeQuickRail';
import AppFooter from '@/components/layout/AppFooter';
import ContentSidebar from '@/components/layout/ContentSidebar';

export default function AppLayout() {
  const location = useLocation();
  const showHeader = true;

  return (
    <div className="min-h-[100dvh] md:h-[100dvh] flex flex-col relative md:overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      {/* ═══════════════════════════════════════════════════════
          AMBIENT BACKGROUND — stripped to a single subtle layer so
          cards, tables and text stay crisp and high-contrast.
          ═══════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-[8%] left-[12%] w-[460px] h-[460px] rounded-full opacity-[0.12] animate-float"
          style={{ background: 'radial-gradient(circle, rgba(var(--panel-accent-rgb),0.22) 0%, transparent 70%)', filter: 'blur(90px)' }}
        />
        <div
          className="absolute bottom-[6%] right-[8%] w-[380px] h-[380px] rounded-full opacity-[0.10] animate-float"
          style={{ background: 'radial-gradient(circle, rgba(var(--panel-accent2-rgb),0.20) 0%, transparent 70%)', filter: 'blur(80px)', animationDelay: '-3s' }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════
          NAVIGATION — overlays content on desktop so scrolling data
          shows through the transparent glass header; in-flow on mobile
          ═══════════════════════════════════════════════════════ */}
      {showHeader && (
        <div className="sticky top-0 z-50 md:absolute md:inset-x-0 md:top-0">
          <MobileHeader />
          <DesktopNav />
          <TopBar />
        </div>
      )}

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
            boxShadow: 'var(--panel-inner-highlight), 0 0 0 1px rgba(var(--panel-accent-rgb),0.05), var(--panel-drop-shadow)'
          }}
        >
          {/* subtle top highlight only */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{ background: 'radial-gradient(ellipse 80% 36% at 50% 0%, rgba(var(--panel-accent-rgb),0.04) 0%, transparent 60%)' }}
          />

          {/* Scrollable body — content scrolls behind the transparent header */}
          <div className="relative z-10 md:flex-1 md:min-h-0 md:overflow-y-auto thin-scroll">
            <div className={`p-4 pb-28 md:pb-28 md:pr-6 md:pl-[60px] ${showHeader ? 'md:pt-32' : 'md:pt-5'}`}>
              <Outlet />
            </div>
          </div>
        </div>
      </main>

      <ContentSidebar />
      <EdgeQuickRail />
      <AppFooter />
      <MobileNav />
    </div>
  );
}