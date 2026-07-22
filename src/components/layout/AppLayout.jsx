import { Outlet, useLocation } from 'react-router-dom';
import DesktopNav from '@/components/layout/DesktopNav';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';

export default function AppLayout() {
  const location = useLocation();

 return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#06080f]">
      <DesktopNav />
      <TopBar />
      <main className="flex-1 pb-24 md:pb-8 px-3 md:px-5 lg:px-7 max-w-[1440px] mx-auto w-full pt-3 md:pt-4 opacity-100">
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 40%, rgba(37,99,235,0.12) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 60%, rgba(59,130,246,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 50% 50% at 50% 0%, rgba(30,64,175,0.06) 0%, transparent 50%)
          `
        }}
      />
          
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>);

}