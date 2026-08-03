import { useLocation, useNavigate } from 'react-router-dom';
import { useTabHistory } from '@/lib/TabHistoryContext';
import { useI18n } from '@/lib/i18n';
import {
  LayoutDashboard, Truck, ChartColumn, UsersRound, Bot,
  Route, Receipt, ClipboardList, TrendingUp, FileText, Landmark, Building2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import QuickFanMenu from '@/components/layout/QuickFanMenu';
import { useRailVisible, useRailDimming, useRailExpanded, railVisibility } from '@/lib/railVisibility';

/* Each nav item carries its own duotone gradient, glow color, and sub-routes. */
const navItems = [
  {
    key: 'dashboard', icon: LayoutDashboard, label: 'Dashboard',
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
    key: 'reports', icon: ChartColumn, label: 'Reports',
    from: '#a855f7', to: '#6d28d9', glow: '168,85,247', paths: ['/reports'],
    children: [
      { key: 'daily_report', label: 'Daily', path: '/reports/daily', icon: ClipboardList, from: '#06b6d4', to: '#0e7490', glow: '6,182,212' },
      { key: 'profit_loss', label: 'P&L', path: '/reports/pnl', icon: TrendingUp, from: '#8b5cf6', to: '#5b21b6', glow: '139,92,246' },
      { key: 'soa', label: 'SOA', path: '/reports/soa', icon: FileText, from: '#f97316', to: '#9a3412', glow: '249,115,22' },
      { key: 'bank_reconciliation', label: 'Bank Rec', path: '/reports/bank-reconciliation', icon: Landmark, from: '#0ea5e9', to: '#0369a1', glow: '14,165,233' },
    ],
  },
  {
    key: 'admin', icon: UsersRound, label: 'Admin',
    from: '#f59e0b', to: '#c2410c', glow: '245,158,11', paths: ['/admin'],
    children: [
      { key: 'vehicles', label: 'Vehicles', path: '/admin/vehicles', icon: Truck, from: '#6366f1', to: '#3730a3', glow: '99,102,241' },
      { key: 'drivers', label: 'Drivers', path: '/admin/drivers', icon: UsersRound, from: '#10b981', to: '#047857', glow: '16,185,129' },
      { key: 'clients', label: 'Clients', path: '/admin/clients', icon: Building2, from: '#f43f5e', to: '#9f1239', glow: '244,63,94' },
    ],
  },
  {
    key: 'agents', icon: Bot, label: 'AI Agents',
    from: '#10b981', to: '#047857', glow: '16,185,129', paths: ['/agents'],
  },
];

const COLLAPSED_W = 60;
const EXPANDED_W = 228;

/* ── Compact glass tile — small frame, big icon ── */
function NavTile({ item, active, lit, size = 38 }) {
  return (
    <span
      className="relative flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: `linear-gradient(160deg, rgba(${item.glow},0.24) 0%, rgba(${item.glow},0.08) 100%)`,
        border: `1px solid rgba(${item.glow},${lit ? 0.6 : 0.3})`,
        boxShadow: lit
          ? `inset 0 1px 0 rgba(255,255,255,0.28), inset 0 0 18px rgba(${item.glow},0.28), 0 6px 22px rgba(${item.glow},0.5), 0 0 0 1px rgba(${item.glow},0.35), 0 0 28px -2px rgba(${item.glow},0.7), 0 0 48px -4px rgba(${item.glow},0.4)`
          : `inset 0 1px 0 rgba(255,255,255,0.12), 0 2px 6px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.04)`,
        color: `rgb(${item.glow})`,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-[2px] top-[1px] h-1/2 rounded-t-[9px]"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.24), transparent)' }}
      />
      <item.icon
        className="relative"
        style={{
          width: size * 0.62,
          height: size * 0.62,
          color: lit ? '#fff' : `rgba(${item.glow},0.95)`,
          filter: lit ? `drop-shadow(0 0 6px rgba(${item.glow},0.85))` : 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))',
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
  const panelVisible = useRailVisible();
  const panelDimming = useRailDimming();
  const [hoveredKey, setHoveredKey] = useState(null);
  const dimTimer = useRef(null);
  const vanishTimer = useRef(null);

  /* idle timeline: dimming begins at 5s, full vanish at 10s; any activity resets it */
  const poke = () => {
    clearTimeout(dimTimer.current);
    clearTimeout(vanishTimer.current);
    railVisibility.set(true);
    railVisibility.setDimming(false);
    dimTimer.current = setTimeout(() => railVisibility.setDimming(true), 5000);
    vanishTimer.current = setTimeout(() => railVisibility.set(false), 10000);
  };

  const isActive = (item) =>
    (item.paths || []).some((p) => (p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)));

  const isChildActive = (child) =>
    location.pathname === child.path || location.pathname.startsWith(child.path + '/');

  useEffect(() => { poke(); return () => { clearTimeout(dimTimer.current); clearTimeout(vanishTimer.current); }; }, []);

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
          onMouseEnter={() => { poke(); setHoveredKey(item.key); }}
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
                  onMouseEnter={poke}
                  className="group relative flex items-center gap-1.5 w-full pl-1.5 pr-2 h-8 rounded-lg transition-all duration-300"
                  style={{
                    background: childActive
                      ? `linear-gradient(160deg, rgba(${child.glow},0.18), rgba(${child.glow},0.06))`
                      : 'linear-gradient(160deg, hsl(var(--clay-bg)) 0%, hsl(228 22% 12%) 100%)',
                    border: `1px solid ${childActive ? `rgba(${child.glow},0.45)` : 'hsl(var(--clay-border))'}`,
                    boxShadow: childActive
                      ? `inset 3px 3px 7px hsl(var(--clay-shadow-dark)), inset -3px -3px 7px hsl(var(--clay-shadow-light)), 0 0 0 1px rgba(${child.glow},0.4), 0 0 12px rgba(${child.glow},0.25)`
                      : `4px 4px 9px hsl(var(--clay-shadow-dark)), -4px -4px 9px hsl(var(--clay-shadow-light)), inset 0 1px 0 rgba(255,255,255,0.04)`,
                  }}
                >
                  <NavTile item={child} active={childActive} lit={childActive} size={28} />
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
    <div className="hidden md:block fixed left-0 top-20 z-[55] h-[calc(100dvh-5rem)]">
      {/* invisible edge strip — hover to recall a vanished rail */}
      <div className="absolute left-0 top-0 w-2 h-full z-[56]" onMouseEnter={poke} />
      <aside
        /* click anywhere on the rail opens it; leaving closes it immediately */
        onClick={() => { poke(); if (!expanded) railVisibility.setExpanded(true); }}
        onMouseEnter={() => { poke(); railVisibility.setExpanded(true); }}
        onMouseLeave={() => { railVisibility.setExpanded(false); setHoveredKey(null); }}
        className="relative flex flex-col h-full overflow-visible cursor-pointer"
        style={{
          width,
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 6,
          paddingRight: 6,
          gap: 5,
          background: 'transparent',
          borderRight: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          boxShadow: 'none',
          opacity: panelDimming ? 0 : 1,
          pointerEvents: panelVisible ? 'auto' : 'none',
          transition:
            `width ${expanded ? '.4s' : '.15s'} cubic-bezier(0.16,1,0.3,1), opacity ${panelDimming ? '5s' : '0.3s'} ease`,
        }}
      >
        {/* Scrollable nav list */}
        <div className="flex-1 overflow-y-auto thin-scroll space-y-2" onMouseLeave={() => setHoveredKey(null)}>
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