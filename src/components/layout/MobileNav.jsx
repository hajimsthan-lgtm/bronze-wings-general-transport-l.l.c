import { useTabHistory } from '@/lib/TabHistoryContext';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, Truck, BarChart3, Shield, Bot, Wallet } from 'lucide-react';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, color: '#60a5fa' },
  { key: 'operations', icon: Truck, color: '#fb923c' },
  { key: 'accounts', icon: Wallet, color: '#fbbf24' },
  { key: 'reports', icon: BarChart3, color: '#34d399' },
  { key: 'admin', icon: Shield, color: '#c084fc' },
  { key: 'agents', icon: Bot, color: '#22d3ee' },
];

export default function MobileNav() {
  const { t } = useI18n();
  const { activeTab, switchTab } = useTabHistory();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 px-3">
      <div
        className="relative rounded-full flex items-center justify-between gap-0.5 px-1.5 py-1.5 max-w-md mx-auto"
        style={{
          background: 'linear-gradient(180deg, var(--header-tint-1) 0%, var(--header-tint-2) 100%)',
          backdropFilter: 'blur(16px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 -6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent)' }} />
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => switchTab(item.key)}
              className="relative flex items-center justify-center h-11 w-11 rounded-full transition-all duration-200"
              aria-label={t(item.key)}
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ background: `${item.color}22`, border: `1px solid ${item.color}55`, boxShadow: `0 0 14px -2px ${item.color}66` }}
                />
              )}
              <Icon
                className="relative w-5 h-5 transition-colors duration-200"
                style={{ color: active ? item.color : 'var(--nav-inactive)' }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}