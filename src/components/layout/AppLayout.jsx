import { Outlet, useLocation } from 'react-router-dom';
import DesktopNav from '@/components/layout/DesktopNav';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';
import MobileHeader from '@/components/layout/MobileHeader';
import EdgeQuickRail from '@/components/dashboard/EdgeQuickRail';
import AppFooter from '@/components/layout/AppFooter';
import ContentSidebar from '@/components/layout/ContentSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRailExpanded } from '@/lib/railVisibility';

export default function AppLayout() {
  const location = useLocation();
  const showHeader = true;
  const isMobile = useIsMobile();
  const railWidth = 208;
  const railExpanded = useRailExpanded();

  return (
    <div className="min-h-[100dvh] md:h-[100dvh] flex flex-col relative md:overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      {/* ═══════════════════════════════════════════════════════
          AMBIENT BACKGROUND — stripped to a single subtle layer so
          cards, tables and text stay crisp and high-contrast.
          ═══════════════════════════════════════════════════════ */}
      {/* Background is a single clean solid — no floating layers */}

      {/* ── Page dim overlay — activates when the nav rail is expanded (hover automation) ── */}
      {railExpanded && (
        <div
          className="hidden md:block fixed inset-0 z-[40] pointer-events-none transition-opacity duration-300"
          style={{ background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(2px)' }}
        />
      )}

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
          <div
            className={`p-5 pb-28 md:pb-28 md:pr-8 ${showHeader ? 'md:pt-36' : 'md:pt-6'}`}
            style={{
              paddingLeft: isMobile ? undefined : `${railWidth}px`,
              transition: 'padding-left 0.45s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
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