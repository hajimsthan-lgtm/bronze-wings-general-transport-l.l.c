import { Link, useLocation } from 'react-router-dom';
import { useTabHistory } from '@/lib/TabHistoryContext';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, Truck, BarChart3, Shield, Bot, Settings, ChevronsRight, ChevronsLeft } from 'lucide-react';
import { useState } from 'react';

/* Each nav item carries its own modern color model — a duotone gradient,
   a glow color, and a soft tint for the active halo. */
const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', from: '#6366f1', to: '#4338ca', glow: '99,102,241', paths: ['/'] },
  { key: 'operations', icon: Truck, label: 'Operations', from: '#0ea5e9', to: '#0369a1', glow: '14,165,233', paths: ['/trips', '/contracts', '/expenses'] },
  { key: 'reports', icon: BarChart3, label: 'Reports', from: '#a855f7', to: '#6d28d9', glow: '168,85,247', paths: ['/reports'] },
  { key: 'admin', icon: Shield, label: 'Admin', from: '#f59e0b', to: '#c2410c', glow: '245,158,11', paths: ['/admin'] },
  { key: 'agents', icon: Bot, label: 'AI Agents', from: '#10b981', to: '#047857', glow: '16,185,129', paths: ['/agents'] },
];

function IconTile({ item, active, expanded }) {
  return (
    <span
      className="relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
      style={{
        width: expanded ? 38 : 42,
        height: expanded ? 38 : 42,
        borderRadius: 13,
        background: `linear-gradient(150deg, ${item.from} 0%, ${item.to} 100%)`,
        border: `1px solid rgba(${item.glow},0.55)`,
        boxShadow: active
          ? `inset 0 1.5px 1px rgba(255,255,255,0.55), inset 0 -3px 5px rgba(0,0,0,0.32), 0 8px 20px rgba(${item.glow},0.5), 0 0 0 1px rgba(${item.glow},0.4), 0 0 22px -4px rgba(${item.glow},0.65)`
          : `inset 0 1.5px 1px rgba(255,255,255,0.45), inset 0 -3px 5px rgba(0,0,0,0.3), 0 5px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)`,
        color: '#fff',
      }}
    >
      {/* top specular gloss */}
      <span
        className="pointer-events-none absolute inset-x-[3px] top-[2px] h-1/2 rounded-t-[10px]"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.42), transparent)' }}
      />
      <item.icon className="relative w-[18px] h-[18px]" style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.45))' }} />
      {/* sheen sweep on hover */}
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[13px]">
        <span
          className="absolute top-0 left-[-120%] h-full w-1/2 skew-x-[-20deg] opacity-0 group-hover:opacity-100 group-hover:left-[150%] transition-all duration-700"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
        />
      </span>
    </span>
  );
}

export default function ContentSidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const { switchTab } = useTabHistory();
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const expanded = hover || pinned;

  const isActive = (item) =>
    (item.paths || []).some((p) => (p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)));

  const renderItem = (item) => {
    const active = isActive(item);
    const label = t(item.key) || item.label;
    return (
      <button
        key={item.key}
        onClick={() => switchTab(item.key)}
        title={expanded ? undefined : label}
        className={`group relative flex items-center rounded-2xl transition-all duration-300 ${
          expanded ? 'items-center gap-3 px-2.5 py-2' : 'justify-center w-12 h-12 mx-auto'
        }`}
      >
        <IconTile item={item} active={active} expanded={expanded} />
        {expanded && (
          <span
            className="tracking-wide text-[13px] whitespace-nowrap transition-colors duration-200"
            style={{ color: active ? '#fff' : 'rgba(255,255,255,0.62)' }}
          >
            {label}
          </span>
        )}
        {active && (
          <span
            className="absolute -left-[6px] top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-full"
            style={{ background: item.from, boxShadow: `0 0 10px rgba(${item.glow},0.9)` }}
          />
        )}
        {/* active soft halo behind the row */}
        {active && expanded && (
          <span
            className="pointer-events-none absolute inset-0 rounded-2xl -z-10"
            style={{ background: `radial-gradient(120% 100% at 12% 50%, rgba(${item.glow},0.16), transparent 70%)` }}
          />
        )}
      </button>
    );
  };

  return (
    <div
      className="hidden md:block fixed left-0 top-0 z-[55] h-[100dvh]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* invisible edge hover trigger */}
      <div className="absolute left-0 top-0 w-3 h-full" />

      <aside
        className="relative flex flex-col h-full thin-scroll overflow-y-auto transition-all duration-300 ease-in-out"
        style={{
          width: expanded ? 256 : 60,
          paddingTop: expanded ? 14 : 16,
          paddingBottom: 14,
          paddingLeft: expanded ? 10 : 8,
          paddingRight: expanded ? 10 : 8,
          gap: expanded ? 4 : 12,
          ...(expanded
            ? {
                background: 'linear-gradient(180deg, rgba(var(--surf-1-rgb),0.10) 0%, rgba(var(--surf-2-rgb),0.14) 100%)',
                backdropFilter: 'blur(16px) saturate(1.25)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.25)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderLeft: 'none',
                borderRadius: '0 1.5rem 1.5rem 0',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.10), 16px 0 44px rgba(0,0,0,0.35)',
              }
            : {
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none',
              }),
        }}
      >
        {/* top specular line when expanded */}
        {expanded && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16) 60%, transparent)' }}
          />
        )}

        {/* Toggle / pin (tap fallback) */}
        <button
          onClick={() => setPinned((p) => !p)}
          title={pinned ? 'Unpin (collapse)' : 'Pin open (expand)'}
          className={`group relative flex items-center rounded-xl transition-all duration-200 self-center mb-1 ${
            expanded ? 'w-full justify-between px-3 py-2 text-white/60 hover:text-white hover:bg-white/[0.05]' : 'w-10 h-10 justify-center text-white/55 hover:text-white'
          }`}
          style={!expanded ? { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } : undefined}
        >
          <span className="flex items-center gap-2">
            {expanded ? <ChevronsLeft className="w-4 h-4 shrink-0" /> : <ChevronsRight className="w-4 h-4 shrink-0" />}
          </span>
          {expanded && <span className="tracking-wide text-xs uppercase">Menu</span>}
        </button>

        <div className="px-2 pb-0.5" style={{ minHeight: expanded ? 16 : 0 }}>
          {expanded && <span className="eyebrow">Navigation</span>}
        </div>

        {navItems.map(renderItem)}

        <div className="mt-auto pt-3">
          {expanded && (
            <div className="mx-2 mb-2 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          )}
          <Link
            to="/settings"
            title={expanded ? undefined : 'Settings'}
            className={`group relative flex items-center rounded-2xl transition-all duration-300 ${
              expanded ? 'items-center gap-3 px-2.5 py-2' : 'justify-center w-12 h-12 mx-auto'
            }`}
          >
            <IconTile
              item={{ icon: Settings, from: '#64748b', to: '#334155', glow: '100,116,139' }}
              active={location.pathname.startsWith('/settings')}
              expanded={expanded}
            />
            {expanded && <span className="tracking-wide text-[13px] text-white/70">Settings</span>}
          </Link>
        </div>
      </aside>
    </div>
  );
}