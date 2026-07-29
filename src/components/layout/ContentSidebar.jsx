import { Link, useLocation } from 'react-router-dom';
import { useTabHistory } from '@/lib/TabHistoryContext';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, Truck, BarChart3, Shield, Bot, Settings, ChevronsRight, ChevronsLeft } from 'lucide-react';
import { useState } from 'react';

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
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const expanded = hover || pinned;

  const isActive = (item) =>
    (item.paths || [item.path]).some((p) =>
      p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
    );

  return (
    <div
      className="hidden md:block fixed left-0 top-0 z-[55] h-[100dvh]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* invisible edge hover trigger to catch the cursor approaching the left edge */}
      <div className="absolute left-0 top-0 w-3 h-full" />

      <aside
        className="relative flex flex-col gap-1 rounded-r-2xl p-2 h-full thin-scroll overflow-y-auto transition-[width] duration-300 ease-in-out"
        style={{
          width: expanded ? 248 : 60,
          background: 'linear-gradient(180deg, rgba(var(--surf-1-rgb),0.85) 0%, rgba(var(--surf-2-rgb),0.94) 100%)',
          backdropFilter: 'blur(24px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
          border: '1px solid rgba(var(--panel-accent-rgb),0.18)',
          borderLeft: 'none',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 48px rgba(var(--panel-accent-rgb),0.04), 16px 0 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(var(--panel-accent-rgb),0.06)',
        }}
      >
        {/* top specular highlight */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16) 60%, transparent)' }} />

        {/* Toggle / pin (tap fallback for touch) */}
        <button
          onClick={() => setPinned((p) => !p)}
          title={pinned ? 'Unpin (collapse)' : 'Pin open (expand)'}
          className={`relative flex items-center rounded-xl transition-all duration-200 border mb-1 text-white/60 hover:text-white hover:bg-white/[0.05] border-transparent ${
            expanded ? 'justify-between px-3 py-2.5' : 'justify-center w-12 h-12 mx-auto px-0 py-2.5'
          }`}
        >
          <span className="flex items-center gap-2">
            {expanded ? <ChevronsLeft className="w-4 h-4 shrink-0" /> : <ChevronsRight className="w-4 h-4 shrink-0" />}
          </span>
          {expanded && <span className="tracking-wide text-xs uppercase">Menu</span>}
        </button>

        <div className="px-2 pb-1">
          <span className="eyebrow">{expanded ? 'Navigation' : '•'}</span>
        </div>

        {navItems.map((item) => {
          const active = isActive(item);
          const label = t(item.key);
          return (
            <button
              key={item.key}
              onClick={() => switchTab(item.key)}
              title={expanded ? undefined : label}
              className={`relative flex items-center rounded-xl transition-all duration-200 border ${
                expanded ? 'items-center gap-3 px-3 py-2.5' : 'justify-center w-12 h-12 mx-auto px-0 py-2.5'
              } ${
                active ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/[0.04] border-transparent'
              }`}
              style={
                active
                  ? {
                      background: 'linear-gradient(135deg, rgba(var(--panel-accent-rgb),0.28), rgba(var(--panel-accent-rgb),0.12))',
                      borderColor: 'rgba(var(--panel-accent-rgb),0.42)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 0 22px -6px rgba(var(--panel-accent-rgb),0.6)',
                    }
                  : { borderColor: 'transparent' }
              }
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" style={active ? { color: 'rgb(var(--panel-accent2-rgb))' } : undefined} />
              {expanded && <span className="tracking-wide text-sm whitespace-nowrap">{label}</span>}
              {active && (
                <span
                  className="absolute -left-[7px] top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full"
                  style={{ background: 'rgb(var(--panel-accent-rgb))', boxShadow: '0 0 10px rgba(var(--panel-accent-rgb),0.85)' }}
                />
              )}
            </button>
          );
        })}

        <div className="mt-2 mx-2 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        {expanded && (
          <div className="px-2 py-1">
            <span className="eyebrow">Recents</span>
          </div>
        )}

        <div className="mt-auto pt-2">
          <Link
            to="/settings"
            title={expanded ? undefined : 'Settings'}
            className={`relative flex items-center rounded-xl transition-all border border-transparent text-white/55 hover:text-white hover:bg-white/[0.04] ${
              expanded ? 'items-center gap-3 px-3 py-2.5' : 'justify-center w-12 h-12 mx-auto px-0 py-2.5'
            }`}
          >
            <Settings className="w-[18px] h-[18px] shrink-0" />
            {expanded && <span className="tracking-wide">Settings</span>}
          </Link>
        </div>
      </aside>
    </div>
  );
}