import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Route, Receipt, Truck, Users, Building2, ClipboardList, TrendingUp, FileText, Landmark, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';

const operationsSubNav = [
  { key: 'trips', path: '/trips' },
  { key: 'expenses', path: '/expenses' },
];
const adminSubNav = [
  { key: 'vehicles', path: '/admin/vehicles' },
  { key: 'drivers', path: '/admin/drivers' },
  { key: 'clients', path: '/admin/clients' },
];
const accountsSubNav = [
  { key: 'bank_reconciliation', path: '/reports/bank-reconciliation', label: 'Bank Rec' },
  { key: 'petty_cash', path: '/accounts/petty-cash', label: 'Petty Cash' },
];
const reportsSubNav = [
  { key: 'daily_report', path: '/reports/daily', label: 'Daily' },
  { key: 'profit_loss', path: '/reports/pnl', label: 'P&L' },
  { key: 'soa', path: '/reports/soa', label: 'SOA' },
];

export const subNavMap = {
  '/': [],
  '/settings': [],
  '/reports/daily': reportsSubNav,
  '/reports/pnl': reportsSubNav,
  '/reports/soa': reportsSubNav,
  '/reports/bank-reconciliation': accountsSubNav,
  '/accounts/petty-cash': accountsSubNav,
  '/expenses': operationsSubNav,
  '/trips': operationsSubNav,
  '/contracts': operationsSubNav,
  '/admin/vehicles': adminSubNav,
  '/admin/drivers': adminSubNav,
  '/admin/clients': adminSubNav,
  '/admin/vendors': adminSubNav,
  '/admin/documents': adminSubNav,
};

export const SUBNAV_ICON = {
  trips: Route, expenses: Receipt,
  vehicles: Truck, drivers: Users, clients: Building2,
  daily_report: ClipboardList, profit_loss: TrendingUp, soa: FileText,
  bank_reconciliation: Landmark, petty_cash: Wallet,
};

export const SUBNAV_STYLE = {
  trips: { from: '#3b82f6', to: '#1e3a8a', glow: '59,130,246' },
  expenses: { from: '#f59e0b', to: '#b45309', glow: '245,158,11' },
  vehicles: { from: '#6366f1', to: '#3730a3', glow: '99,102,241' },
  drivers: { from: '#10b981', to: '#047857', glow: '16,185,129' },
  clients: { from: '#f43f5e', to: '#9f1239', glow: '244,63,94' },
  daily_report: { from: '#06b6d4', to: '#0e7490', glow: '6,182,212' },
  profit_loss: { from: '#8b5cf6', to: '#5b21b6', glow: '139,92,246' },
  soa: { from: '#f97316', to: '#9a3412', glow: '249,115,22' },
  bank_reconciliation: { from: '#0ea5e9', to: '#0369a1', glow: '14,165,233' },
  petty_cash: { from: '#f59e0b', to: '#b45309', glow: '245,158,11' },
};

export function hasSubNavForPath(pathname) {
  const matchedKey = Object.keys(subNavMap).find((k) => pathname === k || pathname.startsWith(k + '/'));
  return matchedKey ? subNavMap[matchedKey].length > 0 : false;
}

export default function HeaderSubNav({ className = '' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const matchedKey = Object.keys(subNavMap).find((k) => location.pathname === k || location.pathname.startsWith(k + '/'));
  const subNav = matchedKey ? subNavMap[matchedKey] : [];
  if (!subNav.length) return null;

  const activeIndex = Math.max(0, subNav.findIndex((item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/')));
  const activeItem = subNav[activeIndex] || subNav[0];
  const activeSt = SUBNAV_STYLE[activeItem.key] || SUBNAV_STYLE.trips;
  const ActiveIcon = SUBNAV_ICON[activeItem.key] || FileText;
  const activeLabel = activeItem.label || t(activeItem.key);

  const switchTo = (dir) => {
    const next = (activeIndex + dir + subNav.length) % subNav.length;
    navigate(subNav[next].path);
  };

  return (
    <>
      {/* Desktop: full row of pills */}
      <nav key={location.pathname} className={`hidden sm:flex items-center gap-2.5 ${className}`}>
        {subNav.map((item, i) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = SUBNAV_ICON[item.key] || FileText;
          const st = SUBNAV_STYLE[item.key] || SUBNAV_STYLE.trips;
          const label = item.label || t(item.key);
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{ animation: `subnav-light 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.07}s both` }}
              className="group/sub relative flex items-center gap-2 h-9 px-3.5 rounded-full transition-all duration-300 hover:-translate-y-0.5 flex-shrink-0"
            >
              <span
                className="absolute inset-0 rounded-full transition-all duration-300"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, rgba(${st.glow},0.22), rgba(${st.glow},0.10))`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? `rgba(${st.glow},0.45)` : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isActive
                    ? `inset 0 1px 0 rgba(255,255,255,0.10), 0 3px 10px rgba(${st.glow},0.22)`
                    : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              />
              <Icon className="relative w-3.5 h-3.5 transition-colors duration-300" style={{
                color: isActive ? `rgb(${st.glow})` : 'hsl(var(--muted-foreground))',
              }} />
              <span
                className="relative text-[12px] font-semibold tracking-[0.04em] whitespace-nowrap transition-colors duration-300"
                style={{ color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
              >
                {label}
              </span>
              {isActive && (
                <span
                  className="relative h-1.5 w-1.5 rounded-full"
                  style={{ background: `rgb(${st.glow})`, boxShadow: `0 0 6px rgba(${st.glow},0.7)` }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mobile: compact switcher with chevrons */}
      <nav className={`sm:hidden flex items-center gap-1.5 ${className}`}>
        <button
          onClick={() => switchTo(-1)}
          className="relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 active:scale-90 flex-shrink-0"
          aria-label="Previous"
        >
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
          <ChevronLeft className="relative w-4 h-4 text-white/50" />
        </button>

        <Link
          to={activeItem.path}
          className="relative flex items-center gap-2 h-9 px-4 rounded-full transition-all duration-300 flex-1 justify-center min-w-0"
        >
          <span
            className="absolute inset-0 rounded-full transition-all duration-300"
            style={{
              background: `linear-gradient(135deg, rgba(${activeSt.glow},0.22), rgba(${activeSt.glow},0.10))`,
              border: `1px solid rgba(${activeSt.glow},0.45)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 3px 10px rgba(${activeSt.glow},0.22)`,
            }}
          />
          <ActiveIcon className="relative w-3.5 h-3.5 flex-shrink-0" style={{ color: `rgb(${activeSt.glow})` }} />
          <span
            className="relative text-[11px] font-semibold tracking-[0.02em] whitespace-nowrap"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            {activeLabel}
          </span>
          <span
            className="relative h-1.5 w-1.5 rounded-full flex-shrink-0"
            style={{ background: `rgb(${activeSt.glow})`, boxShadow: `0 0 6px rgba(${activeSt.glow},0.7)` }}
          />
        </Link>

        <button
          onClick={() => switchTo(1)}
          className="relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 active:scale-90 flex-shrink-0"
          aria-label="Next"
        >
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
          <ChevronRight className="relative w-4 h-4 text-white/50" />
        </button>
      </nav>
    </>
  );
}