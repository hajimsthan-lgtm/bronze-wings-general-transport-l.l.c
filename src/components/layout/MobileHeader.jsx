import { Link } from 'react-router-dom';
import { Settings, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCompanySettings } from '@/lib/companySettings';
import { useI18n } from '@/lib/i18n';

export default function MobileHeader() {
  const { language, toggleLanguage } = useI18n();
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    getCompanySettings().then((s) => setLogoUrl(s.logo_url));
  }, []);

  return (
    <header className="md:hidden sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(10,14,23,0.18) 0%, rgba(10,14,23,0.10) 100%)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.25)',
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
          <div className="leading-tight">
            <span className="block font-extrabold tracking-tight text-white text-sm">Bronze Wings</span>
            <span className="block text-[8px] uppercase tracking-[0.18em] text-white/40">General Transport</span>
          </div>
        </Link>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 h-8 px-2.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/70 transition-all hover:border-blue-500/30 hover:text-white"
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5" />
            {language === 'en' ? 'ع' : 'EN'}
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