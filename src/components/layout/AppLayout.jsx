import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ShellSidebar from '@/components/layout/ShellSidebar';
import ShellNavbar from '@/components/layout/ShellNavbar';
import TopBar from '@/components/layout/TopBar';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileNav from '@/components/layout/MobileNav';
import MobileCanvasBackground from '@/components/mobile/MobileCanvasBackground';
import EdgeQuickRail from '@/components/dashboard/EdgeQuickRail';
import AppFooter from '@/components/layout/AppFooter';
import PullToRefresh from '@/components/common/PullToRefresh';

export default function AppLayout() {
  const location = useLocation();
  const [navQuery, setNavQuery] = useState('');

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden"
      style={{ background: 'var(--app-bg)' }}
    >
      <MobileCanvasBackground />

      {/* Mobile header — full-bleed on small screens */}
      <MobileHeader />

      {/* Rounded outer shell — desktop only gets the card container */}
      <div className="flex-1 min-h-0 md:p-4 relative z-10 flex">
        <div
          className="flex flex-col md:flex-row flex-1 min-h-0 md:rounded-[24px] md:border md:border-border/60 overflow-hidden"
          style={{
            background: 'var(--panel-bg)',
            boxShadow: 'var(--panel-drop-shadow)',
          }}
        >
          {/* Left sidebar — 220px, desktop only */}
          <ShellSidebar query={navQuery} />

          {/* Right column — navbar + sub-bar + scrollable main + footer */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col">
            <ShellNavbar query={navQuery} setQuery={setNavQuery} />
            <TopBar />
            <main
              className="flex-1 min-h-0 overflow-y-auto thin-scroll"
              style={{
                background: 'var(--bg-canvas)',
                overscrollBehaviorY: 'contain',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <PullToRefresh>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="relative p-0 pb-32 md:p-8 md:pb-16"
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              </PullToRefresh>
            </main>
            <AppFooter />
          </div>
        </div>
      </div>

      {/* Floating / mobile-only layers */}
      <EdgeQuickRail />
      <MobileNav />
    </div>
  );
}