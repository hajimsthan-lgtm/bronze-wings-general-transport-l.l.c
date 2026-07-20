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
<main className="flex-1 pb-20 md:pb-6 px-4 md:px-6 lg:px-8 max-w-[1440px] mx-auto w-full">
<div className="animate-fade-in" key={location.pathname}>
  <Outlet />
  </div>
</main>
      <MobileNav />
    </div>
  );
}