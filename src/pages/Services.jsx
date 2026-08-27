import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet, Landmark, FileText, ClipboardList, TrendingUp,
  Truck, UsersRound, Building2, Store, FilePlus2, FileSignature,
  Award, Bot, Sparkles, Fuel, Wrench, Receipt,
} from 'lucide-react';
import { useTabHistory } from '@/lib/TabHistoryContext';

const ICON_MAP = {
  Wallet, Landmark, FileText, ClipboardList, TrendingUp,
  Truck, UsersRound, Building2, Store, FilePlus2, FileSignature,
  Award, Bot, Sparkles, Fuel, Wrench, Receipt,
};

const SECTIONS = [
  {
    title: 'Accounts',
    items: [
      { label: 'Petty Cash', path: '/accounts/petty-cash', icon: 'Wallet', color: '#f59e0b' },
      { label: 'Bank Rec', path: '/reports/bank-reconciliation', icon: 'Landmark', color: '#6366f1' },
      { label: 'VAT & Tax', path: '/accounts/vat-corporate-tax', icon: 'FileText', color: '#ef4444' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Daily', path: '/reports/daily', icon: 'ClipboardList', color: '#fbbf24' },
      { label: 'P&L', path: '/reports/pnl', icon: 'TrendingUp', color: '#22c55e' },
      { label: 'SOA', path: '/reports/soa', icon: 'FileText', color: '#ef4444' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Vehicles', path: '/admin/vehicles', icon: 'Truck', color: '#3b82f6' },
      { label: 'Drivers', path: '/admin/drivers', icon: 'UsersRound', color: '#0ea5e9' },
      { label: 'Clients', path: '/admin/clients', icon: 'Building2', color: '#14b8a6' },
      { label: 'Vendors', path: '/admin/vendors', icon: 'Store', color: '#f59e0b' },
    ],
  },
  {
    title: 'Documents',
    items: [
      { label: 'Invoices', path: '/accounts/invoices', icon: 'FileText', color: '#22c55e' },
      { label: 'Quotations', path: '/accounts/quotations', icon: 'FilePlus2', color: '#06b6d4' },
      { label: 'Agreements', path: '/accounts/agreements', icon: 'FileSignature', color: '#eab308' },
      { label: 'Bronze Docs', path: '/admin/company-documents', icon: 'Award', color: '#f59e0b' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Fuel', path: '/fuel', icon: 'Fuel', color: '#f97316' },
      { label: 'Maintenance', path: '/maintenance', icon: 'Wrench', color: '#a855f7' },
      { label: 'Expenses', path: '/expenses', icon: 'Receipt', color: '#f97316' },
    ],
  },
  {
    title: 'AI & Tools',
    items: [
      { label: 'AI Agents', path: '/agents', icon: 'Bot', color: '#a855f7' },
      { label: 'Prompt Studio', path: '/prompt-generator', icon: 'Sparkles', color: '#ec4899' },
    ],
  },
];

export default function Services() {
  const { activeTab } = useTabHistory();
  return (
    <div className="min-h-full pb-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-foreground mb-0.5" style={{ fontFamily: 'var(--font-heading)' }}>Services</h1>
        <p className="text-xs text-muted-foreground">All modules in one place</p>
      </div>

      {SECTIONS.map((section, sIdx) => (
        <div key={section.title} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{section.title}</p>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: sIdx * 0.05 } } }}
            className="grid grid-cols-4 gap-3"
          >
            {section.items.map((item) => {
              const Icon = ICON_MAP[item.icon] || Sparkles;
              return (
                <motion.div
                  key={item.label}
                  variants={{ hidden: { opacity: 0, y: 12, scale: 0.9 }, show: { opacity: 1, y: 0, scale: 1 } }}
                >
                  <Link to={item.path} className="flex flex-col items-center gap-1.5 active:scale-90 transition-transform">
                    <div className="relative">
                      <div
                        className="absolute inset-0 rounded-2xl blur-md opacity-50"
                        style={{ background: item.color }}
                      />
                      <div
                        className="relative h-12 w-12 rounded-2xl flex items-center justify-center text-white"
                        style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}aa)` }}
                      >
                        <Icon className="w-6 h-6" strokeWidth={2} />
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-foreground/80 text-center leading-tight">{item.label}</span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      ))}
    </div>
  );
}