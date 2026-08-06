import { useLocation, useNavigate } from 'react-router-dom';
import { useTabHistory } from '@/lib/TabHistoryContext';
import { useI18n } from '@/lib/i18n';
import {
  Truck, ChartColumn, UsersRound,
  Route, Receipt, ClipboardList, TrendingUp, FileText, Landmark, Building2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { useRailVisible, useRailDimming, useRailExpanded, railVisibility } from '@/lib/railVisibility';

/* Each nav item carries its own duotone gradient, glow color, and sub-routes. */
const navItems = [
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
];

const COLLAPSED_W = 64;
const EXPANDED_W = 244;

export default function ContentSidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const { switchTab } = useTabHistory();
  const expanded = useRailExpanded();
  const panelVisible = useRailVisible();
  const panelDimming = useRailDimming();
  const [hoveredKey, setHoveredKey] = useState(null);
  const [hoveredChild, setHoveredChild] = useState(null);
  const dimTimer = useRef(null);
  const vanishTimer = useRef(null);
  const collapseTimer = useRef(null);
  const asideRef = useRef(null);

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

  useEffect(() => {
    const handleClick = (e) => {
      if (asideRef.current && !asideRef.current.contains(e.target)) {
        clearTimeout(collapseTimer.current);
        railVisibility.setExpanded(false);
        setHoveredKey(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const width = expanded ? EXPANDED_W : COLLAPSED_W;

  /* ── Parent floating glass dock ── */
  const renderItem = (item) => {
    const active = isActive(item);
    const label = t(item.key) || item.label;
    const hasChildren = !!item.children?.length;
    const showChildren = expanded && hasChildren && hoveredKey === item.key;
    const dimmed = expanded && hoveredKey !== null && hoveredKey !== item.key;
    const lit = active || hoveredKey === item.key;

    return (
      <div
        key={item.key}
        className={`relative transition-opacity duration-300 flex flex-col ${expanded ? 'items-start' : 'items-center'}`}
        style={{ opacity: dimmed ? 0.12 : 1 }}
      >
        <div className={`flex items-center ${expanded ? 'gap-2' : ''}`}>
          <button
            onClick={() => {
              poke();
              if (hasChildren) navigate(item.children[0].path);
              else switchTab(item.key);
            }}
            onMouseEnter={() => { poke(); setHoveredKey(item.key); }}
            aria-label={label}
            className="group relative inline-flex items-center justify-center rounded-full transition-all duration-500 select-none"
            style={{
              height: 38,
              width: 38,
              padding: 0,
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            {/* icon bubble — sits on the spine */}
            <span
              className={`nav-orb ${lit ? 'nav-orb-lit' : ''} relative flex items-center justify-center shrink-0 rounded-full pointer-events-none transition-all duration-300`}
              style={{
                '--orb-glow': item.glow,
                '--orb-glow2': item.glow,
                width: 38, height: 38,
                border: `1px solid rgba(${item.glow},${lit ? 0.55 : 0.18})`,
                boxShadow: lit
                  ? `0 0 16px rgba(${item.glow},0.45), 0 4px 16px rgba(${item.glow},0.28)`
                  : `0 2px 8px rgba(0,0,0,0.3)`,
              }}
            >
              <item.icon
                strokeWidth={1.5}
                style={{
                  width: expanded ? 14 : 16, height: expanded ? 14 : 16,
                  color: lit ? '#fff' : `rgba(${item.glow},0.92)`,
                  filter: lit ? `drop-shadow(0 0 5px rgba(${item.glow},0.65))` : 'none',
                }}
              />
            </span>

            {/* floating label bubble — collapsed only */}
            {!expanded && (
              <span className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 z-50">
                <span
                  className="inline-block whitespace-nowrap px-3 py-1.5 rounded-xl text-[12px] font-semibold tracking-wide"
                  style={{
                    background: 'linear-gradient(135deg, rgba(10,14,26,0.94), rgba(20,26,44,0.86))',
                    backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    border: `1px solid rgba(${item.glow},0.30)`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 22px rgba(0,0,0,0.5), 0 0 18px -6px rgba(${item.glow},0.5)`,
                    color: '#fff',
                  }}
                >
                  {label}
                </span>
              </span>
            )}
          </button>

          {/* text bubble — separate pill, expanded only */}
          {expanded && (
            <button
              onClick={() => {
                poke();
                if (hasChildren) navigate(item.children[0].path);
                else switchTab(item.key);
              }}
              onMouseEnter={() => { poke(); setHoveredKey(item.key); }}
              aria-label={label}
              className="text-[11px] font-semibold tracking-[0.07em] uppercase whitespace-nowrap rounded-full transition-all duration-300 cursor-pointer"
              style={{
                padding: '0 12px',
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                color: lit ? '#fff' : 'rgba(255,255,255,0.72)',
                background: lit
                  ? `linear-gradient(135deg, rgba(${item.glow},0.28), rgba(${item.glow},0.12))`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid rgba(${item.glow},${lit ? 0.50 : 0.14})`,
                boxShadow: lit
                  ? `inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 16px rgba(${item.glow},0.28)`
                  : 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              {label}
            </button>
          )}
        </div>

        {/* ── Child docks — nested text pills on a branch connector ── */}
        {showChildren && (
          <div className="relative mt-2 space-y-2" style={{ animation: 'fade-in 0.25s ease both', paddingLeft: 26 }}>
            {/* branch connector from spine to children */}
            <span
              className="absolute left-[19px] top-0 bottom-0 w-px pointer-events-none"
              style={{ background: `linear-gradient(180deg, rgba(${item.glow},0.45), rgba(${item.glow},0.12))` }}
            />
            {item.children.map((child) => {
              const childActive = isChildActive(child);
              const childLabel = child.label || t(child.key);
              return (
                <button
                  key={child.key}
                  onClick={() => { poke(); navigate(child.path); }}
                  onMouseEnter={() => { poke(); setHoveredChild(child.key); }}
                  onMouseLeave={() => setHoveredChild(null)}
                  aria-label={childLabel}
                  className="group relative flex items-center rounded-full transition-all duration-500 select-none"
                  style={{
                    height: 34,
                    padding: '0 16px',
                    gap: 8,
                    background: (childActive || hoveredChild === child.key)
                      ? `linear-gradient(135deg, rgba(${child.glow},0.20), rgba(${child.glow},0.07))`
                      : 'rgba(19,28,42,0.82)',
                    border: `1px solid ${(childActive || hoveredChild === child.key) ? `rgba(${child.glow},0.42)` : 'rgba(255,255,255,0.07)'}`,
                    boxShadow: (childActive || hoveredChild === child.key)
                      ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 3px 12px rgba(${child.glow},0.26)`
                      : 'inset 0 1px 0 rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                  }}
                >
                  {/* small node dot on the branch line */}
                  <span
                    className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
                    style={{
                      background: (childActive || hoveredChild === child.key) ? `rgb(${child.glow})` : 'rgba(170,184,200,0.4)',
                      boxShadow: (childActive || hoveredChild === child.key) ? `0 0 6px rgba(${child.glow},0.8)` : 'none',
                    }}
                  />
                  <span
                    className="text-[10px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap pointer-events-none"
                    style={{ color: (childActive || hoveredChild === child.key) ? '#fff' : 'rgba(255,255,255,0.62)' }}
                  >
                    {childLabel}
                  </span>
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
      <aside
        ref={asideRef}
        onMouseEnter={() => { poke(); clearTimeout(collapseTimer.current); railVisibility.setExpanded(true); }}
        onMouseLeave={() => { clearTimeout(collapseTimer.current); collapseTimer.current = setTimeout(() => { railVisibility.setExpanded(false); setHoveredKey(null); }, 1000); }}
        className="relative flex flex-col h-full"
        style={{
          width,
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 8,
          paddingRight: 8,
          gap: 14,
          background: 'transparent',
          borderRight: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          boxShadow: 'none',
          overflow: 'visible',
          opacity: panelDimming ? 0 : 1,
          pointerEvents: panelVisible ? 'auto' : 'none',
          transition:
            `width ${expanded ? '.6s' : '.25s'} cubic-bezier(0.16,1,0.3,1), opacity ${panelDimming ? '5s' : '0.3s'} ease`,
        }}
      >
        {/* vertical spine connector — runs through all dock nodes */}
        <span
          className="absolute pointer-events-none top-8 bottom-8 w-px"
          style={{
            left: expanded ? 37 : 27,
            background: 'linear-gradient(180deg, transparent 0%, rgba(170,184,200,0.22) 8%, rgba(170,184,200,0.22) 92%, transparent 100%)',
          }}
        />

        {/* Scrollable dock list */}
        <div className="relative flex-1 overflow-y-auto thin-scroll space-y-5" onMouseLeave={() => setHoveredKey(null)}>
          {navItems.map(renderItem)}
        </div>
      </aside>
    </div>
  );
}