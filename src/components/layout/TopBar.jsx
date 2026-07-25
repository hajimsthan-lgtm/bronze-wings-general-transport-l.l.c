import { useLocation, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Globe, Plus } from 'lucide-react';

const operationsSubNav = [
{ key: 'trips', path: '/trips' },
{ key: 'expenses', path: '/expenses' }];


const adminSubNav = [
{ key: 'vehicles', path: '/admin/vehicles' },
{ key: 'drivers', path: '/admin/drivers' },
{ key: 'clients', path: '/admin/clients' },
{ key: 'vendors', path: '/admin/vendors' }];


const reportsSubNav = [
{ key: 'daily_report', path: '/reports/daily' },
{ key: 'profit_loss', path: '/reports/pnl' },
{ key: 'soa', path: '/reports/soa' }];


const subNavMap = {
  '/': [],
  '/settings': [],
  '/reports/daily': reportsSubNav,
  '/reports/pnl': reportsSubNav,
  '/reports/soa': reportsSubNav,
  '/expenses': operationsSubNav,
  '/trips': operationsSubNav,
  '/contracts': operationsSubNav,
  '/admin/vehicles': adminSubNav,
  '/admin/drivers': adminSubNav,
  '/admin/clients': adminSubNav,
  '/admin/vendors': adminSubNav,
  '/admin/documents': adminSubNav
};

export function hasSubNavForPath(pathname) {
  const matchedKey = Object.keys(subNavMap).find((k) => pathname === k || pathname.startsWith(k + '/'));
  return matchedKey ? subNavMap[matchedKey].length > 0 : false;
}

export default function TopBar() {
  const location = useLocation();
  const { t, toggleLanguage, language } = useI18n();

  const matchedKey = Object.keys(subNavMap).find((k) => location.pathname === k || location.pathname.startsWith(k + '/'));
  const subNav = matchedKey ? subNavMap[matchedKey] : [];

  if (subNav.length === 0) return null;

  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] md:top-20 z-40">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 py-2">
          {/* frosted sub-tab pill track */}
          <div className="flex items-center gap-1 rounded-full border border-border bg-muted/40 p-1 backdrop-blur-lg overflow-x-auto no-scrollbar flex-1 min-w-0">
            {subNav.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center h-8 px-4 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
                  isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`
                  }>
                  
                  {t(item.key)}
                </Link>);

            })}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(location.pathname === '/trips' || location.pathname === '/contracts') && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('ops:new-trip'))}
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> {t('new_trip')}
              </button>
            )}
            </div>
            </div>
      </div>
    </div>);

}