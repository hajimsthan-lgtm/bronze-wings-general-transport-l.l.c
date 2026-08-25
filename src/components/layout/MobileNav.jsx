import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Route, Settings, Plus, X, FileText, Receipt, FilePlus2, Truck, Sparkles } from 'lucide-react';
import { useTabHistory } from '@/lib/TabHistoryContext';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Home', color: 'rgb(var(--panel-accent-rgb))', glow: 'var(--panel-accent-rgb)' },
  { key: 'operations', icon: Route, label: 'Operations', color: '#fb923c', glow: '251, 146, 60' },
  { key: 'services', icon: Sparkles, label: 'Services', color: '#c084fc', glow: '192, 132, 252' },
  { key: 'settings', icon: Settings, label: 'Settings', color: '#6366f1', glow: '99, 102, 241' },
];

const FAB_ACTIONS = [
  { label: 'New Trip', icon: Truck, color: '#fb923c', path: '/trips' },
  { label: 'New Expense', icon: Receipt, color: '#f97316', path: '/expenses' },
  { label: 'New Invoice', icon: FileText, color: '#22c55e', path: '/accounts/invoices' },
  { label: 'New Quotation', icon: FilePlus2, color: '#06b6d4', path: '/accounts/quotations' },
];

export default function MobileNav() {
  const { activeTab, switchTab } = useTabHistory();
  const navigate = useNavigate();
  const [fabOpen, setFabOpen] = useState(false);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div
          className="relative flex items-stretch justify-around px-2 pt-2.5 pb-2 bg-background/90"
          style={{
            backdropFilter: 'blur(24px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
            borderTop: '1px solid hsl(var(--border))',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-border/60" />

          {/* Left pair: Home + Operations */}
          {navItems.slice(0, 2).map((item) => (
            <NavButton key={item.key} item={item} active={activeTab === item.key} onClick={() => switchTab(item.key)} />
          ))}

          {/* Center FAB slot */}
          <div className="flex-1 flex items-start justify-center">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setFabOpen(true)}
              className="relative -mt-7 w-14 h-14 rounded-full flex items-center justify-center"
              aria-label="Quick add"
              style={{
                background: 'linear-gradient(135deg, rgb(var(--panel-accent-rgb)), rgb(var(--panel-accent2-rgb)))',
                color: 'hsl(var(--primary-foreground))',
                boxShadow: '0 8px 24px rgba(var(--panel-accent-rgb),0.45), 0 0 0 4px hsl(var(--background)), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              <Plus className="w-7 h-7" strokeWidth={2.6} />
            </motion.button>
          </div>

          {/* Right pair: Services + Settings */}
          {navItems.slice(2).map((item) => (
            <NavButton key={item.key} item={item} active={activeTab === item.key} onClick={() => switchTab(item.key)} />
          ))}
        </div>
      </nav>

      {/* FAB Quick Actions Sheet */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFabOpen(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(20,20,32,0.92) 0%, rgba(12,12,22,0.96) 100%)',
                backdropFilter: 'blur(28px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
                borderTop: '1px solid rgba(var(--panel-accent-rgb),0.25)',
                boxShadow: '0 -12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1.5 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center justify-between px-5 pb-4">
                <p className="text-sm font-semibold text-foreground/80">Quick Create</p>
                <button onClick={() => setFabOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 active:scale-90 transition-transform" aria-label="Close">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="px-4 grid grid-cols-4 gap-3">
                {FAB_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.label}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => { navigate(action.path); setFabOpen(false); }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${action.color}, ${action.color}cc)`,
                          boxShadow: `0 6px 18px -4px ${action.color}80, inset 0 1px 0 rgba(255,255,255,0.2)`,
                        }}
                      >
                        <Icon className="w-6 h-6 text-white" strokeWidth={2.2} />
                      </div>
                      <span className="text-[10px] font-semibold text-foreground/70 text-center leading-tight">{action.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavButton({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-1 transition-all active:scale-90"
      aria-label={item.label}
    >
      <div
        className="relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300"
        style={active ? {
          background: `linear-gradient(135deg, rgba(${item.glow},0.18), rgba(${item.glow},0.06))`,
          border: `1px solid rgba(${item.glow},0.35)`,
          boxShadow: `0 0 14px -4px rgba(${item.glow},0.35)`,
        } : {}}
      >
        {active && (
          <span
            className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
          />
        )}
        <Icon
          className="w-[22px] h-[22px] transition-all duration-300"
          style={{
            color: active ? item.color : 'hsl(var(--muted-foreground))',
            filter: active ? `drop-shadow(0 0 4px rgba(${item.glow},0.4))` : 'none',
          }}
          strokeWidth={active ? 2.4 : 2}
        />
      </div>
      <span
        className="text-[10px] font-semibold leading-none transition-colors duration-200"
        style={{ color: active ? item.color : 'hsl(var(--muted-foreground))' }}
      >
        {item.label}
      </span>
    </button>
  );
}