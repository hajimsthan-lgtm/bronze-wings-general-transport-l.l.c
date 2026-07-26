import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCompanySettings } from '@/lib/companySettings';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import BrandName from '@/components/layout/BrandName';

export default function MobileHeader() {
  const { theme, toggleTheme } = useTheme();
  const [logoUrl, setLogoUrl] = useState('');

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
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1 h-8 px-2.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/70 transition-all hover:border-blue-500/30 hover:text-white"
            aria-label="Switch theme"
          >
            <span className="w-2 h-2 rounded-full" style={{ background: theme === 'crimson' ? '#D62828' : '#3E92CC', boxShadow: `0 0 6px ${theme === 'crimson' ? '#D62828' : '#3E92CC'}` }} />
            {theme === 'crimson' ? 'Crimson' : 'Navy'}
          </button>
          <Link
            to="/settings"
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 transition-all hover:border-blue-500/30 hover:text-white"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}