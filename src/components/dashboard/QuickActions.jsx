import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FileText, Receipt, UserPlus, Fuel, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

const CARD = {
  background: '#232636',
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: '-6px -6px 12px rgba(255,255,255,0.04), 6px 6px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
};

const ACTIONS = [
  { label: '+ New Trip', icon: Plus, grad: ['#3b82f6', '#60a5fa'], glow: 'rgba(59,130,246,0.3)', to: '/trips?new=1' },
  { label: 'Add Expense', icon: Receipt, grad: ['#f97316', '#fb923c'], glow: 'rgba(249,115,22,0.3)', to: '/expenses?open=expense' },
  { label: 'Add Driver', icon: UserPlus, grad: ['#06b6d4', '#22d3ee'], glow: 'rgba(6,182,212,0.3)', to: '/admin/drivers?new=1' },
  { label: 'Fuel Entry', icon: Fuel, grad: ['#10b981', '#34d399'], glow: 'rgba(16,185,129,0.3)', to: '/admin/vehicles' },
];
const INVOICE = { label: '+ New Invoice', icon: FileText, grad: ['#8b5cf6', '#a78bfa'], glow: 'rgba(139,92,246,0.3)' };

function IconBox({ a }) {
  return (
    <span
      className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white transition-transform duration-300 group-hover:scale-110"
      style={{ background: `linear-gradient(135deg, ${a.grad[0]}, ${a.grad[1]})`, boxShadow: `0 4px 10px ${a.glow}` }}
    >
      <a.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
    </span>
  );
}

export default function QuickActions() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  useEffect(() => { base44.entities.Client.list('-created_date', 200).catch(() => []).then(setClients); }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <h2 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#6b7280] mb-3">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        {ACTIONS.map((a, i) => (
          <motion.button
            key={a.label}
            onClick={() => navigate(a.to)}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 + i * 0.05 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="group relative flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl w-full overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
            style={CARD}
          >
            <IconBox a={a} />
            <span className="relative flex-1 min-w-0 truncate text-[13px] sm:text-sm font-semibold text-white">{a.label}</span>
          </motion.button>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 + ACTIONS.length * 0.05 }}
          className="w-full"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group relative flex items-center gap-2.5 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 rounded-2xl w-full overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
                style={CARD}
              >
                <IconBox a={INVOICE} />
                <span className="relative flex-1 min-w-0 flex items-center gap-1 text-[13px] sm:text-sm font-semibold text-white">
                  <span className="truncate">{INVOICE.label}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/50 flex-shrink-0" />
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <p className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Select client to invoice</p>
              {clients.length === 0 ? (
                <DropdownMenuItem onClick={() => navigate('/admin/clients')} className="text-xs cursor-pointer text-muted-foreground">
                  No clients yet — add one first
                </DropdownMenuItem>
              ) : (
                clients.map((c) => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => navigate(`/admin/clients/${c.id}?new_invoice=1`)}
                    className="text-xs cursor-pointer flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: INVOICE.grad[0] }} />
                    <span className="truncate">{c.name}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </div>
    </motion.div>
  );
}