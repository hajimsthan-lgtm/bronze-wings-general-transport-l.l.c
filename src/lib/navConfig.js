// Shared navigation config for the app shell sidebar.
// Single source of truth — imported by ShellSidebar.
import {
  Route, Receipt, Shield, Truck, UsersRound, Building2, Store,
  ClipboardList, TrendingUp, FileText, Landmark, Wallet, Wrench, Fuel as FuelIcon,
  Files, FilePlus2, FileSignature, Bot, Sparkles, Award, Trash2,
} from 'lucide-react';

const ICONS = {
  Route, Receipt, Shield, Truck, UsersRound, Building2, Store,
  ClipboardList, TrendingUp, FileText, Landmark, Wallet, Wrench, Fuel: FuelIcon,
  Files, FilePlus2, FileSignature, Bot, Sparkles, Award, Trash2,
};

export const navItems = [
  {
    key: 'operations', label: 'Operations', icon: 'Route', color: '#00f2c3',
    children: [
      { key: 'trips', label: 'Trips', path: '/trips', icon: 'Route', color: '#00f2c3' },
      { key: 'expenses', label: 'Expenses', path: '/expenses', icon: 'Receipt', color: '#f97316' },
      { key: 'fuel', label: 'Fuel', path: '/fuel', icon: 'Fuel', color: '#14b8a6' },
      { key: 'maintenance', label: 'Maintenance', path: '/maintenance', icon: 'Wrench', color: '#a855f7' },
      { key: 'salary', label: 'Salary', path: '/salary', icon: 'Wallet', color: '#22c55e' },
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
      { key: 'vat_corporate_tax', label: 'VAT & Corp Tax', path: '/accounts/vat-corporate-tax', icon: 'Landmark', color: '#ef4444' },
    ],
  },
  {
    key: 'documents', label: 'Documents', icon: 'Files', color: '#06b6d4',
    children: [
      { key: 'invoices', label: 'Invoices', path: '/accounts/invoices', icon: 'FileText', color: '#22c55e' },
      { key: 'quotations', label: 'Quotations', path: '/accounts/quotations', icon: 'FilePlus2', color: '#06b6d4' },
      { key: 'agreements', label: 'Agreements', path: '/accounts/agreements', icon: 'FileSignature', color: '#eab308' },
      { key: 'company_documents', label: 'Bronze Docs', path: '/admin/company-documents', icon: 'Award', color: '#f59e0b' },
    ],
  },
];

// Secondary / support nav (bottom of sidebar)
export const secondaryNav = [
  { key: 'trash', label: 'Trash', path: '/trash', icon: 'Trash2', color: '#ef4444' },
  { key: 'agents', label: 'AI Agents', path: '/agents', icon: 'Bot', color: '#a855f7' },
  { key: 'vehicle_icon_creator', label: 'Icon Creator', path: '/vehicle-icon-creator', icon: 'Truck', color: '#3b82f6' },
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