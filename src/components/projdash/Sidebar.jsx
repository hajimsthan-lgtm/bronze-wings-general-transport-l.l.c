import { useState } from 'react';
import { LayoutDashboard, Activity, History, Users, FileText, Folder, LogOut, Settings, Zap } from 'lucide-react';

const NAV = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Activity', icon: Activity },
  { label: 'History', icon: History },
  { label: 'Team', icon: Users },
  { label: 'Details', icon: FileText },
  { label: 'Folders', icon: Folder },
];

export default function Sidebar() {
  const [active, setActive] = useState('Dashboard');
  return (
    <aside
      className="hidden md:flex flex-col w-[80px] lg:w-[240px] flex-shrink-0 h-full"
      style={{ background: '#16162a', borderRight: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 lg:px-5 h-16 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)' }}>
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="hidden lg:block text-white font-bold text-lg">BrandName</span>
        <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}>Pro</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const isActive = active === item.label;
          return (
            <button
              key={item.label}
              onClick={() => setActive(item.label)}
              className="group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-200 justify-center lg:justify-start"
              style={isActive ? { background: '#1e1e3f', color: '#fff' } : { color: '#9ca3af' }}
            >
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full" style={{ background: '#3b82f6' }} />}
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block text-sm font-medium group-hover:text-white transition-colors">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer actions */}
      <div className="px-3 pb-5 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl justify-center lg:justify-start transition-colors hover:bg-white/5" style={{ color: '#9ca3af' }}>
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span className="hidden lg:block text-sm font-medium">Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl justify-center lg:justify-start transition-colors hover:bg-red-500/10" style={{ color: '#ef4444' }}>
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="hidden lg:block text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}