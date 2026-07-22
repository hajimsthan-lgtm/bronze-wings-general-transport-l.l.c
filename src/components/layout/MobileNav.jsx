import { NavLink } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, Truck, BarChart3, Shield, Settings } from 'lucide-react';

const navItems = [
  { to: '/', labelKey: 'dashboard', icon: LayoutDashboard },
  { to: '/trips', labelKey: 'operations', icon: Truck },
  { to: '/reports/daily', labelKey: 'reports', icon: BarChart3 },
  { to: '/admin/vehicles', labelKey: 'admin', icon: Shield },
  { to: '/settings', labelKey: 'settings', icon: Settings },
];

export default function MobileNav() {
  const { t } = useI18n();
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 px-4 flex items-center justify-around"
      style={{
        background: 'linear-gradient(0deg, rgba(8,11,18,0.95) 0%, rgba(8,11,18,0.85) 100%)',
        backdropFilter: 'blur(20px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.1)',
        borderTop: '1px solid rgba(59,130,246,0.08)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200 ${isActive ? 'text-blue-400' : 'text-white/30'}`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}