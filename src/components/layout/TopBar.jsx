import { useLocation, Link } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Globe } from 'lucide-react';

const adminSubNav = [
  { key: 'vehicles', path: '/admin/vehicles' },
  { key: 'drivers', path: '/admin/drivers' },
  { key: 'clients', path: '/admin/clients' },
  { key: 'vendors', path: '/admin/vendors' },
  { key: 'documents', path: '/admin/documents' },
];

const reportsSubNav = [
  { key: 'daily_report', path: '/reports/daily' },
  { key: 'profit_loss', path: '/reports/pnl' },
  { key: 'soa', path: '/reports/soa' },
  { key: 'expenses', path: '/expenses' },
  { key: 'fuel', path: '/fuel' },
];

const subNavMap = {
  '/': [],
  '/settings': [],
  '/reports/daily': reportsSubNav,
  '/reports/pnl': reportsSubNav,
  '/reports/soa': reportsSubNav,
  '/expenses': reportsSubNav,
  '/fuel': reportsSubNav,
  '/admin/vehicles': adminSubNav,
  '/admin/drivers': adminSubNav,
  '/admin/clients': adminSubNav,
  '/admin/vendors': adminSubNav,
  '/admin/documents': adminSubNav,
};

import { Bell, Settings, Search } from 'lucide-react'; // adjust imports as needed

export default function TopBar() {
  return (
    <header 
      className="sticky top-0 z-50 w-full h-14 md:h-16 flex items-center justify-between px-4 md:px-6 lg:px-8"
      style={{
        background: 'linear-gradient(180deg, rgba(8,11,18,0.95) 0%, rgba(8,11,18,0.80) 100%)',
        backdropFilter: 'blur(20px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.1)',
        borderBottom: '1px solid rgba(59,130,246,0.08)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 -1px 0 rgba(255,255,255,0.03)'
      }}
    >
      {/* Left: Breadcrumb or page title area */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.08))',
            border: '1px solid rgba(59,130,246,0.15)'
          }}
        >
          {/* Your logo icon here */}
        </div>
        <h1 className="text-sm md:text-base font-semibold text-white/90 tracking-tight">
          Bronze Wings
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search trigger */}
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/5 transition-all duration-200">
          <Search className="w-4 h-4" />
        </button>
        
        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/5 transition-all duration-200">
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse-glow" />
        </button>
        
        {/* Settings */}
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/5 transition-all duration-200">
          <Settings className="w-4 h-4" />
        </button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-700/20 border border-blue-500/20 ml-1" />
      </div>
    </header>
  );
}