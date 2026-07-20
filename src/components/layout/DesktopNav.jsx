import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, Truck, DollarSign, BarChart3, Shield, Globe, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCompanySettings } from '@/lib/companySettings';

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
    if ((location.pathname.startsWith('/admin/salary') || location.pathname.startsWith('/admin/services')) && path === '/invoices') return true;
    return location.pathname.startsWith(path.split('/').slice(0, 2).join('/'));
  };

  return (
    <nav className="hidden md:flex items-center justify-between px-6 lg:px-8 h-14 sticky top-0 z-50">
      <div className="flex items-center gap-1">
        <Link to="/" className="flex items-center gap-2.5 mr-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Bronze Wings" className="w-8 h-8 rounded-lg object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">BW</span>
            </div>
          )}
          <span className="font-display font-semibold text-foreground text-sm tracking-tight">
            Bronze Wings
          </span>
        </Link>

        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.key}
              to={item.path}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Link to="/settings" className="flex items-center px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors" aria-label="Settings">
          <Settings className="w-4 h-4" />
        </Link>
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-colors"
          aria-label="Toggle language"
        >
          <Globe className="w-3.5 h-3.5" />
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>
    </nav>
  );
}