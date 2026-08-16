import { Link, useLocation } from 'react-router-dom';
import { Settings, Sun, Moon, Bot } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { getCompanySettings } from '@/lib/companySettings';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import BrandName from '@/components/layout/BrandName';
import GlobalDateFilter from '@/components/layout/GlobalDateFilter';
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
  const { theme, toggleTheme, mode, toggleMode } = useTheme();
  const [logoUrl, setLogoUrl] = useState('');
  const location = useLocation();

  useEffect(() => {
    getCompanySettings().then((s) => setLogoUrl(s.logo_url));
  }, []);

  const pageContext = useMemo(() => getPageContext(location.pathname), [location.pathname]);
  const activeTab = useMemo(() => getTabFromPath(location.pathname), [location.pathname]);
  const subModules = useMemo(() => getSubModules(activeTab), [activeTab]);

  const iconBtnCls = 'w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 flex-shrink-0';

  return (
    <header className="md:hidden sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, var(--header-tint-1) 0%, var(--header-tint-2) 100%)',
          backdropFilter: 'blur(16px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(var(--panel-accent-rgb),0.20) 50%, transparent)' }} />

      {/* Row 1: Logo + Page context + Icon cluster */}
      <div className="relative h-14 px-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            {pageContext.isDashboard ? (
              <div className="relative flex-shrink-0">
                <div
                  className="absolute inset-0 rounded-lg blur-md opacity-50"
                  style={{ background: 'radial-gradient(circle, rgba(var(--panel-accent-rgb),0.30) 0%, transparent 70%)' }}
                />
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="relative w-7 h-7 rounded-lg object-contain ring-1 ring-white/10" />
                ) : (
                  <div className="relative w-7 h-7 rounded-lg border border-[rgba(var(--panel-accent-rgb),0.3)] bg-[rgba(var(--panel-accent-rgb),0.1)] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary">BW</span>
                  </div>
                )}
              </div>
            ) : (
              (() => {
                const PageIcon = pageContext.icon ? getIcon(pageContext.icon) : null;
                return (
                  <div
                    className="relative flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${pageContext.color || 'var(--primary)'}22, ${pageContext.color || 'var(--primary)'}11)`,
                      border: `1px solid ${pageContext.color || 'var(--primary)'}44`,
                    }}
                  >
                    {PageIcon && <PageIcon className="w-4 h-4" style={{ color: pageContext.color || 'var(--primary)' }} />}
                  </div>
                );
              })()
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                {pageContext.current || <BrandName variant="mobile" />}
              </p>
              {pageContext.parent && (
                <p className="text-[10px] text-muted-foreground leading-tight truncate">{pageContext.parent}</p>
              )}
            </div>
          </Link>
        </div>

        {/* Icon cluster — generous gaps, 40px touch targets */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <GlobalDateFilter className={iconBtnCls} />
          <button
            onClick={toggleMode}
            className={iconBtnCls}
            style={{
              background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              color: 'hsl(var(--muted-foreground))',
            }}
            aria-label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {mode === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link
            to="/agents"
            className={`${iconBtnCls} bg-white/5 border border-white/10 text-foreground/70`}
            aria-label="AI Agents"
          >
            <Bot className="w-5 h-5" />
          </Link>
          <Link
            to="/settings"
            className={`${iconBtnCls} bg-white/5 border border-white/10 text-foreground/70`}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Row 2: Sub-module pills — horizontal scroll, only when sub-modules exist */}
      {subModules.length > 0 && (
        <div className="relative px-3 pb-2 overflow-x-auto no-scrollbar premium-scroll">
          <div className="flex items-center gap-2 min-w-max">
            {subModules.map((mod) => {
              const Icon = getIcon(mod.icon);
              const active = location.pathname === mod.path || location.pathname.startsWith(mod.path + '/');
              return (
                <Link
                  key={mod.key}
                  to={mod.path}
                  className={`flex items-center gap-1.5 h-9 px-3.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                    active
                      ? 'bg-[rgba(var(--panel-accent-rgb),0.18)] text-primary border border-[rgba(var(--panel-accent-rgb),0.35)]'
                      : 'bg-white/5 text-muted-foreground border border-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: mod.color }} />
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