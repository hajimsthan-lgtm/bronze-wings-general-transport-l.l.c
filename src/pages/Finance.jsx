import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, FilePlus2, FileSignature, Landmark, Wallet, Receipt, TrendingUp,
} from 'lucide-react';

const FINANCE_ITEMS = [
  { label: 'Invoices', path: '/accounts/invoices', icon: FileText, color: '#22c55e', desc: 'Bill clients & track payments' },
  { label: 'Quotations', path: '/accounts/quotations', icon: FilePlus2, color: '#06b6d4', desc: 'Send price quotes' },
  { label: 'Agreements', path: '/accounts/agreements', icon: FileSignature, color: '#eab308', desc: 'Service & rental contracts' },
  { label: 'Bank Rec', path: '/reports/bank-reconciliation', icon: Landmark, color: '#6366f1', desc: 'Reconcile bank statements' },
  { label: 'Petty Cash', path: '/accounts/petty-cash', icon: Wallet, color: '#f59e0b', desc: 'Cash in/out ledger' },
  { label: 'VAT & Corp Tax', path: '/accounts/vat-corporate-tax', icon: Receipt, color: '#ef4444', desc: 'Tax filing tracker' },
  { label: 'SOA', path: '/reports/soa', icon: TrendingUp, color: '#ec4899', desc: 'Statement of account' },
];

export default function Finance() {
  return (
    <div className="max-w-[1200px] mx-auto pb-6">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Finance Hub</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Finance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">All financial modules in one place</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FINANCE_ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link
                to={item.path}
                className="edge-panel edge-glow rounded-2xl p-5 flex items-start gap-4 group hover:-translate-y-0.5 transition-transform min-w-0"
              >
                <div
                  className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-15 blur-xl pointer-events-none"
                  style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}88)` }}
                />
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)`, boxShadow: `0 4px 14px -4px ${item.color}80` }}
                >
                  <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground text-base">{item.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}