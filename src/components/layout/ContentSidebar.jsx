import { useLocation, useNavigate } from 'react-router-dom';
import { useTabHistory } from '@/lib/TabHistoryContext';
import { useI18n } from '@/lib/i18n';
import {
  Home, Truck, BarChart3, Users, Bot,
  Route, Receipt, ClipboardList, TrendingUp, FileText, Landmark, Building2,
  ChevronRight, X,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import QuickFanMenu from '@/components/layout/QuickFanMenu';
import { railVisibility } from '@/lib/railVisibility';

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
      { key: 'daily_report', label: 'Daily Report', path: '/reports/daily', icon: ClipboardList, from: '#06b6d4', to: '#0e7490', glow: '6,182,212' },
      { key: 'profit_loss', label: 'Profit & Loss', path: '/reports/pnl', icon: TrendingUp, from: '#8b5cf6', to: '#5b21b6', glow: '139,92,246' },
      { key: 'soa', label: 'Statement of Account', path: '/reports/soa', icon: FileText, from: '#f97316', to: '#9a3412', glow: '249,115,22' },
      { key: 'bank_reconciliation', label: 'Bank Reconciliation', path: '/reports/bank-reconciliation', icon: Landmark, from: '#0ea5e9', to: '#0369a1', glow: '14,165,233' },
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

const RAIL_W = 64;
const FLYOUT_W = 248;

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

/* ── Hover tooltip — small glass chip that appears to the right of an icon ── */
function IconTooltip({ label, glow }) {
  return (
    <span
      className="pointer-events-none absolute left-[52px] top-1/2 -translate-y-1/2 z-[60] whitespace-nowrap px-2.5 py-1 rounded-lg text-[11px] font-mono tracking-[0.08em] uppercase font-semibold"
      style={{
        color: '#fff',
        background: 'linear-gradient(165deg, rgba(30,30,40,0.92), rgba(18,18,28,0.92))',
        border: `1px solid rgba(${glow},0.35)`,
        boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 18px -6px rgba(${glow},0.5), inset 0 1px 0 rgba(255,255,255,0.08)`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        textShadow: `0 0 8px rgba(${glow},0.6)`,
      }}
    >
      {label}
    </span>
  );
}

export default function ContentSidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const { switchTab } = useTabHistory();
  const [openSection, setOpenSection] = useState(null); // which parent's flyout is open
  const [hoveredKey, setHoveredKey] = useState(null);
  const railRef = useRef(null);

  /* Rail is always visible — no auto-vanish */
  useEffect(() => {
    railVisibility.set(true);
    railVisibility.setExpanded(false);
  }, []);

  /* Close flyout on Escape */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpenSection(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* Close flyout on click outside the rail */
  useEffect(() => {
    const onClick = (e) => {
      if (railRef.current && !railRef.current.contains(e.target)) setOpenSection(null);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  /* Close flyout when route changes */
  useEffect(() => { setOpenSection(null); }, [location.pathname]);

  const isActive = (item) =>
    (item.paths || []).some((p) => (p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)));

  const isChildActive = (child) =>
    location.pathname === child.path || location.pathname.startsWith(child.path + '/');

  const handleItemClick = (item) => {
    const hasChildren = !!item.children?.length;
    if (hasChildren) {
      // toggle flyout; if this section is already open, close it
      setOpenSection((prev) => (prev === item.key ? null : item.key));
    } else {
      switchTab(item.key);
      setOpenSection(null);
    }
  };

  const openItem = navItems.find((i) => i.key === openSection && i.children?.length);

  return (
    <div ref={railRef} className="hidden md:block fixed left-0 top-0 z-[55] h-[100dvh]">
      {/* ── Persistent icon rail ── */}
      <aside
        className="relative flex flex-col h-full"
        style={{
          width: RAIL_W,
          paddingTop: 16,
          paddingBottom: 14,
          paddingLeft: 8,
          paddingRight: 8,
          gap: 6,
          background: 'transparent',
        }}
      >
        {/* Scrollable icon list */}
        <div className="flex-1 overflow-y-auto thin-scroll space-y-2 flex flex-col items-center">
          {navItems.map((item) => {
            const active = isActive(item);
            const lit = active || hoveredKey === item.key || openSection === item.key;
            const hasChildren = !!item.children?.length;
            const label = t(item.key) || item.label;
            return (
              <div
                key={item.key}
                className="relative"
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <button
                  onClick={() => handleItemClick(item)}
                  aria-label={label}
                  className="group relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300"
                  style={{ background: 'transparent', border: 'none' }}
                >
                  <NavTile item={item} active={active} lit={lit} />
                  {/* active indicator bar */}
                  {active && (
                    <span
                      className="absolute top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full -left-[6px]"
                      style={{ background: item.from, boxShadow: `0 0 10px rgba(${item.glow},0.9)` }}
                    />
                  )}
                  {/* expand cue chevron for parents */}
                  {hasChildren && openSection === item.key && (
                    <span
                      className="absolute -right-[2px] -bottom-[2px] w-3.5 h-3.5 rounded-full flex items-center justify-center"
                      style={{ background: `rgb(${item.glow})`, boxShadow: `0 0 8px rgba(${item.glow},0.8)` }}
                    >
                      <ChevronRight className="w-2 h-2 text-white" />
                    </span>
                  )}
                </button>
                {/* tooltip — only when flyout is NOT open for this item */}
                {hoveredKey === item.key && openSection !== item.key && (
                  <IconTooltip label={label} glow={item.glow} />
                )}
              </div>
            );
          })}
        </div>

        {/* Quick-tools fan launcher — pinned to the bottom */}
        <div className="pt-3 flex justify-center">
          <QuickFanMenu />
        </div>
      </aside>

      {/* ── Flyout panel — opens to the right of the rail for sub-routes ── */}
      {openItem && (
        <div
          className="absolute top-0 h-full flex flex-col"
          style={{
            left: RAIL_W,
            width: FLYOUT_W,
            paddingTop: 16,
            paddingBottom: 14,
            paddingLeft: 10,
            paddingRight: 10,
            gap: 8,
            background: 'linear-gradient(165deg, rgba(28,28,38,0.82) 0%, rgba(16,16,24,0.90) 100%)',
            borderLeft: `1px solid rgba(${openItem.glow},0.18)`,
            borderRight: `1px solid rgba(255,255,255,0.06)`,
            boxShadow: `0 0 0 1px rgba(${openItem.glow},0.08), 0 20px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)`,
            backdropFilter: 'blur(28px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.3)',
            animation: 'slide-in-right 0.22s cubic-bezier(0.16,1,0.3,1) both',
            zIndex: 54,
          }}
        >
          {/* Section header */}
          <div className="flex items-center gap-2.5 px-1 pb-2 mb-1" style={{ borderBottom: `1px solid rgba(${openItem.glow},0.15)` }}>
            <NavTile item={openItem} active={true} lit={true} size={30} />
            <span
              className="text-[12px] font-mono font-bold tracking-[0.12em] uppercase whitespace-nowrap"
              style={{ color: '#fff', textShadow: `0 0 12px rgba(${openItem.glow},0.8)` }}
            >
              {t(openItem.key) || openItem.label}
            </span>
            <button
              onClick={() => setOpenSection(null)}
              className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sub-route list */}
          <div className="flex-1 overflow-y-auto thin-scroll space-y-1">
            {openItem.children.map((child) => {
              const childActive = isChildActive(child);
              const childLabel = child.label || t(child.key);
              return (
                <button
                  key={child.key}
                  onClick={() => { navigate(child.path); setOpenSection(null); }}
                  className="group relative flex items-center gap-2.5 w-full pl-2.5 pr-3 h-11 rounded-xl transition-all duration-300 hover:translate-x-1"
                  style={{
                    background: childActive
                      ? `linear-gradient(135deg, rgba(${child.glow},0.22), rgba(${child.glow},0.08))`
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${childActive ? `rgba(${child.glow},0.45)` : 'rgba(255,255,255,0.07)'}`,
                    boxShadow: childActive
                      ? `0 0 18px -2px rgba(${child.glow},0.6), 0 0 36px -6px rgba(${child.glow},0.4), inset 0 1px 0 rgba(255,255,255,0.10)`
                      : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <NavTile item={child} active={childActive} lit={childActive} size={28} />
                  <span
                    className="text-[11px] font-mono font-medium tracking-[0.08em] uppercase whitespace-nowrap"
                    style={{
                      color: childActive ? '#fff' : 'rgba(255,255,255,0.88)',
                      textShadow: childActive ? `0 0 10px rgba(${child.glow},0.8)` : 'none',
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
        </div>
      )}
    </div>
  );
}