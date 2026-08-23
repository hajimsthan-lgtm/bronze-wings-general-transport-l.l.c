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
    'w-full flex items-center gap-3 h-14 px-4 rounded-2xl text-sm font-semibold text-white/80 active:scale-[0.98] transition-transform';
  const rowStyle = {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.10))',
          border: '1px solid rgba(99,102,241,0.30)',
          color: '#a5b4fc',
          boxShadow: '0 0 14px -2px rgba(99,102,241,0.30), inset 0 1px 0 rgba(255,255,255,0.10)',
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
              background: 'linear-gradient(180deg, rgba(20,20,32,0.88) 0%, rgba(12,12,22,0.94) 100%)',
              backdropFilter: 'blur(28px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
              borderTop: '1px solid rgba(99,102,241,0.25)',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)',
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
              <div className="w-full flex items-center justify-between h-14 px-4 rounded-2xl" style={rowStyle}>
                <div className="flex items-center gap-3 text-sm font-semibold text-white/80">
                  <Calendar className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <span>Date Filter</span>
                </div>
                <GlobalDateFilter />
              </div>

              {/* Theme toggle */}
              <button onClick={toggleMode} className={rowCls} style={rowStyle}>
                {mode === 'dark' ? (
                  <Sun className="w-5 h-5 text-amber-400 flex-shrink-0" />
                ) : (
                  <Moon className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                )}
                <span>{mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
              </button>

              {/* AI Agents */}
              <Link to="/agents" onClick={close} className={rowCls} style={rowStyle}>
                <Bot className="w-5 h-5 text-purple-400 flex-shrink-0" />
                <span>AI Agents</span>
              </Link>

              {/* Settings */}
              <Link to="/settings" onClick={close} className={rowCls} style={rowStyle}>
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