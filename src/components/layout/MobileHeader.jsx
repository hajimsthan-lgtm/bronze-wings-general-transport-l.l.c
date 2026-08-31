import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { getCompanySettings } from '@/lib/companySettings';
import BrandName from '@/components/layout/BrandName';
import GlobalDateFilter from '@/components/layout/GlobalDateFilter';
import MobileAlertBanner from '@/components/layout/MobileAlertBanner';
import { ArrowLeft, Search, Filter, Settings } from 'lucide-react';
import '@/lib/solidIcons.css';
import { navItems, getIcon } from '@/lib/navConfig';
import { setMobileFilter, useMobileFilter } from '@/lib/mobileHeaderFilter';

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
  const navigate = useNavigate();
  const filterValue = useMobileFilter();
  const isHome = location.pathname === '/';

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
      {/* Ambient color bloom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 60% 80% at 15% 50%, ${accentColor}12, transparent 60%), radial-gradient(ellipse 50% 70% at 85% 30%, rgba(var(--panel-accent2-rgb),0.06), transparent 55%)`,
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-px bg-border/60" />

      {/* Row 1: Back arrow + Title + Date filter + Alert bell */}
      <div className="relative h-14 px-3 flex items-center gap-2">
        {/* Back arrow — all pages except home */}
        {!isHome ? (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : null}

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link to="/" className="flex items-center gap-2 min-w-0">
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
                    className="relative flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${pageContext.color || 'rgb(var(--panel-accent-rgb))'}30, ${pageContext.color || 'rgb(var(--panel-accent-rgb))'}10)`,
                      border: `1px solid ${pageContext.color || 'rgb(var(--panel-accent-rgb))'}50`,
                    }}
                  >
                    {PageIcon && <PageIcon className="w-4 h-4" style={{ color: pageContext.color || 'rgb(var(--panel-accent-rgb))' }} />}
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

        {/* Right cluster: Date filter + Settings + Alert bell */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <GlobalDateFilter solid />
          <button
            onClick={() => navigate('/settings')}
            aria-label="Settings"
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all active:scale-90"
          >
            <Settings className="w-5 h-5" />
          </button>
          <MobileAlertBanner />
        </div>
      </div>

      {/* Row 2: Global search (home) or page filter (other pages) */}
      <div className="relative px-3 pb-1.5">
        {isHome ? (
          <div className="flex items-center gap-2 px-2.5 h-8 rounded-lg bg-muted/40 border border-border/30">
            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <input
              placeholder="Search the whole app..."
              className="flex-1 bg-transparent text-xs focus:outline-none text-foreground placeholder:text-muted-foreground"
              onChange={(e) => window.dispatchEvent(new CustomEvent('mobile:global-search', { detail: e.target.value }))}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 h-8 rounded-lg bg-muted/40 border border-border/30">
            <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <input
              placeholder="Filter results"
              value={filterValue}
              onChange={(e) => setMobileFilter(e.target.value)}
              className="flex-1 bg-transparent text-xs focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
        )}
      </div>
    </header>
  );
}