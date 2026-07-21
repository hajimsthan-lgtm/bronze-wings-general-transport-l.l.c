import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, Truck, DollarSign, BarChart3, Shield, Globe, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCompanySettings } from '@/lib/companySettings';
import ThemeToggle from '@/components/common/ThemeToggle';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/' },
  { key: 'operations', icon: Truck, path: '/trips' },
  { key: 'financials', icon: DollarSign, path: '/invoices' },
  { key: 'reports', icon: BarChart3, path: '/reports/daily' },
  { key: 'admin', icon: Shield, path: '/admin/vehicles' },
];

export default function DesktopNav() {
  const { t, language, toggleLanguage } = useI18n();
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState('');
  useEffect(() => { getCompanySettings().then(s => setLogoUrl(s.logo_url)); }, []);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path.split('/').slice(0, 2).join('/'));
  };

  return (
    <nav className="hidden md:block sticky top-0 z-50">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-xl border-b border-primary/15" style={{ boxShadow: '0 1px 0 0 rgba(168,85,247,0.10), 0 10px 34px -14px rgba(168,85,247,0.22)' }} />
      <div className="relative max-w-[1440px] mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt="Bronze Wings" className="w-9 h-9 rounded-full object-contain ring-1 ring-white/10" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-300 via-primary to-violet-700 flex items-center justify-center shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),0_0_16px_rgba(168,85,247,0.4)]">
              <span className="text-white font-display font-bold text-[10px]">BW</span>
            </div>
          )}
          <div className="leading-tight">
            <span className="block font-display font-bold text-foreground text-[15px] tracking-tight">Bronze Wings</span>
            <span className="block text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Fleet Suite</span>
          </div>
        </Link>

        {/* Center segmented nav */}
        <div className="glass-panel rounded-full flex items-center gap-1 p-1">
          {navItems.map(item => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-widest transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-br from-primary to-violet-600 text-white shadow-[0_0_18px_rgba(168,85,247,0.45)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.05]'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full glass-panel text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5" />
            {language === 'en' ? 'العربية' : 'English'}
          </button>
          <Link to="/settings" className="w-9 h-9 rounded-full glass-panel flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Settings">
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}