import { Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getCompanySettings } from '@/lib/companySettings';
import BrandName from '@/components/layout/BrandName';
import GlobalDateFilter from '@/components/layout/GlobalDateFilter';
import { useTheme } from '@/lib/theme';
import { Sun, Moon, Search } from 'lucide-react';
import '@/lib/solidIcons.css';
import { navItems, getIcon } from '@/lib/navConfig';

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

export default function MobileHeader() {
  const [logoUrl, setLogoUrl] = useState('');
  const location = useLocation();
  const { mode, toggleMode } = useTheme();

  useEffect(() => {
    getCompanySettings().then((s) => setLogoUrl(s.logo_url));
  }, []);

  const pageContext = useMemo(() => getPageContext(location.pathname), [location.pathname]);

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

        {/* Solid-fill circular icon buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="w-10 h-10 rounded-full shadow-md solid-icon-blue flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
            aria-label="Search"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>
          <GlobalDateFilter solid />
          <button
            onClick={toggleMode}
            className="w-10 h-10 rounded-full shadow-md solid-icon-violet flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
            aria-label="Toggle dark mode"
          >
            {mode === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </div>

    </header>
  );
}