import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/operations', label: 'Operations' },
  { to: '/reports', label: 'Reports' },
  { to: '/admin', label: 'Admin' },
];

export default function MobileNav() {
  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 px-4 flex items-center justify-around"
      style={{
        background: 'linear-gradient(0deg, rgba(8,11,18,0.95) 0%, rgba(8,11,18,0.85) 100%)',
        backdropFilter: 'blur(20px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.1)',
        borderTop: '1px solid rgba(59,130,246,0.08)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)'
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `
            flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200
            ${isActive ? 'text-blue-400' : 'text-white/30'}
          `}
        >
          <div className={`w-5 h-5 rounded ${isActive ? 'bg-blue-500/30' : 'bg-white/5'}`} />
          <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}