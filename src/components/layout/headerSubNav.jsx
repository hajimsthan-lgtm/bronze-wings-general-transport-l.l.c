import { useLocation, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Route, Receipt, Truck, Users, Building2, ClipboardList, TrendingUp, FileText, Landmark } from 'lucide-react';

const operationsSubNav = [
  { key: 'trips', path: '/trips' },
  { key: 'expenses', path: '/expenses' },
];
const adminSubNav = [
  { key: 'vehicles', path: '/admin/vehicles' },
  { key: 'drivers', path: '/admin/drivers' },
  { key: 'clients', path: '/admin/clients' },
];
const reportsSubNav = [
  { key: 'daily_report', path: '/reports/daily', label: 'Daily' },
  { key: 'profit_loss', path: '/reports/pnl', label: 'P&L' },
  { key: 'soa', path: '/reports/soa', label: 'SOA' },
  { key: 'bank_reconciliation', path: '/reports/bank-reconciliation', label: 'Bank Rec' },
];

export const subNavMap = {
  '/': [],
  '/settings': [],
  '/reports/daily': reportsSubNav,
  '/reports/pnl': reportsSubNav,
  '/reports/soa': reportsSubNav,
  '/reports/bank-reconciliation': reportsSubNav,
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
  daily_report: ClipboardList, profit_loss: TrendingUp, soa: FileText, bank_reconciliation: Landmark,
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
};

export function hasSubNavForPath(pathname) {
  const matchedKey = Object.keys(subNavMap).find((k) => pathname === k || pathname.startsWith(k + '/'));
  return matchedKey ? subNavMap[matchedKey].length > 0 : false;
}

export default function HeaderSubNav({ className = '' }) {
  const location = useLocation();
  const { t } = useI18n();
  const matchedKey = Object.keys(subNavMap).find((k) => location.pathname === k || location.pathname.startsWith(k + '/'));
  const subNav = matchedKey ? subNavMap[matchedKey] : [];
  if (!subNav.length) return null;

  return (
    <nav key={location.pathname} className={`flex items-center gap-1.5 ${className}`}>
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
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
              e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
            }}
            className={`group/sub relative flex items-center gap-2 h-11 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 flex-shrink-0 ${isActive ? 'pl-1.5 pr-3' : 'px-1.5'}`}
          >
            {/* duotone gradient tile */}
            <span
              className="relative flex items-center justify-center w-9 h-9 rounded-[12px] transition-all duration-300"
              style={{
                background: `linear-gradient(150deg, ${st.from} 0%, ${st.to} 100%)`,
                border: `1px solid rgba(${st.glow},0.55)`,
                boxShadow: isActive
                  ? `inset 0 1.5px 1px rgba(255,255,255,0.55), inset 0 -3px 5px rgba(0,0,0,0.32), 0 5px 12px rgba(${st.glow},0.26), 0 0 0 1px rgba(${st.glow},0.32)`
                  : `inset 0 1.5px 1px rgba(255,255,255,0.40), inset 0 -3px 5px rgba(0,0,0,0.28), 0 4px 10px rgba(0,0,0,0.36)`,
                color: '#fff',
              }}
            >
              <span className="pointer-events-none absolute inset-x-[3px] top-[2px] h-1/2 rounded-t-[10px]" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.42), transparent)' }} />
              <Icon className="relative w-[16px] h-[16px]" style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.45))' }} />
              <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px]">
                <span className="absolute top-0 left-[-120%] h-full w-1/2 skew-x-[-20deg] opacity-0 group-hover/sub:opacity-100 group-hover/sub:left-[150%] transition-all duration-700" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
              </span>
            </span>

            {/* active tab shows its label inline — always visible, user-friendly */}
            {isActive && (
              <span
                className="text-[12px] font-semibold tracking-wide whitespace-nowrap"
                style={{ color: `rgb(${st.glow})`, textShadow: `0 0 10px rgba(${st.glow},0.45)` }}
              >
                {label}
              </span>
            )}

            {/* cursor-follow glow */}
            <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover/sub:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(circle 70px at var(--mx,50%) var(--my,50%), rgba(${st.glow},0.4), transparent 70%)` }} />

            {/* hover tooltip — only for inactive tiles */}
            {!isActive && (
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 translate-y-1 group-hover/sub:opacity-100 group-hover/sub:translate-y-0 transition-all duration-300 z-50">
                <span className="relative inline-block whitespace-nowrap px-3 py-1.5 rounded-xl" style={{
                  background: 'linear-gradient(135deg, rgba(10,14,26,0.82), rgba(20,26,44,0.70))',
                  backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 22px rgba(0,0,0,0.45), 0 0 18px -6px rgba(${st.glow},0.45)`,
                }}>
                  <span className="text-[12px] font-semibold tracking-wide" style={{
                    backgroundImage: `linear-gradient(100deg, #ffffff 0%, rgb(${st.glow}) 45%, #ffffff 100%)`,
                    WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    filter: `drop-shadow(0 0 6px rgba(${st.glow},0.55))`,
                  }}>{label}</span>
                </span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}