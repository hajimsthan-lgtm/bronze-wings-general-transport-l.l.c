import { Link, useLocation } from 'react-router-dom';
import { useTabHistory } from '@/lib/TabHistoryContext';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, Truck, BarChart3, Shield, Bot, Settings } from 'lucide-react';

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

  const isActive = (item) =>
    (item.paths || [item.path]).some((p) =>
      p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
    );

  return (
    <aside
      className="hidden md:flex md:w-[244px] md:flex-shrink-0 md:sticky md:top-[8.75rem] md:self-start flex-col gap-1 rounded-2xl p-3 max-h-[calc(100dvh-10rem)]"
      style={{
        background: 'linear-gradient(180deg, rgba(var(--surf-1-rgb),0.72) 0%, rgba(var(--surf-2-rgb),0.86) 100%)',
        backdropFilter: 'blur(20px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
        border: '1px solid rgba(var(--panel-accent-rgb),0.12)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 40px rgba(var(--panel-accent-rgb),0.03), 0 12px 32px rgba(0,0,0,0.35)',
      }}
    >
      {/* top specular highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14) 50%, transparent)' }} />

      <div className="px-2 pt-1 pb-2">
        <span className="eyebrow">Navigation</span>
      </div>

      {navItems.map((item) => {
        const active = isActive(item);
        return (
          <button
            key={item.key}
            onClick={() => switchTab(item.key)}
            className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              active ? 'text-white' : 'text-white/55 hover:text-white hover:bg-white/[0.04]'
            }`}
            style={
              active
                ? {
                    background: 'linear-gradient(135deg, rgba(var(--panel-accent-rgb),0.22), rgba(var(--panel-accent-rgb),0.10))',
                    border: '1px solid rgba(var(--panel-accent-rgb),0.30)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 18px -6px rgba(var(--panel-accent-rgb),0.45)',
                  }
                : { border: '1px solid transparent' }
            }
          >
            <item.icon className="w-4 h-4 shrink-0" style={active ? { color: 'rgb(var(--panel-accent2-rgb))' } : undefined} />
            <span className="tracking-wide">{t(item.key)}</span>
          </button>
        );
      })}

      <div className="mt-3 mb-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="px-2 py-1">
        <span className="eyebrow">Recents</span>
      </div>

      <div className="mt-auto pt-3">
        <Link
          to="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/55 hover:text-white hover:bg-white/[0.04] transition-all border border-transparent"
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="tracking-wide">Settings</span>
        </Link>
      </div>
    </aside>
  );
}