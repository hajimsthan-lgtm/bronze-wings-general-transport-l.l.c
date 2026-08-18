import { useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Route, Receipt, Wrench, Wallet, Truck, UsersRound,
  Building2, Store, ClipboardList, TrendingUp, FileText, Landmark,
  FilePlus2, FileSignature, Award, Settings, Bot, Sparkles, Fuel, Files,
} from 'lucide-react';

/**
 * Compact page title (page icon + page title + page subtitle) shown in
 * the top header bar. Each route shows its own page name and matching icon.
 */
const routeMap = [
  { path: '/', icon: LayoutDashboard, title: 'Dashboard', description: 'Overview & analytics', color: '#00f2c3', exact: true },
  { path: '/trips', icon: Route, title: 'Trips', description: 'Trips & logistics', color: '#00f2c3' },
  { path: '/contracts', icon: Route, title: 'Contracts', description: 'Contract trips', color: '#00f2c3' },
  { path: '/expenses', icon: Receipt, title: 'Expenses', description: 'Expense tracking', color: '#f97316' },
  { path: '/maintenance', icon: Wrench, title: 'Maintenance', description: 'Service records', color: '#a855f7' },
  { path: '/salary', icon: Wallet, title: 'Salary', description: 'Payroll management', color: '#22c55e' },
  { path: '/fuel', icon: Fuel, title: 'Fuel', description: 'Fuel records', color: '#14b8a6' },
  { path: '/reports/daily', icon: ClipboardList, title: 'Daily Report', description: 'Daily operations summary', color: '#fbbf24' },
  { path: '/reports/pnl', icon: TrendingUp, title: 'Profit & Loss', description: 'P&L overview', color: '#22c55e' },
  { path: '/reports/soa', icon: FileText, title: 'Statement of Account', description: 'SOA report', color: '#ef4444' },
  { path: '/reports/bank-reconciliation', icon: Landmark, title: 'Bank Reconciliation', description: 'Reconcile bank records', color: '#6366f1' },
  { path: '/accounts/petty-cash', icon: Wallet, title: 'Petty Cash', description: 'Cash ledger', color: '#f59e0b' },
  { path: '/accounts/quotations', icon: FilePlus2, title: 'Quotations', description: 'Manage quotations', color: '#06b6d4' },
  { path: '/accounts/agreements', icon: FileSignature, title: 'Agreements', description: 'Manage agreements', color: '#eab308' },
  { path: '/accounts/invoices', icon: FileText, title: 'Invoices', description: 'Manage invoices', color: '#22c55e' },
  { path: '/admin/vehicles', icon: Truck, title: 'Vehicles', description: 'Fleet management', color: '#3b82f6' },
  { path: '/admin/drivers', icon: UsersRound, title: 'Drivers', description: 'Driver management', color: '#0ea5e9' },
  { path: '/admin/clients', icon: Building2, title: 'Clients', description: 'Client management', color: '#14b8a6' },
  { path: '/admin/vendors', icon: Store, title: 'Vendors', description: 'Vendor management', color: '#f59e0b' },
  { path: '/admin/company-documents', icon: Award, title: 'Company Documents', description: 'Official documents', color: '#f59e0b' },
  { path: '/admin/documents', icon: Files, title: 'Documents', description: 'Document management', color: '#06b6d4' },
  { path: '/settings', icon: Settings, title: 'Settings', description: 'Application settings', color: '#64748b' },
  { path: '/prompt-generator', icon: Sparkles, title: 'Prompt Studio', description: 'AI prompt generator', color: '#ec4899' },
  { path: '/agents', icon: Bot, title: 'AI Agents', description: 'AI assistants', color: '#a855f7' },
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
      <div className="hud-icon-tile w-9 h-9" style={{ borderColor: `${match.color}80` }}>
        <Icon className="w-[18px] h-[18px]" style={{ color: match.color }} />
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