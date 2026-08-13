import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Route, Receipt, BarChart3, Landmark, Shield,
  Settings, Bot, Sparkles,
} from 'lucide-react';

/**
 * Compact page title (section icon + section title + page subtitle) shown in
 * the top header bar. Every route is grouped under its section
 * (Operations, Admin, Reports, Accounts …) with a dedicated section icon.
 */
const routeMap = [
  { path: '/', icon: LayoutDashboard, title: 'Dashboard', description: 'Overview & analytics', exact: true },
  { path: '/trips', icon: Route, title: 'Operations', description: 'Trips & logistics' },
  { path: '/contracts', icon: Route, title: 'Operations', description: 'Trips & contracts' },
  { path: '/expenses', icon: Receipt, title: 'Expenses', description: 'Expense tracking' },
  { path: '/reports/daily', icon: BarChart3, title: 'Reports', description: 'Daily operations summary' },
  { path: '/reports/pnl', icon: BarChart3, title: 'Reports', description: 'Profit & loss overview' },
  { path: '/reports/soa', icon: BarChart3, title: 'Reports', description: 'Statement of account' },
  { path: '/reports/bank-reconciliation', icon: BarChart3, title: 'Reports', description: 'Bank reconciliation' },
  { path: '/accounts/petty-cash', icon: Landmark, title: 'Accounts', description: 'Petty cash' },
  { path: '/accounts/quotations', icon: Landmark, title: 'Accounts', description: 'Quotations' },
  { path: '/accounts/agreements', icon: Landmark, title: 'Accounts', description: 'Agreements' },
  { path: '/accounts/invoices', icon: Landmark, title: 'Accounts', description: 'Invoices' },
  { path: '/admin/vehicles', icon: Shield, title: 'Admin', description: 'Vehicles' },
  { path: '/admin/drivers', icon: Shield, title: 'Admin', description: 'Drivers' },
  { path: '/admin/clients', icon: Shield, title: 'Admin', description: 'Clients' },
  { path: '/admin/vendors', icon: Shield, title: 'Admin', description: 'Vendors' },
  { path: '/admin/documents', icon: Shield, title: 'Admin', description: 'Documents' },
  { path: '/settings', icon: Settings, title: 'Settings', description: 'Application settings' },
  { path: '/prompt-generator', icon: Sparkles, title: 'AI Tools', description: 'Prompt generator' },
  { path: '/agents', icon: Bot, title: 'AI Tools', description: 'AI assistants' },
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