import { Link, useLocation } from 'react-router-dom';
import { useTabHistory } from '@/lib/TabHistoryContext';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, Truck, BarChart3, Shield, Bot, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useState, useEffect } from 'react';

const COLLAPSE_THRESHOLD = 1024; // below lg → icon-only rail

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/', paths: ['/'] },
  { key: 'operations', icon: Truck, path: '/trips', paths: ['/trips', '/contracts', '/expenses'] },
  { key: 'reports', icon: BarChart3, path: '/reports/daily', paths: ['/reports'] },
  { key: 'admin', icon: Shield, path: '/admin/vehicles', paths: ['/admin'] },
  { key: 'agents', icon: Bot, path: '/agents', paths: ['/agents'] },
];

export default function ContentSidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const { switchTab } = useTabHistory();
  const [collapsed, setCollapsed] = useState(false);
  const [userOverride, setUserOverride] = useState(false);

  // Auto-adjust to screen size (auto-close on smaller desktops)
  useEffect(() => {
    const apply = () => {
      if (!userOverride) setCollapsed(window.innerWidth < COLLAPSE_THRESHOLD);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [userOverride]);

  // Auto-close immediately after navigation on compact screens
  useEffect(() => {
    if (window.innerWidth < COLLAPSE_THRESHOLD) setCollapsed(true);
  }, [location.pathname]);

  const toggle = () => {
    setCollapsed((c) => !c);
    setUserOverride(true);
  };

  const isActive = (item) =>
    (item.paths || [item.path]).some((p) =>
      p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
    );

  return (
    <aside
      className={`hidden md:flex md:flex-shrink-0 md:sticky md:top-[8.75rem] md:self-start flex-col gap-1 rounded-2xl p-2 max-h-[calc(100dvh-10rem)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        collapsed ? 'md:w-[68px]' : 'md:w-[244px]'
      }`}
      style={{
        background: 'linear-gradient(180deg, rgba(var(--surf-1-rgb),0.78) 0%, rgba(var(--surf-2-rgb),0.90) 100%)',
        backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
        border: '1px solid rgba(var(--panel-accent-rgb),0.16)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 48px rgba(var(--panel-accent-rgb),0.04), 0 16px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(var(--panel-accent-rgb),0.06)',
      }}
    >
      {/* top specular highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16) 50%, transparent)' }} />

      {/* Toggle / collapse control */}
      <button
        onClick={toggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={`relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/[0.05] transition-all border border-transparent mb-1 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <span className="flex items-center gap-2">
          {collapsed ? <PanelLeftOpen className="w-4 h-4 shrink-0" /> : <PanelLeftClose className="w-4 h-4 shrink-0" />}
        </span>
        {!collapsed && <span className="tracking-wide text-xs uppercase">Collapse</span>}
      </button>

      <div className="px-2 pb-1">
        <span className="eyebrow">{collapsed ? '•' : 'Navigation'}</span>
      </div>

      {navItems.map((item) => {
        const active = isActive(item);
        const label = t(item.key);
        return (
          <button
            key={item.key}
            onClick={() => switchTab(item.key)}
            title={collapsed ? label : undefined}
            className={`relative flex items-center rounded-xl transition-all duration-200 border ${
              collapsed ? 'justify-center px-0 py-2.5 w-12 h-12 mx-auto' : 'items-center gap-3 px-3 py-2.5'
            } ${
              active
                ? 'text-white'
                : 'text-white/55 hover:text-white hover:bg-white/[0.04] border-transparent'
            }`}
            style={
              active
                ? {
                    background: 'linear-gradient(135deg, rgba(var(--panel-accent-rgb),0.26), rgba(var(--panel-accent-rgb),0.12))',
                    borderColor: 'rgba(var(--panel-accent-rgb),0.40)',
                    boxShadow:
                      'inset 0 1px 0 rgba(255,255,255,0.10), 0 0 22px -6px rgba(var(--panel-accent-rgb),0.55)',
                  }
                : { borderColor: 'transparent' }
            }
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" style={active ? { color: 'rgb(var(--panel-accent2-rgb))' } : undefined} />
            {!collapsed && <span className="tracking-wide text-sm">{label}</span>}
            {active && (
              <span
                className="absolute -left-[7px] top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full"
                style={{ background: 'rgb(var(--panel-accent-rgb))', boxShadow: '0 0 10px rgba(var(--panel-accent-rgb),0.8)' }}
              />
            )}
          </button>
        );
      })}

      <div className="mt-2 mx-2 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      {!collapsed && (
        <div className="px-2 py-1">
          <span className="eyebrow">Recents</span>
        </div>
      )}

      <div className="mt-auto pt-2">
        <Link
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={`relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 hover:text-white hover:bg-white/[0.04] transition-all border border-transparent ${
            collapsed ? 'justify-center px-0 w-12 h-12 mx-auto' : 'items-center gap-3'
          }`}
        >
          <Settings className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span className="tracking-wide">Settings</span>}
        </Link>
      </div>
    </aside>
  );
}