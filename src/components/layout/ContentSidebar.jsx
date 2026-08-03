import { useLocation, useNavigate } from 'react-router-dom';
import { useTabHistory } from '@/lib/TabHistoryContext';
import { useI18n } from '@/lib/i18n';
import {
  Home, Truck, BarChart3, Users, Bot, ChevronsRight, ChevronsLeft,
  Route, Receipt, ClipboardList, TrendingUp, FileText, Landmark, Building2,
} from 'lucide-react';
import { useState } from 'react';
import QuickFanMenu from '@/components/layout/QuickFanMenu';
import { useRailExpanded, railVisibility } from '@/lib/railVisibility';

/* Each nav item carries its own duotone gradient, glow color, and sub-routes. */
const navItems = [
  {
    key: 'dashboard', icon: Home, label: 'Dashboard',
    from: '#6366f1', to: '#4338ca', glow: '99,102,241', paths: ['/'],
  },
  {
    key: 'operations', icon: Truck, label: 'Operations',
    from: '#0ea5e9', to: '#0369a1', glow: '14,165,233', paths: ['/trips', '/contracts', '/expenses'],
    children: [
      { key: 'trips', label: 'Trips', path: '/trips', icon: Route, from: '#3b82f6', to: '#1e3a8a', glow: '59,130,246' },
      { key: 'expenses', label: 'Expenses', path: '/expenses', icon: Receipt, from: '#f59e0b', to: '#b45309', glow: '245,158,11' },
    ],
  },
  {
    key: 'reports', icon: BarChart3, label: 'Reports',
    from: '#a855f7', to: '#6d28d9', glow: '168,85,247', paths: ['/reports'],
    children: [
      { key: 'daily_report', label: 'Daily', path: '/reports/daily', icon: ClipboardList, from: '#06b6d4', to: '#0e7490', glow: '6,182,212' },
      { key: 'profit_loss', label: 'P&L', path: '/reports/pnl', icon: TrendingUp, from: '#8b5cf6', to: '#5b21b6', glow: '139,92,246' },
      { key: 'soa', label: 'SOA', path: '/reports/soa', icon: FileText, from: '#f97316', to: '#9a3412', glow: '249,115,22' },
      { key: 'bank_reconciliation', label: 'Bank Rec', path: '/reports/bank-reconciliation', icon: Landmark, from: '#0ea5e9', to: '#0369a1', glow: '14,165,233' },
    ],
  },
  {
    key: 'admin', icon: Users, label: 'Admin',
    from: '#f59e0b', to: '#c2410c', glow: '245,158,11', paths: ['/admin'],
    children: [
      { key: 'vehicles', label: 'Vehicles', path: '/admin/vehicles', icon: Truck, from: '#6366f1', to: '#3730a3', glow: '99,102,241' },
      { key: 'drivers', label: 'Drivers', path: '/admin/drivers', icon: Users, from: '#10b981', to: '#047857', glow: '16,185,129' },
      { key: 'clients', label: 'Clients', path: '/admin/clients', icon: Building2, from: '#f43f5e', to: '#9f1239', glow: '244,63,94' },
    ],
  },
  {
    key: 'agents', icon: Bot, label: 'AI Agents',
    from: '#10b981', to: '#047857', glow: '16,185,129', paths: ['/agents'],
  },
];

const COLLAPSED_W = 60;
const EXPANDED_W = 232;

/* ── Compact glass tile — small frosted glass with soft accent glow ── */
function NavTile({ item, active, lit, size = 30 }) {
  return (
    <span
      className="relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-108 group-active:scale-95"
      style={{
        width: size,
        height: size,
        borderRadius: 9,
        background: `linear-gradient(160deg, rgba(${item.glow},0.22) 0%, rgba(${item.glow},0.08) 100%)`,
        border: `1px solid rgba(${item.glow},${lit ? 0.55 : 0.28})`,
        boxShadow: lit
          ? `inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 12px rgba(${item.glow},0.18), 0 4px 14px rgba(${item.glow},0.35), 0 0 0 1px rgba(${item.glow},0.22), 0 0 18px -4px rgba(${item.glow},0.5)`
          : `inset 0 1px 0 rgba(255,255,255,0.10), 0 2px 6px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.04)`,
        color: `rgb(${item.glow})`,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-[2px] top-[1px] h-1/2 rounded-t-[8px]"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.22), transparent)' }}
      />
      <item.icon
        className="relative"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          color: lit ? '#fff' : `rgba(${item.glow},0.92)`,
          filter: lit ? `drop-shadow(0 0 6px rgba(${item.glow},0.8))` : 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))',
        }}
      />
    </span>
  );
}

