import { Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getCompanySettings } from '@/lib/companySettings';
import BrandName from '@/components/layout/BrandName';
import AnimatedInput from '@/components/ui/animated-input';
import GlobalDateFilter from '@/components/layout/GlobalDateFilter';
import { useTheme } from '@/lib/theme';
import { Sun, Moon } from 'lucide-react';
import { navItems, getIcon } from '@/lib/navConfig';
import { getTabFromPath } from '@/lib/TabHistoryContext';

function getPageContext(pathname) {
  for (const item of navItems) {
    for (const child of item.children || []) {
      if (pathname === child.path || pathname.startsWith(child.path + '/')) {
        return { parent: item.label, current: child.label, icon: child.icon, color: child.color, isDashboard: false };
      }
    }
  }
  if (pathname === '/') return { parent: null, current: 'Dashboard', icon: null, color: null, isDashboard: true };
  if (pathname.startsWith('/settings')) return { parent: null, current: 'Settings', icon: 'Settings', color: '#6366f1', isDashboard: false };
  if (pathname.startsWith('/agents')) return { parent: null, current: 'AI Agents', icon: 'Bot', color: '#a855f7', isDashboard: false };
  if (pathname.startsWith('/prompt-generator')) return { parent: null, current: 'Prompt Studio', icon: 'Sparkles', color: '#ec4899', isDashboard: false };
  return { parent: null, current: '', icon: null, color: null, isDashboard: true };
}

function getSubModules(activeTab) {
  if (activeTab === 'accounts') {
    const accounts = navItems.find((n) => n.key === 'accounts');
    const documents = navItems.find((n) => n.key === 'documents');
    return [...(accounts?.children || []), ...(documents?.children || [])];
  }
  return navItems.find((n) => n.key === activeTab)?.children || [];
}

export default function MobileHeader() {
  const [logoUrl, setLogoUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const { mode, toggleMode } = useTheme();

  useEffect(() => {
    getCompanySettings().then((s) => setLogoUrl(s.logo_url));
  }, []);

  const pageContext = useMemo(() => getPageContext(location.pathname), [location.pathname]);
  const activeTab = useMemo(() => getTabFromPath(location.pathname), [location.pathname]);
  const subModules = useMemo(() => getSubModules(activeTab), [activeTab]);

  const accentColor = pageContext.color || 'rgb(var(--panel-accent-rgb))';

  return (
    <header className="md:hidden sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Theme-aware backdrop */}
      <div
        className="absolute inset-0 bg-background/90"
        style={{
          backdropFilter: 'blur(20px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.6)',
        }}
      />
      {/* Ambient color bloom — uses page accent (subtle) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 80% at 15% 50%, ${accentColor}12, transparent 60%), radial-gradient(ellipse 50% 70% at 85% 30%, rgba(var(--panel-accent2-rgb),0.06), transparent 55%)`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-px bg-border/60" />

      {/* Row 1: Logo + Page context + Icon cluster */}
      <div className="relative h-14 px-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            {pageContext.isDashboard ? (
              <div className="relative flex-shrink-0">
                <div
                  className="absolute inset-0 rounded-xl blur-md opacity-60"
                  style={{ background: 'radial-gradient(circle, rgba(var(--panel-accent-rgb),0.40) 0%, transparent 70%)' }}
                />
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="relative w-8 h-8 rounded-xl object-contain ring-1 ring-border" />
                ) : (
                  <div className="relative w-8 h-8 rounded-xl border border-[rgba(var(--panel-accent-rgb),0.3)] bg-gradient-to-br from-[rgba(var(--panel-accent-rgb),0.20)] to-[rgba(var(--panel-accent2-rgb),0.12)] flex items-center justify-center shadow-lg" style={{ boxShadow: '0 4px 14px -4px rgba(var(--panel-accent-rgb),0.3)' }}>
                    <span className="text-[10px] font-bold text-primary">BW</span>
                  </div>
                )}
              </div>
            ) : (
              (() => {
                const PageIcon = pageContext.icon ? getIcon(pageContext.icon) : null;
                return (
                  <div
                    className="relative flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${pageContext.color || 'rgb(var(--panel-accent-rgb))'}30, ${pageContext.color || 'rgb(var(--panel-accent-rgb))'}10)`,
                      border: `1px solid ${pageContext.color || 'rgb(var(--panel-accent-rgb))'}50`,
                      boxShadow: `0 4px 14px -4px ${pageContext.color || 'rgb(var(--panel-accent-rgb))'}50, inset 0 1px 0 rgba(255,255,255,0.12)`,
                    }}
                  >
                    {PageIcon && <PageIcon className="w-4.5 h-4.5" style={{ color: pageContext.color || 'rgb(var(--panel-accent-rgb))' }} />}
                  </div>
                );
              })()
            )}
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-tight truncate text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                {pageContext.current || <BrandName variant="mobile" />}
              </p>
              {pageContext.parent && (
                <p className="text-[10px] text-muted-foreground leading-tight truncate font-medium">{pageContext.parent}</p>
              )}
            </div>
          </Link>
        </div>

        {/* Always-visible: animated search + date filter + dark mode toggle */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <AnimatedInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search..."
            openWidth={180}
            closedWidth={36}
          />
          <GlobalDateFilter />
          <button
            onClick={toggleMode}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(var(--panel-accent-rgb),0.18), rgba(var(--panel-accent2-rgb),0.10))',
              border: '1px solid rgba(var(--panel-accent-rgb),0.30)',
              color: 'rgb(var(--panel-accent2-rgb))',
            }}
            aria-label="Toggle dark mode"
          >
            {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </div>

      {/* Row 2: Sub-module pills — horizontal scroll, only when sub-modules exist */}
      {subModules.length > 0 && (
        <div className="relative px-3.5 pb-2.5 overflow-x-auto no-scrollbar premium-scroll">
          <div className="flex items-center gap-2 min-w-max">
            {subModules.map((mod) => {
              const Icon = getIcon(mod.icon);
              const active = location.pathname === mod.path || location.pathname.startsWith(mod.path + '/');
              return (
                <Link
                  key={mod.key}
                  to={mod.path}
                  className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                    active
                      ? 'text-white border'
                      : 'bg-muted/50 text-foreground border border-border'
                  }`}
                  style={active ? {
                    background: `linear-gradient(135deg, ${mod.color || 'rgb(var(--panel-accent-rgb))'}, ${mod.color || 'rgb(var(--panel-accent-rgb))'}dd)`,
                    borderColor: `${mod.color || 'rgb(var(--panel-accent-rgb))'}99`,
                    boxShadow: `0 4px 14px -3px ${mod.color || 'rgb(var(--panel-accent-rgb))'}66, inset 0 1px 0 rgba(255,255,255,0.15)`,
                  } : {}}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: active ? '#ffffff' : 'hsl(var(--foreground))' }} />
                  {mod.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}