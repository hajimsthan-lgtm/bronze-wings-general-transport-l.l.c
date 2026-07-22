import { NavLink } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, Truck, BarChart3, Shield } from 'lucide-react';

const navItems = [
  { to: '/', labelKey: 'dashboard', icon: LayoutDashboard },
  { to: '/trips', labelKey: 'operations', icon: Truck },
  { to: '/reports/daily', labelKey: 'reports', icon: BarChart3 },
  { to: '/admin/vehicles', labelKey: 'admin', icon: Shield },
];

export default function DesktopNav() {
  const { t } = useI18n();
  return (
    <nav
      className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col z-40 pt-20 pb-6 px-3"
      style={{
        background: 'linear-gradient(180deg, rgba(8,11,18,0.92) 0%, rgba(6,8,15,0.88) 100%)',
        backdropFilter: 'blur(24px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.1)',
        borderRight: '1px solid rgba(59,130,246,0.08)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.3), inset -1px 0 0 rgba(255,255,255,0.02)',
      }}
    >
      {/* Nav items */}
      <div className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? 'text-blue-400 bg-blue-500/10 border-blue-500/15'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03] border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-blue-400' : 'text-white/40'}`} />
                <span>{t(item.labelKey)}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Bottom section */}
      <div className="mt-auto">
        <div
          className="p-4 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(37,99,235,0.03))',
            border: '1px solid rgba(59,130,246,0.08)',
          }}
        >
          <p className="text-xs text-white/30 mb-1">Plan</p>
          <p className="text-sm font-semibold text-white/70">Builder</p>
          <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full w-3/4 rounded-full bg-blue-500/40" />
          </div>
        </div>
      </div>
    </nav>
  );
}