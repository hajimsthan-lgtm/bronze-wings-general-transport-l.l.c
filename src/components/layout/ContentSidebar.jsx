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

/* ── Icon tile — the gradient glass square shared by collapsed & expanded ── */
function IconTile({ item, active, size = 40 }) {
  return (
    <span
      className="relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: `linear-gradient(150deg, ${item.from} 0%, ${item.to} 100%)`,
        border: `1px solid rgba(${item.glow},0.55)`,
        boxShadow: active
          ? `inset 0 1.5px 1px rgba(255,255,255,0.55), inset 0 -3px 5px rgba(0,0,0,0.32), 0 6px 16px rgba(${item.glow},0.45), 0 0 0 1px rgba(${item.glow},0.35), 0 0 18px -4px rgba(${item.glow},0.6), 0 0 32px -2px rgba(${item.glow},0.4)`
          : `inset 0 1.5px 1px rgba(255,255,255,0.42), inset 0 -3px 5px rgba(0,0,0,0.28), 0 4px 10px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.05), 0 0 14px -6px rgba(${item.glow},0.3)`,
        color: '#fff',
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-[3px] top-[2px] h-1/2 rounded-t-[10px]"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.40), transparent)' }}
      />
      <span
        className="pointer-events-none absolute inset-0 rounded-[12px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `0 0 22px 2px rgba(${item.glow},0.55), 0 0 40px 4px rgba(${item.glow},0.25)` }}
      />
      <item.icon className="relative w-[17px] h-[17px]" style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.45))' }} />
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[12px]">
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
  const [clickedOpen, setClickedOpen] = useState(null);
  const vanishTimer = useRef(null);
  const panelVisibleRef = useRef(panelVisible);
  panelVisibleRef.current = panelVisible;
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  const isActive = (item) =>
    (item.paths || []).some((p) => (p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)));

  const isChildActive = (child) =>
    location.pathname === child.path || location.pathname.startsWith(child.path + '/');

  /* ── reveal: show rail + widen it ── */
  const revealPanel = () => {
    clearTimeout(vanishTimer.current);
    railVisibility.set(true);
    railVisibility.setExpanded(true);
  };

  /* ── leave: collapse (unless pinned), then auto-vanish after idle ── */
  const scheduleVanish = () => {
    clearTimeout(vanishTimer.current);
    if (pinnedRef.current) return;
    railVisibility.setExpanded(false);
    setHoveredKey(null);
    vanishTimer.current = setTimeout(() => {
      if (!pinnedRef.current) railVisibility.set(false);
    }, VANISH_MS);
  };

  useEffect(() => {
    scheduleVanish();
    const onMove = (e) => {
      if (!panelVisibleRef.current && e.clientX < 18) revealPanel();
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      clearTimeout(vanishTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinned]);

  /* ── auto-open the active parent's sub-routes on route change ── */
  useEffect(() => {
    const activeItem = navItems.find(item =>
      (item.paths || []).some(p => (p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)))
    );
    if (activeItem?.children?.length) {
      setClickedOpen(activeItem.key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const width = expanded ? EXPANDED_W : COLLAPSED_W;

  /* ── Main nav button — glass surface with icon + name when expanded ── */
  const renderItem = (item) => {
    const active = isActive(item);
    const label = t(item.key) || item.label;
    const hasChildren = !!item.children?.length;
    const showChildren =
      expanded && hasChildren && (hoveredKey === item.key || (hoveredKey === null && clickedOpen === item.key));
    const dimmed = expanded && hoveredKey !== null && hoveredKey !== item.key;

    return (
      <div
        key={item.key}
        className="space-y-1 transition-opacity duration-300"
        style={{ opacity: dimmed ? 0.38 : 1 }}
      >
        <button
          onClick={() => {
            if (hasChildren) {
              const isOpen = clickedOpen === item.key;
              setClickedOpen(isOpen ? null : item.key);
              if (!isOpen) switchTab(item.key);
            } else {
              switchTab(item.key);
            }
          }}
          onMouseEnter={() => setHoveredKey(item.key)}
          className={`group relative flex items-center ${expanded ? 'gap-3 w-full px-2.5 h-12' : 'justify-center w-12 h-12 mx-auto'} rounded-2xl transition-all duration-300`}
          style={
            expanded
              ? {
                  background: active
                    ? `linear-gradient(135deg, rgba(${item.glow},0.28), rgba(${item.glow},0.10))`
                    : `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
                  border: `1px solid ${active ? `rgba(${item.glow},0.50)` : 'rgba(255,255,255,0.10)'}`,
                  boxShadow: active
                    ? `0 0 26px -4px rgba(${item.glow},0.45), 0 0 0 1px rgba(${item.glow},0.20), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 20px rgba(${item.glow},0.08)`
                    : `0 0 18px -8px rgba(${item.glow},0.25), inset 0 1px 0 rgba(255,255,255,0.06)`,
                }
              : {}
          }
        >
          <IconTile item={item} active={active} />

          {expanded && (
            <span
              className="text-[12px] font-mono font-medium tracking-[0.08em] uppercase whitespace-nowrap"
              style={{ color: active ? '#fff' : 'rgba(255,255,255,0.68)' }}
            >
              {label}
            </span>
          )}

          {/* active indicator bar */}
          {active && (
            <span
              className={`absolute top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-full ${expanded ? 'left-0' : '-left-[6px]'}`}
              style={{ background: item.from, boxShadow: `0 0 10px rgba(${item.glow},0.9)` }}
            />
          )}
        </button>

        {/* ── Sub-routes — indented glass chips ── */}
        {showChildren && (
          <div className="space-y-0.5 pl-3 pr-1" style={{ animation: 'fade-in 0.25s ease both' }}>
            {item.children.map((child) => {
              const childActive = isChildActive(child);
              const childLabel = child.label || t(child.key);
              return (
                <button
                  key={child.key}
                  onClick={() => navigate(child.path)}
                  className="group relative flex items-center gap-2.5 w-full px-2.5 h-10 rounded-xl transition-all duration-300 hover:translate-x-1"
                  style={{
                    background: childActive
                      ? `linear-gradient(135deg, rgba(${child.glow},0.28), rgba(${child.glow},0.10))`
                      : `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
                    border: `1px solid ${childActive ? `rgba(${child.glow},0.50)` : 'rgba(255,255,255,0.10)'}`,
                    boxShadow: childActive
                      ? `0 0 26px -4px rgba(${child.glow},0.45), 0 0 0 1px rgba(${child.glow},0.20), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 0 20px rgba(${child.glow},0.08)`
                      : `0 0 18px -8px rgba(${child.glow},0.25), inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}
                >
                  <span
                    className="relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 10,
                      background: `linear-gradient(150deg, ${child.from} 0%, ${child.to} 100%)`,
                      border: `1px solid rgba(${child.glow},0.55)`,
                      boxShadow: childActive
                        ? `inset 0 1.5px 1px rgba(255,255,255,0.55), inset 0 -3px 5px rgba(0,0,0,0.32), 0 6px 16px rgba(${child.glow},0.45), 0 0 0 1px rgba(${child.glow},0.35), 0 0 18px -4px rgba(${child.glow},0.6), 0 0 32px -2px rgba(${child.glow},0.4)`
                        : `inset 0 1.5px 1px rgba(255,255,255,0.42), inset 0 -3px 5px rgba(0,0,0,0.28), 0 4px 10px rgba(0,0,0,0.38), 0 0 0 1px rgba(255,255,255,0.05), 0 0 14px -6px rgba(${child.glow},0.3)`,
                      color: '#fff',
                    }}
                  >
                    <span
                      className="pointer-events-none absolute inset-x-[3px] top-[2px] h-1/2 rounded-t-[8px]"
                      style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.40), transparent)' }}
                    />
                    <span
                      className="pointer-events-none absolute inset-0 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                      style={{ boxShadow: `0 0 22px 2px rgba(${child.glow},0.55), 0 0 40px 4px rgba(${child.glow},0.25)` }}
                    />
                    <child.icon className="relative w-3.5 h-3.5" style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.45))' }} />
                    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[10px]">
                      <span
                        className="absolute top-0 left-[-120%] h-full w-1/2 skew-x-[-20deg] opacity-0 group-hover:opacity-100 group-hover:left-[150%] transition-all duration-700"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' }}
                      />
                    </span>
                  </span>
                  <span
                    className="text-[11px] font-mono font-medium tracking-[0.08em] uppercase whitespace-nowrap"
                    style={{ color: childActive ? '#fff' : 'rgba(255,255,255,0.68)' }}
                  >
                    {childLabel}
                  </span>
                  {childActive && (
                    <span
                      className="absolute top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full left-0"
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