export default function ContentSidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const { switchTab } = useTabHistory();
  const expanded = useRailExpanded();
  const [pinned, setPinned] = useState(false);
  const [hoveredKey, setHoveredKey] = useState(null);

  const isActive = (item) =>
    (item.paths || []).some((p) => (p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)));

  const isChildActive = (child) =>
    location.pathname === child.path || location.pathname.startsWith(child.path + '/');

  const width = expanded ? EXPANDED_W : COLLAPSED_W;

  /* ── Main nav button ── */
  const renderItem = (item) => {
    const active = isActive(item);
    const label = t(item.key) || item.label;
    const hasChildren = !!item.children?.length;
    const showChildren = expanded && hasChildren && hoveredKey === item.key;
    /* when one section is hovered open, every other button fades to very low light */
    const dimmed = expanded && hoveredKey !== null && hoveredKey !== item.key;
    const lit = active || hoveredKey === item.key;

    return (
      <div
        key={item.key}
        className="space-y-1 transition-opacity duration-300"
        style={{ opacity: dimmed ? 0.12 : 1 }}
      >
        <button
          onClick={() => {
            /* parent buttons navigate to their first sub-route; leaf buttons navigate directly */
            if (hasChildren) {
              navigate(item.children[0].path);
            } else {
              switchTab(item.key);
            }
          }}
          onMouseEnter={() => setHoveredKey(item.key)}
          className={`group relative flex items-center ${expanded ? 'gap-2 w-full px-1.5 h-10' : 'justify-center w-10 h-10 mx-auto'} rounded-xl transition-all duration-300`}
          style={
            expanded
              ? {
                  background: active
                    ? `linear-gradient(135deg, rgba(${item.glow},0.20), rgba(${item.glow},0.06))`
                    : `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))`,
                  border: `1px solid ${active ? `rgba(${item.glow},0.40)` : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: active
                    ? `0 0 22px -6px rgba(${item.glow},0.5), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 0 18px rgba(${item.glow},0.08)`
                    : `inset 0 1px 0 rgba(255,255,255,0.04)`,
                }
              : {}
          }
        >
          <NavTile item={item} active={active} lit={lit} />

          {expanded && (
            <span
              className={`text-[10px] font-mono tracking-[0.1em] uppercase whitespace-nowrap ${active ? 'font-bold' : 'font-medium'}`}
              style={{ color: active ? '#fff' : 'rgba(255,255,255,0.88)', textShadow: active ? `0 0 10px rgba(${item.glow},0.7)` : 'none' }}
            >
              {label}
            </span>
          )}

          {/* active indicator bar */}
          {active && (
            <span
              className={`absolute top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full ${expanded ? 'left-0' : '-left-[5px]'}`}
              style={{ background: item.from, boxShadow: `0 0 8px rgba(${item.glow},0.9)` }}
            />
          )}
        </button>

        {/* ── Sub-routes — compact glass tile style ── */}
        {showChildren && (
          <div className="space-y-0.5 pl-2.5 pr-1" style={{ animation: 'fade-in 0.25s ease both' }}>
            {item.children.map((child) => {
              const childActive = isChildActive(child);
              const childLabel = child.label || t(child.key);
              return (
                <button
                  key={child.key}
                  onClick={() => navigate(child.path)}
                  className="group relative flex items-center gap-1.5 w-full pl-1.5 pr-2 h-8 rounded-lg transition-all duration-300 hover:translate-x-1"
                  style={{
                    background: childActive
                      ? `linear-gradient(135deg, rgba(${child.glow},0.20), rgba(${child.glow},0.06))`
                      : `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))`,
                    border: `1px solid ${childActive ? `rgba(${child.glow},0.40)` : 'rgba(255,255,255,0.08)'}`,
                    boxShadow: childActive
                      ? `0 0 18px -6px rgba(${child.glow},0.4), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 14px rgba(${child.glow},0.06)`
                      : `inset 0 1px 0 rgba(255,255,255,0.04)`,
                  }}
                >
                  <NavTile item={child} active={childActive} lit={childActive} size={22} />
                  <span
                    className="text-[9px] font-mono font-medium tracking-[0.1em] uppercase whitespace-nowrap"
                    style={{ color: childActive ? '#fff' : 'rgba(255,255,255,0.88)' }}
                  >
                    {childLabel}
                  </span>
                  {childActive && (
                    <span
                      className="absolute top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-full left-0"
                      style={{ background: child.from, boxShadow: `0 0 8px rgba(${child.glow},0.9)` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="hidden md:block fixed left-0 top-0 z-[55] h-[100dvh]">
      <aside
        className="relative flex flex-col h-full overflow-visible"
        style={{
          width,
          paddingTop: 14,
          paddingBottom: 12,
          paddingLeft: 8,
          paddingRight: 8,
          gap: 5,
          background: 'transparent',
          borderRight: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          boxShadow: 'none',
          transition:
            `width ${expanded ? '.4s' : '.15s'} cubic-bezier(0.16,1,0.3,1)`,
        }}
      >
        {/* Pin toggle — click to expand/collapse the rail (no auto-open) */}
        <button
          onClick={() => {
            const next = !pinned;
            setPinned(next);
            railVisibility.setExpanded(next);
          }}
          title={pinned ? 'Collapse' : 'Expand'}
          className="group relative flex items-center justify-center w-9 h-9 rounded-lg mx-auto mb-1 text-white/55 hover:text-white transition-all duration-200"
          style={{
            background: pinned ? 'rgba(var(--panel-accent-rgb),0.14)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${pinned ? 'rgba(var(--panel-accent-rgb),0.32)' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          {pinned ? <ChevronsLeft className="w-3.5 h-3.5 shrink-0" /> : <ChevronsRight className="w-3.5 h-3.5 shrink-0" />}
        </button>

        {/* Scrollable nav list */}
        <div className="flex-1 overflow-y-auto thin-scroll space-y-1" onMouseLeave={() => setHoveredKey(null)}>
          {navItems.map(renderItem)}
        </div>

        {/* Quick-tools fan launcher — pinned to the bottom, unchanged */}
        <div className="pt-2">
          <QuickFanMenu />
        </div>
      </aside>
    </div>
  );
}