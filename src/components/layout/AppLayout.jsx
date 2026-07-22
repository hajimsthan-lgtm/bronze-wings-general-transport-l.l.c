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
      <main className="flex-1 pb-24 md:pb-8 px-3 md:px-5 lg:px-7 max-w-[1440px] mx-auto w-full pt-3 md:pt-4 opacity-100">
        <div
          key={location.pathname}
          className="animate-fade-in p-4 md:p-6 rounded-xl backdrop-blur-2xl border border-primary/20 opacity-100 relative overflow-hidden"
          style={{
            backgroundImage: "linear-gradient(180deg, rgba(11,14,20,0.72) 0%, rgba(11,14,20,0.86) 100%), url('https://media.base44.com/images/public/6a5e20fffaa71b55806cccc8/a1fbb78bd_generated_image.png')",
            backgroundSize: 'cover, 56px 56px',
            backgroundRepeat: 'no-repeat, repeat',
            boxShadow: '0 0 0 1px rgba(59,130,246,0.16), 0 0 28px rgba(59,130,246,0.16), 0 0 64px rgba(37,99,235,0.10), inset 0 1px 0 rgba(255,255,255,0.04)'
          }}>
          
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>);

}