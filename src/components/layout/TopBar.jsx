import { useLocation, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Globe, Plus } from 'lucide-react';
import ClientNavDropdown from './ClientNavDropdown';
import DriverNavDropdown from './DriverNavDropdown';
import VehicleNavDropdown from './VehicleNavDropdown';
import ReportClientDropdown from './ReportClientDropdown';

const operationsSubNav = [
{ key: 'trips', path: '/trips' },
{ key: 'expenses', path: '/expenses' }];


const adminSubNav = [
{ key: 'vehicles', path: '/admin/vehicles' },
{ key: 'drivers', path: '/admin/drivers' },
{ key: 'clients', path: '/admin/clients' }];


const reportsSubNav = [
{ key: 'daily_report', path: '/reports/daily', label: 'Daily' },
{ key: 'profit_loss', path: '/reports/pnl', label: 'P&L' },
{ key: 'soa', path: '/reports/soa', label: 'SOA' }];


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
        <div className="flex items-center justify-between h-11 py-1.5">
          {/* liquid-glass segmented sub-nav — distinct from main nav */}
          <div className="relative flex items-center gap-1 rounded-2xl border border-white/[0.07] bg-background/60 p-1 backdrop-blur-xl overflow-x-auto no-scrollbar flex-1 min-w-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_2px_5px_rgba(0,0,0,0.5)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.16) 50%,transparent)' }} />
            {subNav.map((item, i) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group/sub relative flex items-center gap-1.5 h-8 px-3 rounded-xl text-[10px] font-semibold uppercase tracking-[0.06em] whitespace-nowrap transition-all duration-300 border ${
                    isActive
                      ? 'bg-gradient-to-br from-primary/25 to-primary/[0.04] border-primary/40 text-white shadow-[0_0_18px_-4px_rgba(var(--panel-accent-rgb),0.55),inset_0_1px_0_rgba(255,255,255,0.08)]'
                      : 'border-transparent text-white/45 hover:text-white/80 hover:bg-white/[0.04]'
                  }`}>
                  <span className={`font-mono text-[8px] leading-none ${isActive ? 'text-primary' : 'text-white/25 group-hover/sub:text-white/40'}`}>{String(i + 1).padStart(2, '0')}</span>
                  {item.label || t(item.key)}
                  {isActive && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-[2px] h-3 rounded-full bg-primary shadow-[0_0_6px_rgba(var(--panel-accent-rgb),0.9)]" />}
                </Link>);

            })}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(location.pathname.startsWith('/admin/clients') || location.pathname.startsWith('/admin/vendors')) && <ClientNavDropdown />}
            {location.pathname.startsWith('/admin/vehicles') && <VehicleNavDropdown />}
            {location.pathname.startsWith('/admin/drivers') && <DriverNavDropdown />}
            {location.pathname.startsWith('/reports/') && <ReportClientDropdown />}
            {(location.pathname === '/trips' || location.pathname === '/contracts') && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('ops:new-trip'))}
                className="btn-new-trip inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold uppercase tracking-wider text-white transition-all whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> {t('new_trip')}
              </button>
            )}
            {location.pathname === '/expenses' && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('expenses:new'))}
                className="btn-new-expense inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold uppercase tracking-wider text-white transition-all whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> {t('add_new')}
              </button>
            )}
          </div>
            </div>
      </div>
    </div>);

}