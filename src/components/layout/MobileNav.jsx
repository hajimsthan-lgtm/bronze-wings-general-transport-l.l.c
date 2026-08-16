import { useTabHistory } from '@/lib/TabHistoryContext';
import { LayoutDashboard, Truck, Wallet, BarChart3, Shield } from 'lucide-react';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Home', color: 'rgb(var(--panel-accent-rgb))' },
  { key: 'operations', icon: Truck, label: 'Trips', color: '#fb923c' },
  { key: 'accounts', icon: Wallet, label: 'Accounts', color: '#fbbf24' },
  { key: 'reports', icon: BarChart3, label: 'Reports', color: '#34d399' },
  { key: 'admin', icon: Shield, label: 'Admin', color: '#c084fc' },
];

export default function MobileNav() {
  const { activeTab, switchTab } = useTabHistory();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="relative flex items-stretch justify-around px-1.5 pt-2 pb-2"
        style={{
          background: 'linear-gradient(180deg, var(--header-tint-1) 0%, var(--header-tint-2) 100%)',
          backdropFilter: 'blur(20px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
          borderTop: '1px solid var(--mobile-surface-ring, rgba(255,255,255,0.10))',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.25)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(var(--panel-accent-rgb),0.18) 50%, transparent)' }} />

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => switchTab(item.key)}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-1 transition-all active:scale-90"
              aria-label={item.label}
            >
              <div
                className="relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-200"
                style={active ? { background: `${item.color}1A` } : {}}
              >
                {active && (
                  <span
                    className="absolute inset-x-0 -bottom-0.5 mx-auto w-1 h-1 rounded-full"
                    style={{ background: item.color }}
                  />
                )}
                <Icon
                  className="w-[22px] h-[22px] transition-colors duration-200"
                  style={{ color: active ? item.color : 'var(--nav-inactive)' }}
                  strokeWidth={active ? 2.4 : 2}
                />
              </div>
              <span
                className="text-[10px] font-medium leading-none transition-colors duration-200"
                style={{ color: active ? item.color : 'var(--nav-inactive)' }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}