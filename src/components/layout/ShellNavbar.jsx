import { Link, useLocation } from 'react-router-dom';
import { Settings as SettingsIcon, Sun, Moon, LayoutDashboard, Route, FileText } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import AlertBell from '@/components/layout/AlertBell';
import GlobalDateFilter from '@/components/layout/GlobalDateFilter';
import GlobalSearch from '@/components/layout/GlobalSearch';

const QUICK_LINKS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, match: (p) => p === '/' },
  { label: 'Operations', path: '/trips', icon: Route, match: (p) => p === '/trips' || p === '/contracts' || p === '/expenses' },
  { label: 'Invoices', path: '/accounts/invoices', icon: FileText, match: (p) => p.startsWith('/accounts/invoices') },
];

export default function ShellNavbar({ query, setQuery }) {
  const location = useLocation();
  const { user } = useAuth();
  const { mode, toggleMode } = useTheme();

  const initials = (user?.full_name || user?.email || 'U')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const subtext = user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : (user?.email || 'Signed in');

  return (
    <header
      className="hidden md:flex items-center gap-4 h-16 px-5 border-b border-border/50 flex-shrink-0 z-30"
      style={{
        background: 'linear-gradient(180deg, var(--header-tint-1) 0%, var(--header-tint-2) 100%)',
        backdropFilter: 'blur(14px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.3)',
      }}
    >
      {/* Left: quick nav links */}
      <nav className="flex items-center gap-1 flex-shrink-0">
        {QUICK_LINKS.map((l) => {
          const active = l.match(location.pathname);
          return (
            <Link
              key={l.path}
              to={l.path}
              className={cn(
                'flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-medium transition-all duration-200',
                active
                  ? 'text-foreground bg-white/[0.07] border border-border/60'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-transparent'
              )}
            >
              <l.icon className="w-3.5 h-3.5" style={{ color: active ? 'rgb(var(--panel-accent-rgb))' : undefined }} />
              {l.label}
            </Link>
          );
        })}
      </nav>

      {/* Center: global search */}
      <div className="flex-1 flex justify-center px-2">
        <GlobalSearch query={query} setQuery={setQuery} />
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <GlobalDateFilter />
        <AlertBell />
        <Link
          to="/settings"
          aria-label="Settings"
          title="Settings"
          className="flex items-center justify-center w-9 h-9 rounded-full border border-border/50 text-muted-foreground transition-all hover:text-foreground hover:border-primary/40 hover:bg-white/[0.05]"
        >
          <SettingsIcon className="w-4 h-4" />
        </Link>

        {/* User avatar + name + subtext */}
        <div className="flex items-center gap-2.5 pl-1.5 pr-1">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(var(--panel-accent-rgb),0.30), rgba(var(--panel-accent-rgb),0.12))',
              border: '1px solid rgba(var(--panel-accent-rgb),0.30)',
              color: 'rgb(var(--panel-accent-rgb))',
            }}
          >
            {initials}
          </div>
          <div className="leading-tight hidden lg:block">
            <p className="text-[12px] font-semibold text-foreground max-w-[120px] truncate">{user?.full_name || 'User'}</p>
            <p className="text-[10px] text-muted-foreground max-w-[120px] truncate">{subtext}</p>
          </div>
        </div>

        {/* Light/dark toggle switch */}
        <button
          onClick={toggleMode}
          aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={mode === 'dark' ? 'Light mode' : 'Dark mode'}
          className="relative h-7 w-[52px] rounded-full border border-border/50 flex items-center transition-all duration-300 flex-shrink-0"
          style={{ background: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
        >
          <span
            className="absolute flex items-center justify-center w-5 h-5 rounded-full transition-transform duration-300"
            style={{
              transform: mode === 'dark' ? 'translateX(4px)' : 'translateX(28px)',
              background: 'rgb(var(--panel-accent-rgb))',
              boxShadow: '0 0 10px -2px rgba(var(--panel-accent-rgb),0.6)',
            }}
          >
            {mode === 'dark' ? <Moon className="w-3 h-3 text-white" /> : <Sun className="w-3 h-3 text-white" />}
          </span>
        </button>
      </div>
    </header>
  );
}