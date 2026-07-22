import { useLocation, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Globe } from 'lucide-react';
import ThemeToggle from '@/components/common/ThemeToggle';

const adminSubNav = [
  { key: 'vehicles', path: '/admin/vehicles' },
  { key: 'drivers', path: '/admin/drivers' },
  { key: 'clients', path: '/admin/clients' },
  { key: 'vendors', path: '/admin/vendors' },
  { key: 'documents', path: '/admin/documents' },
];

const reportsSubNav = [
  { key: 'daily_report', path: '/reports/daily' },
  { key: 'profit_loss', path: '/reports/pnl' },
  { key: 'soa', path: '/reports/soa' },
  { key: 'expenses', path: '/expenses' },
  { key: 'fuel', path: '/fuel' },
];

const subNavMap = {
  '/': [],
  '/settings': [],
  '/reports/daily': reportsSubNav,
  '/reports/pnl': reportsSubNav,
  '/reports/soa': reportsSubNav,
  '/expenses': reportsSubNav,
  '/fuel': reportsSubNav,
  '/admin/vehicles': adminSubNav,
  '/admin/drivers': adminSubNav,
  '/admin/clients': adminSubNav,
  '/admin/vendors': adminSubNav,
  '/admin/documents': adminSubNav,
};

export function hasSubNavForPath(pathname) {
  const matchedKey = Object.keys(subNavMap).find(k => pathname === k || pathname.startsWith(k + '/'));
  return matchedKey ? subNavMap[matchedKey].length > 0 : false;
}

export default function TopBar() {
  const location = useLocation();
  const { t, toggleLanguage, language } = useI18n();

  const matchedKey = Object.keys(subNavMap).find(k => location.pathname === k || location.pathname.startsWith(k + '/'));
  const subNav = matchedKey ? subNavMap[matchedKey] : [];

  if (subNav.length === 0) return null;

  return (
    <div className="sticky top-0 md:top-14 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 py-2">
          {/* frosted sub-tab pill track */}
          <div className="flex items-center gap-2 rounded-2xl border border-white/5 bg-slate-950/40 p-1.5 backdrop-blur-lg overflow-x-auto no-scrollbar">
            {subNav.map(item => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 ${
                    isActive ? 'text-blue-400' : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                  }`}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.20) 0%, rgba(15,23,42,0.80) 100%)',
                    border: '1px solid rgba(96,165,250,0.35)',
                    boxShadow: '0 4px 16px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.12)',
                  } : { border: '1px solid transparent' }}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle className="md:hidden" />
            <button
              onClick={toggleLanguage}
              className="md:hidden flex items-center gap-1 px-2 py-1 rounded text-[10px] text-muted-foreground"
              aria-label="Toggle language"
            >
              <Globe className="w-3 h-3" />
              {language === 'en' ? 'AR' : 'EN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}