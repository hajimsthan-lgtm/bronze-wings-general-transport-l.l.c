import { useLocation, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { ChevronRight, Globe } from 'lucide-react';

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
  '/invoices': [
    { key: 'invoices', path: '/invoices' },
    { key: 'payments', path: '/payments' },
    { key: 'bank', path: '/bank' },
    { key: 'cash', path: '/cash' },
    { key: 'salary', path: '/admin/salary' },
    { key: 'services', path: '/admin/services' },
  ],
  '/payments': [
    { key: 'invoices', path: '/invoices' },
    { key: 'payments', path: '/payments' },
    { key: 'bank', path: '/bank' },
    { key: 'cash', path: '/cash' },
    { key: 'salary', path: '/admin/salary' },
    { key: 'services', path: '/admin/services' },
  ],
  '/bank': [
    { key: 'invoices', path: '/invoices' },
    { key: 'payments', path: '/payments' },
    { key: 'bank', path: '/bank' },
    { key: 'cash', path: '/cash' },
    { key: 'salary', path: '/admin/salary' },
    { key: 'services', path: '/admin/services' },
  ],
  '/cash': [
    { key: 'invoices', path: '/invoices' },
    { key: 'payments', path: '/payments' },
    { key: 'bank', path: '/bank' },
    { key: 'cash', path: '/cash' },
    { key: 'salary', path: '/admin/salary' },
    { key: 'services', path: '/admin/services' },
  ],
  '/reports/daily': [
    { key: 'daily_report', path: '/reports/daily' },
    { key: 'profit_loss', path: '/reports/pnl' },
    { key: 'soa', path: '/reports/soa' },
  ],
  '/reports/pnl': [
    { key: 'daily_report', path: '/reports/daily' },
    { key: 'profit_loss', path: '/reports/pnl' },
    { key: 'soa', path: '/reports/soa' },
  ],
  '/reports/soa': [
    { key: 'daily_report', path: '/reports/daily' },
    { key: 'profit_loss', path: '/reports/pnl' },
    { key: 'soa', path: '/reports/soa' },
  ],
  '/admin/vehicles': [
    { key: 'vehicles', path: '/admin/vehicles' },
    { key: 'drivers', path: '/admin/drivers' },
    { key: 'clients', path: '/admin/clients' },
    { key: 'vendors', path: '/admin/vendors' },
    { key: 'documents', path: '/admin/documents' },
  ],
  '/admin/drivers': [
    { key: 'vehicles', path: '/admin/vehicles' },
    { key: 'drivers', path: '/admin/drivers' },
    { key: 'clients', path: '/admin/clients' },
    { key: 'vendors', path: '/admin/vendors' },
    { key: 'documents', path: '/admin/documents' },
  ],
  '/admin/clients': [
    { key: 'vehicles', path: '/admin/vehicles' },
    { key: 'drivers', path: '/admin/drivers' },
    { key: 'clients', path: '/admin/clients' },
    { key: 'vendors', path: '/admin/vendors' },
    { key: 'documents', path: '/admin/documents' },
  ],
  '/admin/vendors': [
    { key: 'vehicles', path: '/admin/vehicles' },
    { key: 'drivers', path: '/admin/drivers' },
    { key: 'clients', path: '/admin/clients' },
    { key: 'vendors', path: '/admin/vendors' },
    { key: 'documents', path: '/admin/documents' },
  ],
  '/admin/documents': [
    { key: 'vehicles', path: '/admin/vehicles' },
    { key: 'drivers', path: '/admin/drivers' },
    { key: 'clients', path: '/admin/clients' },
    { key: 'vendors', path: '/admin/vendors' },
    { key: 'documents', path: '/admin/documents' },
  ],
  '/admin/salary': [
    { key: 'invoices', path: '/invoices' },
    { key: 'payments', path: '/payments' },
    { key: 'bank', path: '/bank' },
    { key: 'cash', path: '/cash' },
    { key: 'salary', path: '/admin/salary' },
    { key: 'services', path: '/admin/services' },
  ],
  '/admin/services': [
    { key: 'invoices', path: '/invoices' },
    { key: 'payments', path: '/payments' },
    { key: 'bank', path: '/bank' },
    { key: 'cash', path: '/cash' },
    { key: 'salary', path: '/admin/salary' },
    { key: 'services', path: '/admin/services' },
  ],
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
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {subNav.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                    ? 'bg-white/[0.08] text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
          </div>
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
  );
}