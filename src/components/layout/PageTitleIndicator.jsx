import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Route, Receipt, ClipboardList, TrendingUp, FileText,
  Landmark, Wallet, FilePlus2, FileSignature, Truck, UsersRound, Building2,
  Files, Settings, Bot, Sparkles,
} from 'lucide-react';

/**
 * Compact page title (icon + label) shown in the top header bar.
 * Maps the current route to its page icon and title so every page
 * displays its header on the top bar's right side.
 */
const routeMap = [
  { path: '/', icon: LayoutDashboard, title: 'Dashboard', exact: true },
  { path: '/trips', icon: Route, title: 'Trips' },
  { path: '/contracts', icon: Route, title: 'Operations' },
  { path: '/expenses', icon: Receipt, title: 'Expenses' },
  { path: '/reports/daily', icon: ClipboardList, title: 'Daily Report' },
  { path: '/reports/pnl', icon: TrendingUp, title: 'Profit & Loss' },
  { path: '/reports/soa', icon: FileText, title: 'Statement of Account' },
  { path: '/reports/bank-reconciliation', icon: Landmark, title: 'Bank Reconciliation' },
  { path: '/accounts/petty-cash', icon: Wallet, title: 'Petty Cash' },
  { path: '/accounts/quotations', icon: FilePlus2, title: 'Quotations' },
  { path: '/accounts/agreements', icon: FileSignature, title: 'Agreements' },
  { path: '/admin/vehicles', icon: Truck, title: 'Vehicles' },
  { path: '/admin/drivers', icon: UsersRound, title: 'Drivers' },
  { path: '/admin/clients', icon: Building2, title: 'Clients' },
  { path: '/admin/vendors', icon: Building2, title: 'Vendors' },
  { path: '/admin/documents', icon: Files, title: 'Documents' },
  { path: '/settings', icon: Settings, title: 'Settings' },
  { path: '/prompt-generator', icon: Sparkles, title: 'Prompt Generator' },
  { path: '/agents', icon: Bot, title: 'AI Agents' },
];

export default function PageTitleIndicator() {
  const location = useLocation();
  const match = routeMap.find((r) =>
    r.exact
      ? location.pathname === r.path
      : location.pathname === r.path || location.pathname.startsWith(r.path + '/')
  );
  if (!match) return null;
  const Icon = match.icon;
  return (
    <div className="flex items-center gap-2.5 flex-shrink-0">
      <div className="hud-icon-tile w-9 h-9">
        <Icon className="w-[18px] h-[18px]" />
      </div>
      <div className="hidden lg:flex flex-col leading-tight">
        <span className="text-sm font-bold tracking-tight" style={{ color: 'hsl(var(--foreground))' }}>
          {match.title}
        </span>
      </div>
    </div>
  );
}