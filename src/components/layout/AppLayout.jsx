import { Outlet, useLocation } from 'react-router-dom';
import DesktopNav from '@/components/layout/DesktopNav';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bolt-atmosphere-bg flex flex-col">
      <DesktopNav />
      <TopBar />
      <main className="flex-1 pb-24 md:pb-8 px-3 md:px-5 lg:px-7 max-w-[1440px] mx-auto w-full pt-3 md:pt-4">
        <div
          key={location.pathname}
          className="animate-fade-in p-4 md:p-6 rounded-[1.25rem] backdrop-blur-2xl border border-violet-500/15"
          style={{
            background: 'linear-gradient(180deg, rgba(168,85,247,0.06) 0%, rgba(15,23,42,0.55) 100%)',
            boxShadow: '0 0 0 1px rgba(168,85,247,0.10), 0 0 30px rgba(168,85,247,0.18), 0 0 70px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.05)'
          }}
        >
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
}