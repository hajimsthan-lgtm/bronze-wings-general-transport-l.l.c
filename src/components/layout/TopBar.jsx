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

const financialSubNav = [
  { key: 'invoices', path: '/invoices' },
  { key: 'payments', path: '/payments' },
];

const reportsSubNav = [
  { key: 'daily_report', path: '/reports/daily' },
  { key: 'profit_loss', path: '/reports/pnl' },
  { key: 'soa', path: '/reports/soa' },
];

const subNavMap = {
  '/': [],
  '/settings': [],
  '/trips': [
    { key: 'trips', path: '/trips' },
    { key: 'expenses', path: '/expenses' },
  ],
  '/expenses': [
    { key: 'trips', path: '/trips' },
    { key: 'expenses', path: '/expenses' },
  ],
  '/invoices': financialSubNav,
  '/payments': financialSubNav,
  '/reports/daily': reportsSubNav,
  '/reports/pnl': reportsSubNav,
  '/reports/soa': reportsSubNav,
  '/admin/vehicles': adminSubNav,
  '/admin/drivers': adminSubNav,
  '/admin/clients': adminSubNav,
  '/admin/vendors': adminSubNav,
  '/admin/documents': adminSubNav,
};

export default function TopBar() {
  const location = useLocation();
  const { t, toggleLanguage, language } = useI18n();

  const matchedKey = Object.keys(subNavMap).find(k => location.pathname === k || location.pathname.startsWith(k + '/'));
  const subNav = matchedKey ? subNavMap[matchedKey] : [];

  if (subNav.length === 0) return null;

  return (
    <div className="sticky top-0 md:top-14 z-40" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-11">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {subNav.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-200 border ${
                  location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    ? 'bg-primary/15 text-primary border-primary/25'
                    : 'glass-panel text-muted-foreground hover:text-foreground border-transparent'
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
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