import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Route, Receipt, ClipboardList, TrendingUp, FileText,
  Landmark, Wallet, FilePlus2, FileSignature, Truck, UsersRound, Building2,
  Files, Settings, Bot, Sparkles,
} from 'lucide-react';

/**
 * Compact page title (icon + title + description) shown in the top header bar.
 * Maps the current route to its page icon, title, and description so every
 * page displays its header on the top bar.
 */
const routeMap = [
  { path: '/', icon: LayoutDashboard, title: 'Dashboard', description: 'Overview & analytics', exact: true },
  { path: '/trips', icon: Route, title: 'Trips', description: 'Operations & logistics' },
  { path: '/contracts', icon: Route, title: 'Operations', description: 'Trips & contracts' },
  { path: '/expenses', icon: Receipt, title: 'Expenses', description: 'Expense tracking' },
  { path: '/reports/daily', icon: ClipboardList, title: 'Daily Report', description: 'Daily operations summary' },
  { path: '/reports/pnl', icon: TrendingUp, title: 'Profit & Loss', description: 'Financial overview' },
  { path: '/reports/soa', icon: FileText, title: 'Statement of Account', description: 'Client account statements' },
  { path: '/reports/bank-reconciliation', icon: Landmark, title: 'Bank Reconciliation', description: 'Deposits & withdrawals' },
  { path: '/accounts/petty-cash', icon: Wallet, title: 'Petty Cash', description: 'Cash inflows & outflows' },
  { path: '/accounts/quotations', icon: FilePlus2, title: 'Quotations', description: 'Client quotation generator' },
  { path: '/accounts/agreements', icon: FileSignature, title: 'Agreements', description: 'Client agreement generator' },
  { path: '/admin/vehicles', icon: Truck, title: 'Vehicles', description: 'Fleet insights' },
  { path: '/admin/drivers', icon: UsersRound, title: 'Drivers', description: 'Performance & insights' },
  { path: '/admin/clients', icon: Building2, title: 'Clients', description: 'Client insights' },
  { path: '/admin/vendors', icon: Building2, title: 'Vendors', description: 'Vendor management' },
  { path: '/admin/documents', icon: Files, title: 'Documents', description: 'Document management' },
  { path: '/settings', icon: Settings, title: 'Settings', description: 'Application settings' },
  { path: '/prompt-generator', icon: Sparkles, title: 'Prompt Generator', description: 'AI prompt engineering' },
  { path: '/agents', icon: Bot, title: 'AI Agents', description: 'Your AI assistants' },
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
        {match.description && (
          <span className="text-[11px] leading-tight" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {match.description}
          </span>
        )}
      </div>
    </div>
  );
}