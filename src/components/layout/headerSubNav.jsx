import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Route, Receipt, Truck, Users, Building2, ClipboardList, TrendingUp, FileText, Landmark, Wallet, FileSignature, FilePlus2 } from 'lucide-react';

const operationsSubNav = [
{ key: 'trips', path: '/trips' },
{ key: 'expenses', path: '/expenses' }];

const adminSubNav = [
{ key: 'vehicles', path: '/admin/vehicles' },
{ key: 'drivers', path: '/admin/drivers' },
{ key: 'clients', path: '/admin/clients' }];

const accountsSubNav = [
{ key: 'bank_reconciliation', path: '/reports/bank-reconciliation', label: 'Bank Rec' },
{ key: 'petty_cash', path: '/accounts/petty-cash', label: 'Petty Cash' },
{ key: 'quotations', path: '/accounts/quotations', label: 'Quotations' },
{ key: 'agreements', path: '/accounts/agreements', label: 'Agreements' }];

const reportsSubNav = [
{ key: 'daily_report', path: '/reports/daily', label: 'Daily' },
{ key: 'profit_loss', path: '/reports/pnl', label: 'P&L' },
{ key: 'soa', path: '/reports/soa', label: 'SOA' }];


export const subNavMap = {
  '/': [],
  '/settings': [],
  '/reports/daily': reportsSubNav,
  '/reports/pnl': reportsSubNav,
  '/reports/soa': reportsSubNav,
  '/reports/bank-reconciliation': accountsSubNav,
  '/accounts/petty-cash': accountsSubNav,
  '/accounts/quotations': accountsSubNav,
  '/accounts/agreements': accountsSubNav,
  '/expenses': operationsSubNav,
  '/trips': operationsSubNav,
  '/contracts': operationsSubNav,
  '/admin/vehicles': adminSubNav,
  '/admin/drivers': adminSubNav,
  '/admin/clients': adminSubNav,
  '/admin/vendors': adminSubNav,
  '/admin/documents': adminSubNav
};

export const SUBNAV_ICON = {
  trips: Route, expenses: Receipt,
  vehicles: Truck, drivers: Users, clients: Building2,
  daily_report: ClipboardList, profit_loss: TrendingUp, soa: FileText,
  bank_reconciliation: Landmark, petty_cash: Wallet,
  quotations: FilePlus2, agreements: FileSignature
};

export const SUBNAV_STYLE = {
  trips: { from: '#1ED760', to: '#15803d', glow: '30,215,96' },
  expenses: { from: '#f59e0b', to: '#b45309', glow: '245,158,11' },
  vehicles: { from: '#1ED760', to: '#15803d', glow: '99,102,241' },
  drivers: { from: '#10b981', to: '#047857', glow: '16,185,129' },
  clients: { from: '#f43f5e', to: '#9f1239', glow: '244,63,94' },
  daily_report: { from: '#06b6d4', to: '#0e7490', glow: '6,182,212' },
  profit_loss: { from: '#14b8a6', to: '#0f766e', glow: '20,184,166' },
  soa: { from: '#f97316', to: '#9a3412', glow: '249,115,22' },
  bank_reconciliation: { from: '#14b8a6', to: '#0f766e', glow: '20,184,166' },
  petty_cash: { from: '#f59e0b', to: '#b45309', glow: '245,158,11' },
  quotations: { from: '#14b8a6', to: '#0f766e', glow: '20,184,166' },
  agreements: { from: '#0d9488', to: '#0f766e', glow: '13,148,136' }
};

export function hasSubNavForPath(pathname) {
  const matchedKey = Object.keys(subNavMap).find((k) => pathname === k || pathname.startsWith(k + '/'));
  return matchedKey ? subNavMap[matchedKey].length > 0 : false;
}

export default function HeaderSubNav({ className = '' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [touchStart, setTouchStart] = useState(null);
  const matchedKey = Object.keys(subNavMap).find((k) => location.pathname === k || location.pathname.startsWith(k + '/'));
  const subNav = matchedKey ? subNavMap[matchedKey] : [];
  if (!subNav.length) return null;

  const activeIndex = Math.max(0, subNav.findIndex((item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/')));
  const activeItem = subNav[activeIndex] || subNav[0];
  const activeSt = SUBNAV_STYLE[activeItem.key] || SUBNAV_STYLE.trips;
  const ActiveIcon = SUBNAV_ICON[activeItem.key] || FileText;
  const activeLabel = activeItem.label || t(activeItem.key);

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (Math.abs(diff) > 40) {
      const dir = diff > 0 ? 1 : -1;
      const next = (activeIndex + dir + subNav.length) % subNav.length;
      navigate(subNav[next].path);
    }
    setTouchStart(null);
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
          return null;



































        })}
      </nav>

      {/* Mobile: single swipeable pill — slide left/right to switch */}
      <nav
        className={`sm:hidden flex items-center justify-center ${className}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}>
        
        























        
      </nav>
    </>);

}