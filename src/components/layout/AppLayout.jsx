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
      {/* Background is a single clean solid — no floating layers */}

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
      <main className="flex-1 min-h-0 flex flex-col w-full relative z-10">
        {/* Scrollable body — content sits directly on the app background */}
        <div
          key={location.pathname}
          className="animate-fade-in-up md:flex-1 md:min-h-0 md:overflow-y-auto thin-scroll"
        >
          <div className={`p-4 pb-28 md:pb-28 md:pr-6 md:pl-[60px] ${showHeader ? 'md:pt-32' : 'md:pt-5'}`}>
            <Outlet />
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