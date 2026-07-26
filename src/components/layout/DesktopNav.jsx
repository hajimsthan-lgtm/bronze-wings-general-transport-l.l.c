import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { LayoutDashboard, Truck, BarChart3, Shield, Sun, Moon, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getCompanySettings } from '@/lib/companySettings';
import LiveClock from '@/components/common/LiveClock';
import BrandName from '@/components/layout/BrandName';

const navItems = [
{ key: 'dashboard', icon: LayoutDashboard, path: '/', paths: ['/'] },
{ key: 'operations', icon: Truck, path: '/trips', paths: ['/trips', '/contracts', '/expenses'] },
{ key: 'reports', icon: BarChart3, path: '/reports/daily', paths: ['/reports'] },
{ key: 'admin', icon: Shield, path: '/admin/vehicles', paths: ['/admin'] }];


export default function DesktopNav() {
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState('');
  useEffect(() => {getCompanySettings().then((s) => setLogoUrl(s.logo_url));}, []);

  const isActive = (item) => (item.paths || [item.path]).some((p) =>
  p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
  );

  return (
    <nav className="hidden md:block sticky top-0 z-50">
      {/* dark satin glass surface */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, var(--header-tint-1) 0%, var(--header-tint-2) 100%)',
        backdropFilter: 'blur(14px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.3)',
      }} />
      {/* top specular highlight */}
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.16) 50%, transparent 100%)' }} />
      {/* gradient bottom hairline */}
      <div className="absolute inset-x-0 bottom-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.30) 50%, transparent 100%)' }} />
      {/* centered ambient blue light-leak */}
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 h-16 w-2/3" style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(59,130,246,0.06), transparent 70%)' }} />

      <div className="relative max-w-[1440px] mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group/brand">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl blur-md opacity-70" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)' }} />
            {logoUrl ?
            <img src={logoUrl} alt="Bronze Wings" className="relative w-9 h-9 rounded-xl object-contain ring-1 ring-white/10" /> :

            <div className="relative w-9 h-9 rounded-xl border border-blue-500/30 bg-blue-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <span className="text-sm font-bold text-blue-400">BW</span>
              </div>
            }
          </div>
          <BrandName variant="desktop" />
        </Link>

        {/* Center segmented nav — dark pill channel */}
        <div className="flex items-center gap-1 rounded-full border border-white/5 bg-black/40 p-1.5 backdrop-blur-md">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.key}
                to={item.path}
                className={`relative flex items-center gap-2 rounded-full px-5 py-1.5 text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                active ?
                'text-white' :
                'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'}`
                }
                style={active ?
                { background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(37,99,235,0.15))', border: '1px solid rgba(59,130,246,0.40)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 0 12px rgba(59,130,246,0.25)' } :
                { border: '1px solid transparent' }}>
                
                <item.icon className="w-3.5 h-3.5" />
                <span>{t(item.key)}</span>
              </Link>);

          })}
        </div>

        {/* Right controls — dark glass circles */}
        <div className="flex items-center gap-2">
          <LiveClock />
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 transition-all hover:border-blue-500/30 hover:bg-white/10 hover:text-white"
            aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          <Link to="/settings" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 transition-all hover:border-blue-500/30 hover:bg-white/10 hover:text-white" aria-label="Settings">
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </nav>);

}