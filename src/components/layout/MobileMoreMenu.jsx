import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MoreHorizontal, Sun, Moon, Bot, Settings, X, Calendar } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import GlobalDateFilter from '@/components/layout/GlobalDateFilter';

/**
 * Mobile "More" menu — replaces the 4 always-on top-bar icon buttons
 * with a single ⋯ button that opens a clean bottom sheet.
 */
export default function MobileMoreMenu() {
  const [open, setOpen] = useState(false);
  const { mode, toggleMode } = useTheme();

  const close = () => setOpen(false);

  const rowCls =
    'w-full flex items-center gap-3 h-14 px-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-medium text-foreground/80 active:scale-[0.98] transition-transform';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'hsl(var(--muted-foreground))',
        }}
        aria-label="More options"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {open && (
        <div className="md:hidden fixed inset-0 z-[60]" onClick={close}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

          {/* Bottom sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl overflow-hidden animate-fade-in-up"
            style={{
              background: 'linear-gradient(180deg, var(--header-tint-1) 0%, var(--header-tint-2) 100%)',
              backdropFilter: 'blur(24px) saturate(1.5)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
              borderTop: '1px solid rgba(var(--panel-accent-rgb),0.2)',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.3)',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.5rem)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Title + close */}
            <div className="flex items-center justify-between px-5 pb-3">
              <p className="text-sm font-semibold text-foreground/80">Quick Actions</p>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 active:scale-90 transition-transform"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Action rows */}
            <div className="px-3 space-y-2">
              {/* Date Filter — label on left, GlobalDateFilter trigger on right */}
              <div className="w-full flex items-center justify-between h-14 px-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 text-sm font-medium text-foreground/80">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>Date Filter</span>
                </div>
                <GlobalDateFilter />
              </div>

              {/* Theme toggle */}
              <button onClick={toggleMode} className={rowCls}>
                {mode === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400 flex-shrink-0" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                )}
                <span>{mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
              </button>

              {/* AI Agents */}
              <Link to="/agents" onClick={close} className={rowCls}>
                <Bot className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <span>AI Agents</span>
              </Link>

              {/* Settings */}
              <Link to="/settings" onClick={close} className={rowCls}>
                <Settings className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}