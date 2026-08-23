import { useTabHistory } from '@/lib/TabHistoryContext';
import { LayoutDashboard, Truck, Wallet, BarChart3, Shield } from 'lucide-react';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, label: 'Home', color: '#6366f1', glow: '99, 102, 241' },
  { key: 'operations', icon: Truck, label: 'Trips', color: '#fb923c', glow: '251, 146, 60' },
  { key: 'accounts', icon: Wallet, label: 'Accounts', color: '#fbbf24', glow: '251, 191, 36' },
  { key: 'reports', icon: BarChart3, label: 'Reports', color: '#34d399', glow: '52, 211, 153' },
  { key: 'admin', icon: Shield, label: 'Admin', color: '#c084fc', glow: '192, 132, 252' },
];

export default function MobileNav() {
  const { activeTab, switchTab } = useTabHistory();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="relative flex items-stretch justify-around px-2 pt-2.5 pb-2"
        style={{
          background: 'linear-gradient(180deg, rgba(15,15,25,0.82) 0%, rgba(8,8,16,0.92) 100%)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.35)',
        }}
      >
        {/* Top gradient hairline */}
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.30) 30%, rgba(168,85,247,0.25) 70%, transparent)' }} />

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
                className="relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-300"
                style={active ? {
                  background: `linear-gradient(135deg, rgba(${item.glow},0.25), rgba(${item.glow},0.08))`,
                  border: `1px solid rgba(${item.glow},0.40)`,
                  boxShadow: `0 0 18px -2px rgba(${item.glow},0.45), inset 0 1px 0 rgba(255,255,255,0.12)`,
                } : {}}
              >
                {active && (
                  <span
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
                  />
                )}
                <Icon
                  className="w-[22px] h-[22px] transition-all duration-300"
                  style={{
                    color: active ? item.color : 'rgba(160,160,180,0.5)',
                    filter: active ? `drop-shadow(0 0 6px rgba(${item.glow},0.6))` : 'none',
                  }}
                  strokeWidth={active ? 2.4 : 2}
                />
              </div>
              <span
                className="text-[10px] font-semibold leading-none transition-colors duration-200"
                style={{ color: active ? item.color : 'rgba(160,160,180,0.5)' }}
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