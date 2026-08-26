import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Route, Settings, Plus, X, FileText, Receipt, FilePlus2, Truck, Sparkles } from 'lucide-react';
import { useTabHistory } from '@/lib/TabHistoryContext';
import TripFormSheet from '@/components/trips/TripFormSheet';
import ExpenseFormSheet from '@/components/expenses/ExpenseFormSheet';
import InvoiceFormSheet from '@/components/invoices/InvoiceFormSheet';
import QuotationFormSheet from '@/components/quotations/QuotationFormSheet';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Home', color: 'rgb(var(--panel-accent-rgb))', glow: 'var(--panel-accent-rgb)' },
  { key: 'operations', icon: Route, label: 'Operations', color: '#fb923c', glow: '251, 146, 60' },
  { key: 'services', icon: Sparkles, label: 'Services', color: '#c084fc', glow: '192, 132, 252' },
  { key: 'settings', icon: Settings, label: 'Settings', color: '#6366f1', glow: '99, 102, 241' },
];

const FAB_ACTIONS = [
  { key: 'trip', label: 'New Trip', icon: Truck, color: '#fb923c' },
  { key: 'expense', label: 'New Expense', icon: Receipt, color: '#f97316' },
  { key: 'invoice', label: 'New Invoice', icon: FileText, color: '#22c55e' },
  { key: 'quotation', label: 'New Quotation', icon: FilePlus2, color: '#06b6d4' },
];

export default function MobileNav() {
  const { activeTab, switchTab } = useTabHistory();
  const [fabOpen, setFabOpen] = useState(false);
  const [activeForm, setActiveForm] = useState(null);
  const fabRef = useRef(null);

  // Open FAB when triggered by the alert banner's "Quick actions"
  useEffect(() => {
    const handler = () => setFabOpen(true);
    window.addEventListener('mobile:open-fab', handler);
    return () => window.removeEventListener('mobile:open-fab', handler);
  }, []);

  // Close fan on outside click or Escape
  useEffect(() => {
    if (!fabOpen) return;
    const handler = (e) => {
      if (fabRef.current && !fabRef.current.contains(e.target)) setFabOpen(false);
    };
    const esc = (e) => { if (e.key === 'Escape') setFabOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [fabOpen]);

  const handleAction = (key) => {
    setFabOpen(false);
    // Slight delay so the fan collapse animation plays before the modal opens
    setTimeout(() => setActiveForm(key), 180);
  };

  const closeForm = () => setActiveForm(null);

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
            {/* Fan-out backdrop — outside fabRef so outside-click works */}
            <AnimatePresence>
              {fabOpen && (
                <motion.div
                  className="md:hidden fixed inset-0 z-[55]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
                  onClick={() => setFabOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* Fan-out standalone icons */}
            <AnimatePresence>
              {fabOpen && (
                <motion.div
                  key="fan"
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[57] flex flex-col-reverse items-center gap-2.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {FAB_ACTIONS.map((action, i) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={action.label}
                        type="button"
                        onClick={() => handleAction(action.key)}
                        className="flex flex-col items-center gap-1"
                        initial={{ opacity: 0, scale: 0, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0, y: 30 }}
                        transition={{
                          type: 'spring',
                          damping: 16,
                          stiffness: 320,
                          delay: i * 0.04,
                        }}
                        whileTap={{ scale: 0.86 }}
                      >
                        {/* Standalone icon orb — reduced size */}
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center relative"
                          style={{
                            background: `linear-gradient(145deg, ${action.color}, ${action.color}cc)`,
                            boxShadow: `0 6px 18px -3px ${action.color}80, 0 0 0 3px hsl(var(--background)), inset 0 1px 0 rgba(255,255,255,0.25)`,
                          }}
                        >
                          <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                        </div>
                        {/* Label pill */}
                        <span
                          className="text-[9px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{
                            background: 'hsl(var(--background))',
                            color: 'hsl(var(--foreground))',
                            border: '1px solid hsl(var(--border))',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                          }}
                        >
                          {action.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* FAB launcher */}
            <div ref={fabRef}>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setFabOpen((v) => !v)}
                className="relative -mt-7 w-14 h-14 rounded-full flex items-center justify-center z-[58]"
                aria-label="Quick add"
                style={{
                  background: 'linear-gradient(135deg, rgb(var(--panel-accent-rgb)), rgb(var(--panel-accent2-rgb)))',
                  color: 'hsl(var(--primary-foreground))',
                  boxShadow: '0 8px 24px rgba(var(--panel-accent-rgb),0.45), 0 0 0 4px hsl(var(--background)), inset 0 1px 0 rgba(255,255,255,0.25)',
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {fabOpen ? (
                    <motion.span
                      key="x"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-7 h-7" strokeWidth={2.6} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="plus"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Plus className="w-7 h-7" strokeWidth={2.6} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Right pair: Services + Settings */}
          {navItems.slice(2).map((item) => (
            <NavButton key={item.key} item={item} active={activeTab === item.key} onClick={() => switchTab(item.key)} />
          ))}
        </div>
      </nav>

      {/* Form modals — opened by FAB actions, rendered here so they work from any page */}
      <TripFormSheet open={activeForm === 'trip'} onOpenChange={(o) => !o && closeForm()} onSaved={closeForm} />
      <ExpenseFormSheet open={activeForm === 'expense'} onOpenChange={(o) => !o && closeForm()} onSaved={closeForm} />
      <InvoiceFormSheet open={activeForm === 'invoice'} onOpenChange={(o) => !o && closeForm()} onSaved={closeForm} />
      <QuotationFormSheet open={activeForm === 'quotation'} onOpenChange={(o) => !o && closeForm()} onSaved={closeForm} />
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