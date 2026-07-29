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

function IconTile({ item, active }) {
  return (
    <span
      className="relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
      style={{
        width: 42,
        height: 42,
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

/* Floating lightning-shimmer name label — appears to the right of an icon.
   Shines via the reusable brand-shine animation + per-item gradient. */
function ShimmerLabel({ label, glow }) {
  return (
    <span className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 animate-slide-in-right">
      <span
        className="relative inline-block whitespace-nowrap px-3 py-1.5 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(10,14,26,0.82), rgba(20,26,44,0.70))',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 22px rgba(0,0,0,0.45), 0 0 18px -6px rgba(${glow},0.45)`,
        }}
      >
        <span
          className="brand-shine text-[12px] font-semibold tracking-wide"
          style={{
            backgroundImage: `linear-gradient(100deg, #ffffff 0%, rgb(${glow}) 45%, #ffffff 100%)`,
            filter: `drop-shadow(0 0 6px rgba(${glow},0.55))`,
          }}
        >
          {label}
        </span>
      </span>
    </span>
  );
}

export default function ContentSidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const { switchTab } = useTabHistory();
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [hoveredKey, setHoveredKey] = useState(null);

  const isActive = (item) =>
    (item.paths || []).some((p) => (p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)));

  const renderItem = (item) => {
    const active = isActive(item);
    const label = t(item.key) || item.label;
    const show = showAllLabels || hoveredKey === item.key;
    return (
      <button
        key={item.key}
        onClick={() => switchTab(item.key)}
        onMouseEnter={() => setHoveredKey(item.key)}
        onMouseLeave={() => setHoveredKey(null)}
        className="group relative flex items-center justify-center w-12 h-12 mx-auto rounded-2xl transition-all duration-300"
      >
        <IconTile item={item} active={active} />
        {active && (
          <span
            className="absolute -left-[6px] top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-full"
            style={{ background: item.from, boxShadow: `0 0 10px rgba(${item.glow},0.9)` }}
          />
        )}
        {active && (
          <span
            className="pointer-events-none absolute inset-0 rounded-2xl -z-10"
            style={{ background: `radial-gradient(120% 100% at 12% 50%, rgba(${item.glow},0.16), transparent 70%)` }}
          />
        )}
        {show && <ShimmerLabel label={label} glow={item.glow} />}
      </button>
    );
  };

  return (
    <div className="hidden md:block fixed left-0 top-0 z-[55] h-[100dvh]">
      <aside
        className="relative flex flex-col h-full overflow-visible"
        style={{
          width: 60,
          paddingTop: 16,
          paddingBottom: 14,
          paddingLeft: 8,
          paddingRight: 8,
          gap: 10,
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
        }}
      >
        {/* Menu button — toggles all icon names open / closed simultaneously */}
        <button
          onClick={() => setShowAllLabels((s) => !s)}
          title={showAllLabels ? 'Hide all names' : 'Show all names'}
          className="group relative flex items-center justify-center w-10 h-10 rounded-xl mx-auto mb-1 text-white/60 hover:text-white transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {showAllLabels ? <ChevronsLeft className="w-4 h-4 shrink-0" /> : <ChevronsRight className="w-4 h-4 shrink-0" />}
        </button>

        {navItems.map(renderItem)}

        <div className="mt-auto pt-3">
          <Link
            to="/settings"
            onMouseEnter={() => setHoveredKey('settings')}
            onMouseLeave={() => setHoveredKey(null)}
            className="group relative flex items-center justify-center w-12 h-12 mx-auto rounded-2xl transition-all duration-300"
          >
            <IconTile
              item={{ icon: Settings, from: '#64748b', to: '#334155', glow: '100,116,139' }}
              active={location.pathname.startsWith('/settings')}
            />
            {(showAllLabels || hoveredKey === 'settings') && <ShimmerLabel label="Settings" glow="100,116,139" />}
          </Link>
        </div>
      </aside>
    </div>
  );
}