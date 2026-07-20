import { Outlet, useLocation } from 'react-router-dom';
import DesktopNav from '@/components/layout/DesktopNav';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen professional-page-bg flex flex-col">
      <DesktopNav />
      <TopBar />
<main className="flex-1 pb-20 md:pb-6 px-3 md:px-5 lg:px-7 max-w-[1440px] mx-auto w-full pt-3 md:pt-4">
<div className="clay animate-fade-in rounded-3xl p-4 md:p-6" key={location.pathname} style={{ boxShadow: '9px 9px 22px hsl(var(--clay-shadow-dark)), -9px -9px 22px hsl(var(--clay-shadow-light)), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
  <Outlet />
  </div>
</main>
      <MobileNav />
    </div>
  );
}