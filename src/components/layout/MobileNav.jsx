import { useTabHistory } from '@/lib/TabHistoryContext';
import { useI18n } from '@/lib/i18n';
import { LayoutDashboard, Truck, DollarSign, BarChart3, Shield, Settings } from 'lucide-react';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard },
  { key: 'operations', icon: Truck },
  { key: 'financials', icon: DollarSign },
  { key: 'reports', icon: BarChart3 },
  { key: 'admin', icon: Shield },
  { key: 'settings', icon: Settings },
];

export default function MobileNav() {
  const { t } = useI18n();
  const { activeTab, switchTab } = useTabHistory();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] pt-2">
      <div className="flex items-center justify-center gap-2.5 px-4">
        {navItems.map(item => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => switchTab(item.key)}
              className={`flex items-center justify-center h-14 w-14 rounded-full transition-all duration-200 ${
                active
                  ? 'glass-panel text-primary glow-primary'
                  : 'glass-panel text-muted-foreground hover:text-foreground'
              }`}
              aria-label={t(item.key)}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}