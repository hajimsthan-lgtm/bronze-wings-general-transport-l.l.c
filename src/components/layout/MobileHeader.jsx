import { Link, useNavigate } from 'react-router-dom';
import { Settings, GraduationCap, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCompanySettings } from '@/lib/companySettings';
import { useTour, gatherTourSteps } from '@/lib/tour';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import BrandName from '@/components/layout/BrandName';
import GlobalDateFilter from '@/components/layout/GlobalDateFilter';

export default function MobileHeader() {
  const { theme, toggleTheme, mode, toggleMode } = useTheme();
  const [logoUrl, setLogoUrl] = useState('');
  const tour = useTour();
  const { toast } = useToast();
  const navigate = useNavigate();
  const startTour = () => {
    const steps = gatherTourSteps();
    if (!steps.length) { toast({ title: 'No guided sections on this page' }); return; }
    tour.start(steps);
  };

  useEffect(() => {
    getCompanySettings().then((s) => setLogoUrl(s.logo_url));
  }, []);

  return (
    <header className="md:hidden sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, var(--header-tint-1) 0%, var(--header-tint-2) 100%)',
          backdropFilter: 'blur(12px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(12px) saturate(1.3)',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.30) 50%, transparent)' }} />
      <div
        className="relative h-14 px-4 flex items-center justify-between"
      >
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-lg blur-md opacity-60"
              style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)' }}
            />
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Bronze Wings"
                className="relative w-8 h-8 rounded-lg object-contain ring-1 ring-white/10"
              />
            ) : (
              <div className="relative w-8 h-8 rounded-lg border border-blue-500/30 bg-blue-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <span className="text-xs font-bold text-blue-400">BW</span>
              </div>
            )}
          </div>
          <BrandName variant="mobile" />
        </Link>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            title="Go back"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 transition-all hover:border-blue-500/30 hover:text-white flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <GlobalDateFilter />
          <button
            onClick={toggleMode}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0"
            style={{
              background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              color: 'hsl(var(--muted-foreground))',
            }}
            aria-label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {mode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            to="/settings"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 transition-all hover:border-blue-500/30 hover:text-white flex-shrink-0"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}