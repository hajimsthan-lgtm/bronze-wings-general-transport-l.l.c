import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Clock, Award, Zap, ChevronRight } from 'lucide-react';

const ITEMS = [
  { icon: Bell, label: 'Notifications', meta: '3 new', color: '#f43f5e', path: '/notifications' },
  { icon: Clock, label: 'Recent', meta: '12 items', color: '#3b82f6', path: '/trips' },
  { icon: Award, label: 'Achievements', meta: 'Gold', color: '#f59e0b', path: '/settings' },
  { icon: Zap, label: 'Quick actions', meta: '5', color: '#8b5cf6', action: 'fab' },
];

const AUTO_CLOSE_MS = 3000;

export default function MobileAlertBanner() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const autoCloseTimer = useRef(null);
  const navigate = useNavigate();
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });

  // Auto-close after 3 seconds if no touch
  useEffect(() => {
    if (!open) return;
    autoCloseTimer.current = setTimeout(() => setOpen(false), AUTO_CLOSE_MS);
    return () => { if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current); };
  }, [open]);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [open]);

  // Pull-to-refresh dismisses
  useEffect(() => {
    if (!open) return;
    const onRefresh = () => setOpen(false);
    window.addEventListener('global:refresh', onRefresh);
    return () => window.removeEventListener('global:refresh', onRefresh);
  }, [open]);

  const openPanel = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen(true);
  };

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
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label="Alerts"
        aria-expanded={open}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
        style={{ border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
      >
        <Bell className="w-[18px] h-[18px]" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-background animate-pulse" />
      </button>

      {/* Backdrop + Panel — portaled to body together to escape header stacking context */}
      {open && createPortal(
        <>
          {/* Backdrop — catches outside touch to close */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998, background: 'transparent' }}
            onClick={() => setOpen(false)}
            onTouchStart={() => setOpen(false)}
          />
          {/* Panel */}
          <motion.div
            className="fixed w-[260px] overflow-hidden rounded-2xl"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              top: panelPos.top,
              right: panelPos.right,
              zIndex: 9999,
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
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
        </>,
        document.body
      )}
    </div>
  );
}