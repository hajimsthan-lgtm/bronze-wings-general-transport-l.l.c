import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FileText, Receipt, UserPlus, Fuel } from 'lucide-react';

const ACTIONS = [
  { label: '+ New Trip', icon: Plus, color: '#3b82f6', to: '/trips' },
  { label: '+ New Invoice', icon: FileText, color: '#a855f7', to: '/admin/clients' },
  { label: 'Add Expense', icon: Receipt, color: '#f97316', to: '/expenses' },
  { label: 'Add Driver', icon: UserPlus, color: '#14b8a6', to: '/admin/drivers' },
  { label: 'Fuel Entry', icon: Fuel, color: '#22c55e', to: '/fuel' },
];

export default function QuickActions() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-[11px] uppercase tracking-wider font-semibold text-white/40 mb-2.5">Quick Actions</h2>
      <div className="flex md:grid md:grid-cols-5 gap-2.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
        {ACTIONS.map((a, i) => (
          <motion.button
            key={a.label}
            onClick={() => navigate(a.to)}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.85 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="group relative flex items-center gap-2.5 px-5 py-4 rounded-2xl flex-shrink-0 overflow-hidden transition-shadow duration-300"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {/* hover tint */}
            <span className="absolute inset-0 rounded-2xl bg-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            {/* colored glow on hover */}
            <span
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              style={{ boxShadow: `0 0 22px -4px ${a.color}66, inset 0 0 0 1px ${a.color}33` }}
            />
            <span
              className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ background: `${a.color}1a`, border: `1px solid ${a.color}40` }}
            >
              <a.icon className="w-5 h-5" style={{ color: a.color }} />
            </span>
            <span className="relative text-sm font-medium text-white/70 whitespace-nowrap">{a.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}