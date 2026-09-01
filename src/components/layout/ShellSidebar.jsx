import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getCompanySettings } from '@/lib/companySettings';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { navItems, secondaryNav, getIcon, readableOn } from '@/lib/navConfig';
import '@/lib/navGlass.css';

function greetingFor() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function ShellSidebar({ query = '' }) {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  useEffect(() => {getCompanySettings().then(setCompany).catch(() => {});}, []);

  const isChildActive = (child) =>
  location.pathname === child.path || location.pathname.startsWith(child.path + '/');

  const q = query.trim().toLowerCase();
  const sections = useMemo(() => {
    if (!q) return navItems;
    return navItems.
    map((s) => ({
      ...s,
      children: s.children.filter((c) => (c.label || t(c.key) || '').toLowerCase().includes(q))
    })).
    filter((s) => s.children.length > 0);
  }, [q, t]);

  const companyName = company?.company_name || 'Bronze Wings';
  const [firstPart, ...rest] = companyName.split(' ');
  const accentPart = rest.length ? rest.join(' ') : firstPart;
  const showSplit = rest.length > 0;
  const firstName = (user?.full_name || user?.email || 'there').split(' ')[0].split('@')[0];
  const logoUrl = company?.logo_url;

  return (
    <aside
      className="hidden md:flex flex-col w-[200px] flex-shrink-0 h-full border-r border-border/40 relative"
      style={{
        background: 'linear-gradient(180deg, hsl(var(--sidebar-background)) 0%, hsl(var(--background)) 100%)',
        boxShadow: 'inset -1px 0 0 rgba(var(--panel-accent-rgb),0.06)'
      }}>

      {/* Brand / wordmark */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <Link to="/" className="flex items-center gap-3 group/brand cursor-pointer transition-all duration-300 hover:opacity-90 active:scale-[0.98]">
          {logoUrl ?
          <div className="w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 border border-border/50" style={{ boxShadow: '0 0 18px -4px rgba(var(--panel-accent-rgb),0.5), inset 0 1px 0 rgba(255,255,255,0.08)' }}>
              <img src={logoUrl} alt="" className="w-full h-full object-contain" />
            </div> :

          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, hsl(var(--card)) 0%, hsl(var(--background-elevated)) 100%)',
              border: '1px solid rgba(var(--panel-accent-rgb),0.35)',
              boxShadow: '0 0 18px -4px rgba(var(--panel-accent-rgb),0.5), inset 0 1px 0 rgba(255,255,255,0.08)'
            }}>
              <span className="text-[14px] font-bold [font-family:'Abril_Fatface',_system-ui] relative z-10" style={{ color: 'rgb(var(--panel-accent-rgb))', textShadow: '0 0 12px rgba(var(--panel-accent-rgb),0.6)' }}>BW</span>
            </div>
          }
          <div className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight [font-family:'Abril_Fatface',_system-ui]" style={{ color: 'hsl(var(--foreground))' }}>Bronze Wings</span>
            <span className="block text-[10px] font-semibold tracking-tight mt-0.5" style={{ color: 'rgb(var(--panel-accent-rgb))' }}>General Transport L.L.C</span>
          </div>
        </Link>
      </div>

      {/* Greeting */}
      <div className="px-5 pb-3 flex-shrink-0">
        <p className="text-[13px] font-semibold text-foreground">{greetingFor()}, {firstName}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">Welcome back to your fleet</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto thin-scroll px-3 pb-3 flex flex-col gap-3.5">
        {sections.map((section) =>
        <div key={section.key} className="flex flex-col">
            <p className="px-2.5 mb-1.5 text-[9.5px] font-bold tracking-[0.18em] uppercase text-muted-foreground/55 flex items-center gap-2">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
              <span>{(t(section.key) && t(section.key) !== section.key) ? t(section.key) : section.label}</span>
            </p>
            <div className="flex flex-col gap-1">
              {section.children.map((child) => {
              const active = isChildActive(child);
              const Icon = getIcon(child.icon);
              const label = child.label || t(child.key);
              const c = child.color || 'rgb(var(--panel-accent-rgb))';
              return (
                <button
                  key={child.key}
                  onClick={() => navigate(child.path)}
                  aria-label={label}
                  className={cn(
                    'relative flex items-center gap-2.5 px-2.5 h-9 rounded-xl text-[13px] font-medium transition-all duration-300 select-none',
                    active ? 'nav-active-row' : 'nav-text-fixed nav-glass-btn'
                  )}
                  style={active ? { background: `linear-gradient(135deg, ${c}, ${c})`, color: readableOn(c), boxShadow: `0 4px 14px -4px ${c}, inset 0 1px 0 rgba(255,255,255,0.12)` } : undefined}>

                    <Icon className="w-4 h-4 flex-shrink-0 relative z-10" style={{ color: active ? readableOn(c) : c }} />
                    <span className={cn('truncate relative z-10', active ? '' : 'nav-text-fixed')}>{label}</span>
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-white/70" style={{ boxShadow: '0 0 8px rgba(255,255,255,0.6)' }} />}
                  </button>);

            })}
            </div>
          </div>
        )}
        {sections.length === 0 &&
        <div className="text-center text-xs py-8 text-muted-foreground">No results</div>
        }
      </nav>

      {/* Secondary / support nav */}
      <div className="px-3 pb-4 pt-3 border-t border-border/40 flex-shrink-0 flex flex-col gap-1">
        {secondaryNav.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = getIcon(item.icon);
          const c = item.color;
          return (
            <Link
              key={item.key}
              to={item.path}
              className={cn(
                'flex items-center gap-2.5 px-2.5 h-9 rounded-xl text-[13px] font-medium transition-all duration-300',
                active ? 'nav-active-row' : 'nav-text-fixed nav-glass-btn'
              )}
              style={active ? { background: `linear-gradient(135deg, ${c}, ${c})`, color: readableOn(c), boxShadow: `0 4px 14px -4px ${c}, inset 0 1px 0 rgba(255,255,255,0.12)` } : undefined}>

              <Icon className="w-4 h-4 flex-shrink-0 relative z-10" style={{ color: active ? readableOn(c) : c }} />
              <span className={cn('truncate relative z-10', active ? '' : 'nav-text-fixed')}>{item.label}</span>
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-white/70" style={{ boxShadow: '0 0 8px rgba(255,255,255,0.6)' }} />}
            </Link>);

        })}
      </div>
    </aside>);

}