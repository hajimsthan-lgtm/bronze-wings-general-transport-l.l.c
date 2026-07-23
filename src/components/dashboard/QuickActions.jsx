import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, FileText, Receipt, UserPlus, Fuel, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

// These open their creation form directly.
const ACTIONS = [
  { label: '+ New Trip', icon: Plus, color: '#3b82f6', to: '/trips?new=1' },
  { label: 'Add Expense', icon: Receipt, color: '#f97316', to: '/expenses?open=expense' },
  { label: 'Add Driver', icon: UserPlus, color: '#14b8a6', to: '/admin/drivers?new=1' },
  { label: 'Fuel Entry', icon: Fuel, color: '#22c55e', to: '/admin/vehicles' },
];

// Invoice needs a client first — opens a dropdown to pick which client to invoice.
const INVOICE = { label: '+ New Invoice', icon: FileText, color: '#a855f7' };

export default function QuickActions() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  useEffect(() => { base44.entities.Client.list('-created_date', 200).catch(() => []).then(setClients); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-[11px] uppercase tracking-wider font-semibold text-white/60 mb-2.5">Quick Actions</h2>
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
            <span className="absolute inset-0 rounded-2xl bg-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
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
            <span className="relative text-sm font-medium text-white/85 whitespace-nowrap">{a.label}</span>
          </motion.button>
        ))}

        {/* Invoice — pick which client to invoice first */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.85 + ACTIONS.length * 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="flex-shrink-0"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group relative flex items-center gap-2.5 px-5 py-4 rounded-2xl w-full overflow-hidden transition-shadow duration-300"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <span className="absolute inset-0 rounded-2xl bg-white/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <span
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: `0 0 22px -4px ${INVOICE.color}66, inset 0 0 0 1px ${INVOICE.color}33` }}
                />
                <span
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${INVOICE.color}1a`, border: `1px solid ${INVOICE.color}40` }}
                >
                  <INVOICE.icon className="w-5 h-5" style={{ color: INVOICE.color }} />
                </span>
                <span className="relative text-sm font-medium text-white/85 whitespace-nowrap flex items-center gap-1">
                  {INVOICE.label}
                  <ChevronDown className="w-3.5 h-3.5 text-white/50" />
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
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: INVOICE.color }} />
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