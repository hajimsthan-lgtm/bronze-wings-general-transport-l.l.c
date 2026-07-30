import { useLocation, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Route, Receipt, Truck, Users, Building2, ClipboardList, TrendingUp, FileText } from 'lucide-react';

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
];

export const subNavMap = {
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
  '/admin/documents': adminSubNav,
};

export const SUBNAV_ICON = {
  trips: Route, expenses: Receipt,
  vehicles: Truck, drivers: Users, clients: Building2,
  daily_report: ClipboardList, profit_loss: TrendingUp, soa: FileText,
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
    <nav className={`flex items-center gap-2 ${className}`}>
      {subNav.map((item) => {
        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        const Icon = SUBNAV_ICON[item.key] || FileText;
        const st = SUBNAV_STYLE[item.key] || SUBNAV_STYLE.trips;
        return (
          <Link
            key={item.path}
            to={item.path}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
              e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
            }}
            className="group/sub relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 flex-shrink-0"
          >
            {/* duotone gradient tile */}
            <span
              className="relative flex items-center justify-center w-11 h-11 rounded-[14px]"
              style={{
                background: `linear-gradient(150deg, ${st.from} 0%, ${st.to} 100%)`,
                border: `1px solid rgba(${st.glow},0.55)`,
                boxShadow: isActive
                  ? `inset 0 1.5px 1px rgba(255,255,255,0.55), inset 0 -3px 5px rgba(0,0,0,0.32), 0 8px 20px rgba(${st.glow},0.5), 0 0 0 1px rgba(${st.glow},0.4), 0 0 22px -4px rgba(${st.glow},0.65)`
                  : `inset 0 1.5px 1px rgba(255,255,255,0.45), inset 0 -3px 5px rgba(0,0,0,0.3), 0 5px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)`,
                color: '#fff',
              }}
            >
              {/* top specular gloss */}
              <span className="pointer-events-none absolute inset-x-[3px] top-[2px] h-1/2 rounded-t-[12px]" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.42), transparent)' }} />
              <Icon className="relative w-[18px] h-[18px]" style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.45))' }} />
              {/* sheen sweep on hover */}
              <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[14px]">
                <span className="absolute top-0 left-[-120%] h-full w-1/2 skew-x-[-20deg] opacity-0 group-hover/sub:opacity-100 group-hover/sub:left-[150%] transition-all duration-700" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }} />
              </span>
            </span>
            {/* active edge bar */}
            {isActive && <span className="absolute -left-[2px] top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-full" style={{ background: st.from, boxShadow: `0 0 10px rgba(${st.glow},0.9)` }} />}
            {/* cursor-follow glow */}
            <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover/sub:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(circle 70px at var(--mx,50%) var(--my,50%), rgba(${st.glow},0.45), transparent 70%)` }} />
            {/* shimmer name label — side-nav style */}
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 opacity-0 translate-y-1 group-hover/sub:opacity-100 group-hover/sub:translate-y-0 transition-all duration-300 z-50">
              <span className="relative inline-block whitespace-nowrap px-3 py-1.5 rounded-xl" style={{
                background: 'linear-gradient(135deg, rgba(10,14,26,0.82), rgba(20,26,44,0.70))',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 22px rgba(0,0,0,0.45), 0 0 18px -6px rgba(${st.glow},0.45)`,
              }}>
                <span className="brand-shine text-[12px] font-semibold tracking-wide" style={{
                  backgroundImage: `linear-gradient(100deg, #ffffff 0%, rgb(${st.glow}) 45%, #ffffff 100%)`,
                  filter: `drop-shadow(0 0 6px rgba(${st.glow},0.55))`,
                }}>{item.label || t(item.key)}</span>
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}