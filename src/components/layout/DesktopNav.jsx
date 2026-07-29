import { Link } from 'react-router-dom';
import { useTheme } from '@/lib/theme';
import { Settings, GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCompanySettings } from '@/lib/companySettings';
import { useTour, gatherTourSteps } from '@/lib/tour';
import { useToast } from '@/components/ui/use-toast';
import LiveClock from '@/components/common/LiveClock';
import BrandName from '@/components/layout/BrandName';

const THEME_SWATCH = { crimson: '#D62828', navy: '#3E92CC', emerald: '#10b981' };
const THEME_LABEL = { crimson: 'Crimson', navy: 'Navy', emerald: 'Emerald' };

export default function DesktopNav() {
  const { theme, toggleTheme } = useTheme();
  const [logoUrl, setLogoUrl] = useState('');
  useEffect(() => { getCompanySettings().then((s) => setLogoUrl(s.logo_url)); }, []);

  const tour = useTour();
  const { toast } = useToast();
  const startTour = () => {
    const steps = gatherTourSteps();
    if (!steps.length) { toast({ title: 'No guided sections on this page' }); return; }
    tour.start(steps);
  };

  return (
    <nav className="hidden md:block sticky top-0 z-50">
      {/* dark satin glass surface */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, var(--header-tint-1) 0%, var(--header-tint-2) 100%)',
        backdropFilter: 'blur(14px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.3)',
      }} />
      {/* top specular highlight */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.16) 50%, transparent 100%)' }} />
      {/* gradient bottom hairline */}
      <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.30) 50%, transparent 100%)' }} />
      {/* centered ambient blue light-leak */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 h-16 w-2/3" style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(59,130,246,0.06), transparent 70%)' }} />

      <div className="relative max-w-[1440px] mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group/brand">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl blur-md opacity-70" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)' }} />
            {logoUrl ?
            <img src={logoUrl} alt="Bronze Wings" className="relative w-9 h-9 rounded-xl object-contain ring-1 ring-white/10" /> :

            <div className="relative w-9 h-9 rounded-xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <span className="text-sm font-bold text-blue-400">BW</span>
              </div>
            }
          </div>
          <BrandName variant="desktop" />
        </Link>

        {/* Right controls — dark glass circles */}
        <div className="flex items-center gap-2">
          <LiveClock />
          <button
            onClick={startTour}
            className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-blue-500/15 border border-blue-500/40 text-xs font-semibold text-blue-200 transition-all hover:bg-blue-500/25 hover:text-white"
            aria-label="Info Journey"
            title="Info Journey — guide me through this page"
          >
            <GraduationCap className="w-4 h-4" />
            <span className="hidden lg:inline">Tour</span>
          </button>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 transition-all hover:border-blue-500/30 hover:bg-white/10 hover:text-white"
            aria-label="Switch theme">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: THEME_SWATCH[theme] || '#3E92CC', boxShadow: `0 0 8px ${THEME_SWATCH[theme] || '#3E92CC'}` }} />
            {THEME_LABEL[theme] || 'Navy'}
          </button>
          <Link to="/settings" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 transition-all hover:border-blue-500/30 hover:bg-white/10 hover:text-white" aria-label="Settings">
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}