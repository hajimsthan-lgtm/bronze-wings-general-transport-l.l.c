import { useLocation, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Globe, Plus, Route, Receipt, Truck, Users, Building2, ClipboardList, TrendingUp, FileText } from 'lucide-react';
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

const SUBNAV_ICON = {
  trips: Route, expenses: Receipt,
  vehicles: Truck, drivers: Users, clients: Building2,
  daily_report: ClipboardList, profit_loss: TrendingUp, soa: FileText,
};
const SUBNAV_COLOR = {
  trips: '#3b82f6', expenses: '#f59e0b',
  vehicles: '#6366f1', drivers: '#10b981', clients: '#f43f5e',
  daily_report: '#06b6d4', profit_loss: '#8b5cf6', soa: '#f97316',
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
        <div className="flex items-center justify-between py-1.5">
          {/* individual clay-glass icon buttons — no panel */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0 py-1 pb-7">
            {subNav.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              const Icon = SUBNAV_ICON[item.key] || FileText;
              const color = SUBNAV_COLOR[item.key] || '#3b82f6';
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onMouseMove={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
                    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
                  }}
                  className="group/sub relative flex items-center justify-center h-9 w-9 rounded-2xl border border-white/10 transition-all duration-300 hover:-translate-y-0.5 flex-shrink-0"
                  style={isActive ? {
                    background: `linear-gradient(160deg, ${color}40 0%, ${color}14 60%, rgba(0,0,0,0.30) 100%)`,
                    boxShadow: `inset 0 1px 0 ${color}80, inset 0 -2px 5px rgba(0,0,0,0.45), 0 6px 14px rgba(0,0,0,0.40), 0 0 0 1px ${color}55, 0 0 22px -4px ${color}99`,
                    borderColor: `${color}66`,
                  } : {
                    background: `linear-gradient(160deg, ${color}26 0%, ${color}0a 60%, rgba(0,0,0,0.28) 100%)`,
                    boxShadow: `inset 0 1px 0 ${color}55, inset 0 -2px 4px rgba(0,0,0,0.40), 0 4px 10px rgba(0,0,0,0.35), 0 0 0 1px ${color}1a`,
                  }}
                >
                  {/* cursor-follow glow */}
                  <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover/sub:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(circle 70px at var(--mx,50%) var(--my,50%), ${color}66, transparent 70%)` }} />
                  {/* top specular highlight */}
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-2xl opacity-60" style={{ background: `linear-gradient(180deg, ${color}40, transparent)` }} />
                  <Icon className="relative w-4 h-4 transition-transform duration-300 group-hover/sub:scale-110" style={{ color, filter: isActive ? `drop-shadow(0 0 6px ${color})` : 'none' }} />
                  {/* hover name — shining colored text */}
                  <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.1em] opacity-0 translate-y-1 group-hover/sub:opacity-100 group-hover/sub:translate-y-0 transition-all duration-300 z-50" style={{ color, textShadow: `0 0 8px ${color}, 0 0 14px ${color}99, 0 0 20px ${color}55` }}>
                    {item.label || t(item.key)}
                  </span>
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