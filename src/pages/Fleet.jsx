import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Truck, UsersRound, Building2, Store, Files, Award,
} from 'lucide-react';

const FLEET_ITEMS = [
  { label: 'Vehicles', path: '/admin/vehicles', icon: Truck, color: '#3b82f6', desc: 'Manage your fleet vehicles' },
  { label: 'Drivers', path: '/admin/drivers', icon: UsersRound, color: '#0ea5e9', desc: 'Driver roster & profiles' },
  { label: 'Clients', path: '/admin/clients', icon: Building2, color: '#14b8a6', desc: 'Customer accounts' },
  { label: 'Vendors', path: '/admin/vendors', icon: Store, color: '#f59e0b', desc: 'Suppliers & service providers' },
  { label: 'Documents', path: '/admin/documents', icon: Files, color: '#06b6d4', desc: 'Vehicle & driver docs' },
  { label: 'Bronze Docs', path: '/admin/company-documents', icon: Award, color: '#f59e0b', desc: 'Company legal documents' },
];

export default function Fleet() {
  return (
    <div className="max-w-[1200px] mx-auto pb-6">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">Fleet Hub</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Fleet
        </h1>
        <p className="text-sm text-muted-foreground mt-1">All fleet & asset modules in one place</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FLEET_ITEMS.map((item, i) => {
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