import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import DesktopNav from '@/components/layout/DesktopNav';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';
import MobileHeader from '@/components/layout/MobileHeader';
import EdgeQuickRail from '@/components/dashboard/EdgeQuickRail';
import AppFooter from '@/components/layout/AppFooter';
import ContentSidebar from '@/components/layout/ContentSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRailCollapsed } from '@/lib/railVisibility';

export default function AppLayout() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const railCollapsed = useRailCollapsed();
  // match the real sidebar width (72 collapsed / 236 expanded) + a small gap
  const railWidth = railCollapsed ? 76 : 244;
  const headerLeft = railCollapsed ? 64 : 244;

  return (
    <div className="min-h-[100dvh] md:h-[100dvh] flex flex-col relative md:overflow-hidden" style={{ background: 'var(--app-bg)' }}>
      {/* ═══════════════════════════════════════════════════════
          NAVIGATION — overlays content on desktop so scrolling data
          shows through the transparent glass header; in-flow on mobile
          ═══════════════════════════════════════════════════════ */}
      <div
        className="sticky top-0 z-50 md:absolute md:right-0 md:top-0"
        style={{ left: headerLeft, transition: 'left 0.35s cubic-bezier(0.16,1,0.3,1)' }}
      >
        <MobileHeader />
        <DesktopNav />
        <TopBar />
      </div>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT — fixed-height panel; body scrolls internally
          beneath the transparent header, with framer-motion route transitions
          ═══════════════════════════════════════════════════════ */}
      <main className="flex-1 min-h-0 flex flex-col w-full relative z-10">
        <div className="md:flex-1 md:min-h-0 md:overflow-y-auto thin-scroll">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={`p-4 pb-36 md:p-5 md:pb-28 md:pr-8 md:pt-36`}
              style={{
                paddingLeft: isMobile ? undefined : `${railWidth}px`,
                transition: 'padding-left 0.35s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <ContentSidebar />
      <EdgeQuickRail />
      <AppFooter />
      <MobileNav />
    </div>
  );
}