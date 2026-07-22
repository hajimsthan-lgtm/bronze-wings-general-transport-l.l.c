import { Outlet, useLocation } from 'react-router-dom';
import DesktopNav from '@/components/layout/DesktopNav';
import MobileNav from '@/components/layout/MobileNav';
import TopBar from '@/components/layout/TopBar';

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#06080f]">
      {/* ═══════════════════════════════════════════
          LAYER 1: Deep animated ambient gradient
          ═══════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════
          LAYER 2: Subtle noise texture for depth
          ═══════════════════════════════════════════ */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px'
        }}
      />

      {/* ═══════════════════════════════════════════
          LAYER 3: Fine grid pattern (subtle)
          ═══════════════════════════════════════════ */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px'
        }}
      />

      {/* ═══════════════════════════════════════════
          LAYER 4: Top ambient light leak
          ═══════════════════════════════════════════ */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none z-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }}
      />

      {/* ═══════════════════════════════════════════
          NAVIGATION & TOP BAR
          ═══════════════════════════════════════════ */}
      <DesktopNav />
      <TopBar />

      {/* ═══════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════ */}
      <main className="flex-1 pb-24 md:pb-8 px-3 md:px-5 lg:px-7 max-w-[1440px] mx-auto w-full pt-3 md:pt-4 relative z-10">
        <div
          key={location.pathname}
          className="animate-fade-in p-4 md:p-6 rounded-2xl relative overflow-hidden"
          style={{
            /* Multi-layer glassmorphism background */
            background: `
              linear-gradient(
                180deg,
                rgba(16, 20, 30, 0.65) 0%,
                rgba(11, 14, 22, 0.85) 50%,
                rgba(8, 11, 18, 0.90) 100%
              )
            `,
            /* Enhanced backdrop blur */
            backdropFilter: 'blur(40px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.2)',
            /* Multi-layer border for depth */
            border: '1px solid rgba(59,130,246,0.12)',
            /* Complex shadow system */
            boxShadow: `
              /* Inner glow (top edge highlight) */
              inset 0 1px 0 rgba(255,255,255,0.06),
              /* Inner ambient */
              inset 0 0 80px rgba(59,130,246,0.03),
              /* Outer soft glow */
              0 0 0 1px rgba(59,130,246,0.08),
              0 0 40px rgba(59,130,246,0.06),
              0 0 80px rgba(37,99,235,0.04),
              /* Bottom depth shadow */
              0 20px 60px rgba(0,0,0,0.4)
            `
          }}>
          
          {/* Inner subtle gradient overlay for card depth */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: `
                radial-gradient(
                  ellipse 80% 40% at 50% 0%,
                  rgba(59,130,246,0.04) 0%,
                  transparent 60%
                )
              `
            }}
          />

          {/* Corner accent glows */}
          <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none opacity-40" 
            style={{
              background: 'radial-gradient(circle at top left, rgba(59,130,246,0.15), transparent 70%)'
            }}
          />
          <div className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none opacity-20" 
            style={{
              background: 'radial-gradient(circle at bottom right, rgba(37,99,235,0.1), transparent 70%)'
            }}
          />

          {/* Content */}
          <div className="relative z-10">
            <Outlet />
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}