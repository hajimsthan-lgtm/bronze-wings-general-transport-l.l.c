// Shared navigation config for the app shell sidebar.
// Single source of truth — imported by ShellSidebar.
import {
  Route, Receipt, Shield, Truck, UsersRound, Building2, Store,
  ClipboardList, TrendingUp, FileText, Landmark, Wallet,
  Files, FilePlus2, FileSignature, Bot, Sparkles,
} from 'lucide-react';

const ICONS = {
  Route, Receipt, Shield, Truck, UsersRound, Building2, Store,
  ClipboardList, TrendingUp, FileText, Landmark, Wallet,
  Files, FilePlus2, FileSignature, Bot, Sparkles,
};

export const navItems = [
  {
    key: 'operations', label: 'Operations', icon: 'Route', color: '#00f2c3',
    children: [
      { key: 'trips', label: 'Trips', path: '/trips', icon: 'Route', color: '#00f2c3' },
      { key: 'expenses', label: 'Expenses', path: '/expenses', icon: 'Receipt', color: '#f97316' },
    ],
  },
  {
    key: 'admin', label: 'Admin', icon: 'Shield', color: '#3b82f6',
    children: [
      { key: 'vehicles', label: 'Vehicles', path: '/admin/vehicles', icon: 'Truck', color: '#3b82f6' },
      { key: 'drivers', label: 'Drivers', path: '/admin/drivers', icon: 'UsersRound', color: '#0ea5e9' },
      { key: 'clients', label: 'Clients', path: '/admin/clients', icon: 'Building2', color: '#14b8a6' },
      { key: 'vendors', label: 'Vendors', path: '/admin/vendors', icon: 'Store', color: '#f59e0b' },
    ],
  },
  {
    key: 'reports', label: 'Reports', icon: 'ClipboardList', color: '#fbbf24',
    children: [
      { key: 'daily_report', label: 'Daily', path: '/reports/daily', icon: 'ClipboardList', color: '#fbbf24' },
      { key: 'profit_loss', label: 'P&L', path: '/reports/pnl', icon: 'TrendingUp', color: '#22c55e' },
      { key: 'soa', label: 'SOA', path: '/reports/soa', icon: 'FileText', color: '#ef4444' },
    ],
  },
  {
    key: 'accounts', label: 'Accounts', icon: 'Wallet', color: '#6366f1',
    children: [
      { key: 'bank_reconciliation', label: 'Bank Rec', path: '/reports/bank-reconciliation', icon: 'Landmark', color: '#6366f1' },
      { key: 'petty_cash', label: 'Petty Cash', path: '/accounts/petty-cash', icon: 'Wallet', color: '#f59e0b' },
    ],
  },
  {
    key: 'documents', label: 'Documents', icon: 'Files', color: '#06b6d4',
    children: [
      { key: 'quotations', label: 'Quotations', path: '/accounts/quotations', icon: 'FilePlus2', color: '#06b6d4' },
      { key: 'invoices', label: 'Invoices', path: '/accounts/invoices', icon: 'FileText', color: '#22c55e' },
      { key: 'agreements', label: 'Agreements', path: '/accounts/agreements', icon: 'FileSignature', color: '#eab308' },
    ],
  },
];

// Secondary / support nav (bottom of sidebar)
export const secondaryNav = [
  { key: 'agents', label: 'AI Agents', path: '/agents', icon: 'Bot', color: '#a855f7' },
  { key: 'prompt_generator', label: 'Prompt Studio', path: '/prompt-generator', icon: 'Sparkles', color: '#ec4899' },
];

export function getIcon(name) {
  return ICONS[name] || Route;
}

// Pick readable text color (dark on light fills, white on dark fills)
export function readableOn(hex) {
  if (!hex) return '#ffffff';
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return l > 0.62 ? '#0a0b0e' : '#ffffff';
}