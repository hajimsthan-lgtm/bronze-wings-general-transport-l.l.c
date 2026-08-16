import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { getCompanySettings } from '@/lib/companySettings';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { navItems, secondaryNav, getIcon, readableOn } from '@/lib/navConfig';

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
      className="hidden md:flex flex-col w-[220px] flex-shrink-0 h-full border-r border-border/50"
      style={{ background: 'hsl(var(--sidebar-background))' }}>
      
      {/* Brand / wordmark */}
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <Link to="/command-center" className="flex items-center gap-3 group/brand cursor-pointer transition-opacity hover:opacity-80 active:scale-[0.98]">
          {logoUrl ?
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-border/60" style={{ boxShadow: '0 0 14px -4px rgba(var(--panel-accent-rgb),0.45)' }}>
              <img src={logoUrl} alt="" className="w-full h-full object-contain" />
            </div> :

          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(145deg, hsl(var(--card)), hsl(var(--background-elevated)))',
              border: '1px solid rgba(var(--panel-accent-rgb),0.30)',
              boxShadow: '0 0 14px -4px rgba(var(--panel-accent-rgb),0.45), inset 0 1px 0 rgba(255,255,255,0.06)'
            }}>
              <span className="text-[13px] font-bold [font-family:'Abril_Fatface',_system-ui]" style={{ color: 'rgb(var(--panel-accent-rgb))', textShadow: '0 0 10px rgba(var(--panel-accent-rgb),0.55)' }}>BW</span>
            </div>
          }
          <div className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight [font-family:'Abril_Fatface',_system-ui]" style={{ color: '#000000' }}>Bronze Wings</span>
            <span className="block text-[10px] font-semibold tracking-tight mt-0.5" style={{ color: '#2563eb' }}>General Transport L.L.C</span>
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
            <p className="px-2 mb-1 text-[9.5px] font-bold tracking-[0.16em] uppercase text-muted-foreground/60">
              {t(section.key) || section.label}
            </p>
            <div className="flex flex-col gap-0.5">
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
                    'relative flex items-center gap-2.5 px-2.5 h-9 rounded-xl text-[13px] font-medium transition-all duration-200 select-none',
                    active ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                  )}
                  style={active ? { background: c, color: readableOn(c) } : undefined}>
                  
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: active ? readableOn(c) : c }} />
                    <span className="truncate text-[#000000]">{label}</span>
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
      <div className="px-3 pb-4 pt-2.5 border-t border-border/50 flex-shrink-0 flex flex-col gap-0.5">
        {secondaryNav.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = getIcon(item.icon);
          const c = item.color;
          return (
            <Link
              key={item.key}
              to={item.path}
              className={cn(
                'flex items-center gap-2.5 px-2.5 h-9 rounded-xl text-[13px] font-medium transition-all duration-200',
                active ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
              )}
              style={active ? { background: c, color: readableOn(c) } : undefined}>
              
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: active ? readableOn(c) : c }} />
              <span className="truncate">{item.label}</span>
            </Link>);

        })}
      </div>
    </aside>);

}