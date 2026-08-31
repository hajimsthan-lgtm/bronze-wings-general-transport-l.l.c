import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Layers, Wrench, Settings, Plus, X, Truck, Receipt, FileText, FilePlus2, Droplets, FileSignature, CreditCard } from 'lucide-react';
import TripFormSheet from '@/components/trips/TripFormSheet';
import ExpenseFormSheet from '@/components/expenses/ExpenseFormSheet';
import InvoiceFormSheet from '@/components/invoices/InvoiceFormSheet';
import QuotationFormSheet from '@/components/quotations/QuotationFormSheet';
import FuelFormSheet from '@/components/fuel/FuelFormSheet';
import AgreementFormSheet from '@/components/agreements/AgreementFormSheet';
import PaymentFormSheet from '@/components/payments/PaymentFormSheet';

const NAV_ITEMS = [
  { label: 'Home', icon: Home, path: '/', match: ['/'] },
  { label: 'Operations', icon: Layers, path: '/trips', match: ['/trips', '/contracts', '/expenses', '/fuel', '/maintenance'] },
  { label: 'Service', icon: Wrench, path: '/maintenance', match: ['/maintenance', '/services'] },
  { label: 'Settings', icon: Settings, path: '/settings', match: ['/settings'] },
];

const FAB_ACTIONS = [
  { key: 'trip', label: 'New Trip', icon: Truck, color: '#fb923c' },
  { key: 'expense', label: 'New Expense', icon: Receipt, color: '#f97316' },
  { key: 'invoice', label: 'New Invoice', icon: FileText, color: '#22c55e' },
  { key: 'quotation', label: 'New Quotation', icon: FilePlus2, color: '#06b6d4' },
  { key: 'fuel', label: 'New Fuel', icon: Droplets, color: '#3b82f6' },
  { key: 'agreement', label: 'New Agreement', icon: FileSignature, color: '#a855f7' },
  { key: 'payment', label: 'New Payment', icon: CreditCard, color: '#ec4899' },
];

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [fabOpen, setFabOpen] = useState(false);
  const [activeForm, setActiveForm] = useState(null);
  const fabRef = useRef(null);

  const isActive = (match) => match.some((p) => p === '/' ? location.pathname === '/' : location.pathname.startsWith(p));

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
    setTimeout(() => setActiveForm(key), 180);
  };

  const closeForm = () => setActiveForm(null);

  // Left pair: Home + Operations; Right pair: Alerts + Settings
  const leftItems = NAV_ITEMS.slice(0, 2);
  const rightItems = NAV_ITEMS.slice(2);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-4 py-2"
        style={{
          background: '#ffffff',
          borderTop: '1px solid #f1f5f9',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
        }}
      >
        {/* Fan-out backdrop */}
        {fabOpen && createPortal(
          <div
            className="md:hidden fixed inset-0"
            style={{ zIndex: 9998, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            onClick={() => setFabOpen(false)}
          />,
          document.body
        )}

        {/* Fan-out icons — portaled to body */}
        {createPortal(
          <AnimatePresence>
          {fabOpen && FAB_ACTIONS.map((action, i) => {
            const Icon = action.icon;
            const n = FAB_ACTIONS.length;
            const angle = 195 + (i / (n - 1)) * 150;
            const rad = (angle * Math.PI) / 180;
            const radius = 150;
            const x = radius * Math.cos(rad);
            const y = radius * Math.sin(rad);
            return (
              <motion.button
                key={action.label}
                type="button"
                onClick={() => handleAction(action.key)}
                className="fixed flex flex-col items-center gap-1 w-11"
                style={{ left: '50%', bottom: '4.5rem', marginLeft: '-22px', zIndex: 9999 }}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x, y }}
                exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                transition={{ type: 'spring', damping: 16, stiffness: 320, delay: i * 0.04 }}
                whileTap={{ scale: 0.86 }}
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(145deg, ${action.color}, ${action.color}cc)`,
                    boxShadow: `0 6px 18px -3px ${action.color}80, 0 0 0 3px #ffffff, inset 0 1px 0 rgba(255,255,255,0.25)`,
                  }}
                >
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <span
                  className="text-[9px] font-semibold leading-none px-1.5 py-0.5 rounded-md whitespace-nowrap"
                  style={{ color: action.color, background: 'rgba(255,255,255,0.92)', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
                >
                  {action.label}
                </span>
              </motion.button>
            );
          })}
          </AnimatePresence>,
          document.body
        )}

        {/* Left nav items */}
        {leftItems.map((item) => (
          <NavButton key={item.label} item={item} active={isActive(item.match)} onClick={() => navigate(item.path)} />
        ))}

        {/* Center FAB */}
        <div ref={fabRef} className="flex items-center justify-center">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setFabOpen((v) => !v)}
            className="relative -mt-7 w-14 h-14 rounded-full flex items-center justify-center"
            aria-label="Quick add"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              boxShadow: '0 8px 24px rgba(99,102,241,0.45), 0 0 0 4px #ffffff, inset 0 1px 0 rgba(255,255,255,0.25)',
              zIndex: 9999,
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {fabOpen ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X className="w-7 h-7 text-white" strokeWidth={2.6} />
                </motion.span>
              ) : (
                <motion.span key="plus" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Plus className="w-7 h-7 text-white" strokeWidth={2.6} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Right nav items */}
        {rightItems.map((item) => (
          <NavButton key={item.label} item={item} active={isActive(item.match)} onClick={() => navigate(item.path)} />
        ))}
      </nav>

      {/* Form modals */}
      <TripFormSheet open={activeForm === 'trip'} onOpenChange={(o) => !o && closeForm()} onSaved={closeForm} />
      <ExpenseFormSheet open={activeForm === 'expense'} onOpenChange={(o) => !o && closeForm()} onSaved={closeForm} />
      <InvoiceFormSheet open={activeForm === 'invoice'} onOpenChange={(o) => !o && closeForm()} onSaved={closeForm} />
      <QuotationFormSheet open={activeForm === 'quotation'} onOpenChange={(o) => !o && closeForm()} onSaved={closeForm} />
      <FuelFormSheet open={activeForm === 'fuel'} onOpenChange={(o) => !o && closeForm()} onSave={closeForm} />
      <AgreementFormSheet open={activeForm === 'agreement'} onOpenChange={(o) => !o && closeForm()} onSaved={closeForm} />
      <PaymentFormSheet open={activeForm === 'payment'} onOpenChange={(o) => !o && closeForm()} onSaved={closeForm} />
    </>
  );
}

function NavButton({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-full transition-all active:scale-90"
      style={active ? { background: '#f4f4f5' } : {}}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-black' : 'text-slate-400'}`} strokeWidth={active ? 2.4 : 2} />
      <span className={`text-[9px] font-semibold ${active ? 'text-black' : 'text-slate-400'}`}>{item.label}</span>
    </button>
  );
}