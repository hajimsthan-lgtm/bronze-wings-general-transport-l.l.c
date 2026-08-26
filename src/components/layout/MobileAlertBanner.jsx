import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Clock, Award, Zap, ChevronRight } from 'lucide-react';

const ITEMS = [
  { icon: Bell, label: 'Notifications', meta: '3 new', color: '#f43f5e', path: '/notifications' },
  { icon: Clock, label: 'Recent', meta: '12 items', color: '#3b82f6', path: '/trips' },
  { icon: Award, label: 'Achievements', meta: 'Gold', color: '#f59e0b', path: '/settings' },
  { icon: Zap, label: 'Quick actions', meta: '5', color: '#8b5cf6', action: 'fab' },
];

export default function MobileAlertBanner() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  const handleItem = (item) => {
    setOpen(false);
    if (item.action === 'fab') {
      window.dispatchEvent(new CustomEvent('mobile:open-fab'));
      return;
    }
    if (item.path) navigate(item.path);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="Alerts"
        aria-expanded={open}
        className="w-10 h-10 rounded-full shadow-md solid-icon-rose flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
      >
        <Bell className="w-[18px] h-[18px]" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-background animate-pulse" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[70]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              ref={panelRef}
              className="absolute top-full right-0 mt-2 z-[71] w-[260px] overflow-hidden rounded-2xl"
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
              }}
            >
              <div className="divide-y divide-border/60">
                {ITEMS.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.label}
                      onClick={() => handleItem(item)}
                      className="flex items-center gap-3 py-2.5 px-3 w-full text-left active:bg-muted/50 transition-colors"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                    >
                      <Icon className="w-[18px] h-[18px] flex-shrink-0" style={{ color: item.color }} />
                      <span className="text-sm text-foreground flex-1 font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.meta}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}