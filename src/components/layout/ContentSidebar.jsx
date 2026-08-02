import { useLocation, useNavigate } from 'react-router-dom';
import { useTabHistory } from '@/lib/TabHistoryContext';
import { useI18n } from '@/lib/i18n';
import {
  Home, Truck, BarChart3, Users, Bot, ChevronsRight, ChevronsLeft,
  Route, Receipt, ClipboardList, TrendingUp, FileText, Landmark, Building2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import QuickFanMenu from '@/components/layout/QuickFanMenu';
import { useRailVisible, useRailExpanded, railVisibility } from '@/lib/railVisibility';

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

const COLLAPSED_W = 64;
const EXPANDED_W = 244;
const VANISH_MS = 15000;

/* ── Lightning glass tile — small, refined, electric animated edge ── */
function NavTile({ item, active, lit, size = 34 }) {
  return (
    <span
      className={`nav-edge relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-active:scale-95 ${lit ? 'nav-edge-on' : ''}`}
      style={{
        '--tile-glow': `rgb(${item.glow})`,
        width: size,
        height: size,
        borderRadius: 11,
        background: `linear-gradient(150deg, ${item.from} 0%, ${item.to} 100%)`,
        border: `1px solid rgba(${item.glow},${lit ? 0.8 : 0.55})`,
        boxShadow: lit
          ? `inset 0 1.5px 1px rgba(255,255,255,0.6), inset 0 -3px 5px rgba(0,0,0,0.32), 0 8px 22px rgba(${item.glow},0.55), 0 0 0 1px rgba(${item.glow},0.45), 0 0 24px -2px rgba(${item.glow},0.75), 0 0 44px -2px rgba(${item.glow},0.5)`
          : `inset 0 1.5px 1px rgba(255,255,255,0.42), inset 0 -3px 5px rgba(0,0,0,0.28), 0 4px 10px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.05), 0 0 14px -6px rgba(${item.glow},0.3)`,
        color: '#fff',
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-[3px] top-[2px] h-1/2 rounded-t-[9px]"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.40), transparent)' }}
      />
      <span
        className="pointer-events-none absolute inset-0 rounded-[11px] transition-opacity duration-500"
        style={{ opacity: lit ? 1 : 0, boxShadow: `0 0 26px 3px rgba(${item.glow},0.6), 0 0 48px 6px rgba(${item.glow},0.3)` }}
      />
      <item.icon className="relative w-4 h-4" style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.45))' }} />
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[11px]">
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
  const navigate = useNavigate();
  const { switchTab } = useTabHistory();
  const panelVisible = useRailVisible();
  const expanded = useRailExpanded();
  const [pinned, setPinned] = useState(false);
  const [hoveredKey, setHoveredKey] = useState(null);
  const vanishTimer = useRef(null);
  const panelVisibleRef = useRef(panelVisible);
  panelVisibleRef.current = panelVisible;
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  const isActive = (item) =>
    (item.paths || []).some((p) => (p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)));

  const isChildActive = (child) =>
    location.pathname === child.path || location.pathname.startsWith(child.path + '/');

  /* ── reveal: expand the rail (labels + sub-routes) and dim the page ── */
  const revealPanel = () => {
    clearTimeout(vanishTimer.current);
    railVisibility.set(true);
    if (!pinnedRef.current) railVisibility.setExpanded(true);
  };

  /* ── leave: collapse everything immediately (unless pinned) ── */
  const scheduleVanish = () => {
    clearTimeout(vanishTimer.current);
    setHoveredKey(null);
    if (pinnedRef.current) return; /* only an explicit pin holds the rail open */
    railVisibility.setExpanded(false);
    railVisibility.set(false); /* vanish immediately — no idle timer */
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!panelVisibleRef.current && e.clientX < 18) revealPanel();
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      clearTimeout(vanishTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            if (!pinnedRef.current) {
              railVisibility.setExpanded(false);
              railVisibility.set(false);
            }
          }}
          onMouseEnter={() => setHoveredKey(item.key)}
          className={`group relative flex items-center ${expanded ? 'gap-2.5 w-full px-2 h-11' : 'justify-center w-11 h-11 mx-auto'} rounded-2xl transition-all duration-300`}
          style={
            expanded
              ? {
                  background: 'transparent',
                  border: '1px solid transparent',
                  boxShadow: 'none',
                }
              : {}
          }
        >
          <NavTile item={item} active={active} lit={lit} />

          {expanded && (
            <span
              className={`relative text-[11px] font-mono tracking-[0.1em] uppercase whitespace-nowrap px-2 py-0.5 rounded-md ${active ? 'font-bold' : 'font-medium'}`}
              style={{
                color: active ? '#fff' : 'rgba(255,255,255,0.92)',
                background: active
                  ? `linear-gradient(135deg, rgba(${item.glow},0.22), rgba(${item.glow},0.08))`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? `rgba(${item.glow},0.45)` : 'rgba(255,255,255,0.08)'}`,
                boxShadow: active
                  ? `0 0 18px -2px rgba(${item.glow},0.7), 0 0 36px -6px rgba(${item.glow},0.5), inset 0 1px 0 rgba(255,255,255,0.12)`
                  : `0 0 14px -4px rgba(${item.glow},0.4), inset 0 1px 0 rgba(255,255,255,0.06)`,
                textShadow: active ? `0 0 10px rgba(${item.glow},0.9), 0 0 20px rgba(${item.glow},0.5)` : 'none',
              }}
            >
              {label}
            </span>
          )}

          {/* active indicator bar */}
          {active && (
            <span
              className={`absolute top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full ${expanded ? 'left-0' : '-left-[6px]'}`}
              style={{ background: item.from, boxShadow: `0 0 10px rgba(${item.glow},0.9)` }}
            />
          )}
        </button>

        {/* ── Sub-routes — same lightning-glass tile style, smaller ── */}
        {showChildren && (
          <div className="space-y-0.5 pl-3 pr-1" style={{ animation: 'fade-in 0.25s ease both' }}>
            {item.children.map((child) => {
              const childActive = isChildActive(child);
              const childLabel = child.label || t(child.key);
              return (
                <button
                  key={child.key}
                  onClick={() => navigate(child.path)}
                  className="group relative flex items-center gap-2 w-full pl-2 pr-2.5 h-9 rounded-xl transition-all duration-300 hover:translate-x-1"
                  style={{
                    background: 'transparent',
                    border: '1px solid transparent',
                    boxShadow: 'none',
                  }}
                >
                  <NavTile item={child} active={childActive} lit={childActive} size={26} />
                  <span
                    className="relative text-[10px] font-mono font-medium tracking-[0.1em] uppercase whitespace-nowrap px-1.5 py-0.5 rounded-md"
                    style={{
                      color: childActive ? '#fff' : 'rgba(255,255,255,0.92)',
                      background: childActive
                        ? `linear-gradient(135deg, rgba(${child.glow},0.22), rgba(${child.glow},0.08))`
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${childActive ? `rgba(${child.glow},0.45)` : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: childActive
                        ? `0 0 16px -2px rgba(${child.glow},0.7), 0 0 32px -6px rgba(${child.glow},0.5), inset 0 1px 0 rgba(255,255,255,0.12)`
                        : `0 0 12px -4px rgba(${child.glow},0.4), inset 0 1px 0 rgba(255,255,255,0.06)`,
                      textShadow: childActive ? `0 0 10px rgba(${child.glow},0.9), 0 0 20px rgba(${child.glow},0.5)` : 'none',
                    }}
                  >
                    {childLabel}
                  </span>
                  {childActive && (
                    <span
                      className="absolute top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full left-0"
                      style={{ background: child.from, boxShadow: `0 0 10px rgba(${child.glow},0.9)` }}
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
      {/* invisible edge strip — always hoverable so a vanished rail can be recalled */}
      <div className="absolute left-0 top-0 w-2 h-full z-[56]" onMouseEnter={revealPanel} />

      <aside
        onMouseEnter={revealPanel}
        onMouseLeave={scheduleVanish}
        className="relative flex flex-col h-full overflow-visible"
        style={{
          width,
          paddingTop: 16,
          paddingBottom: 14,
          paddingLeft: 8,
          paddingRight: 8,
          gap: 6,
          background: 'transparent',
          borderRight: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          boxShadow: 'none',
          opacity: panelVisible ? 1 : 0,
          transform: panelVisible ? 'translateX(0)' : 'translateX(-18px)',
          pointerEvents: panelVisible ? 'auto' : 'none',
          transition:
            `width ${expanded ? '.45s' : '.15s'} cubic-bezier(0.16,1,0.3,1), opacity .55s cubic-bezier(0.16,1,0.3,1), transform .55s cubic-bezier(0.16,1,0.3,1), background .3s ease, backdrop-filter .3s ease, box-shadow .3s ease`,
        }}
      >
        {/* Pin toggle — keeps the rail expanded */}
        <button
          onClick={() => {
            const next = !pinned;
            setPinned(next);
            if (next) {
              railVisibility.setExpanded(true);
              railVisibility.set(true);
            } else {
              railVisibility.setExpanded(false);
            }
          }}
          title={pinned ? 'Unpin — collapse on leave' : 'Pin open — keep expanded'}
          className="group relative flex items-center justify-center w-10 h-10 rounded-xl mx-auto mb-1 text-white/60 hover:text-white transition-all duration-200"
          style={{
            background: pinned ? 'rgba(var(--panel-accent-rgb),0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${pinned ? 'rgba(var(--panel-accent-rgb),0.35)' : 'rgba(255,255,255,0.07)'}`,
          }}
        >
          {pinned ? <ChevronsLeft className="w-4 h-4 shrink-0" /> : <ChevronsRight className="w-4 h-4 shrink-0" />}
        </button>

        {/* Scrollable nav list */}
        <div className="flex-1 overflow-y-auto thin-scroll space-y-1.5" onMouseLeave={() => setHoveredKey(null)}>
          {navItems.map(renderItem)}
        </div>

        {/* Quick-tools fan launcher — pinned to the bottom, unchanged */}
        <div className="pt-3">
          <QuickFanMenu />
        </div>
      </aside>
    </div>
  );
}