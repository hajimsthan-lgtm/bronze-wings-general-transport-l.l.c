import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ChevronRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems, secondaryNav } from '@/lib/navConfig';

// Flatten all nav routes into a path → label map
const ROUTE_MAP = (() => {
  const map = { '/': 'Dashboard' };
  navItems.forEach(group => {
    (group.children || []).forEach(item => {
      if (item.path) map[item.path] = item.label;
    });
  });
  secondaryNav.forEach(item => {
    if (item.path) map[item.path] = item.label;
  });
  // Extra routes not in nav
  map['/fuel'] = 'Fuel';
  map['/services'] = 'Services';
  map['/admin/documents'] = 'Documents';
  map['/admin/salary'] = 'Salary';
  map['/maintenance'] = 'Maintenance';
  map['/settings'] = 'Settings';
  map['/notifications'] = 'Notifications';
  return map;
})();

// Match a path to its label, supporting dynamic routes like /admin/vehicles/:id
function resolveLabel(pathname) {
  if (ROUTE_MAP[pathname]) return ROUTE_MAP[pathname];
  // Try parent path for detail pages (e.g. /admin/vehicles/123 → Vehicles)
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length >= 3) {
    const parentPath = '/' + parts.slice(0, 2).join('/');
    if (ROUTE_MAP[parentPath]) return `${ROUTE_MAP[parentPath]} Detail`;
  }
  if (parts.length >= 2) {
    const parentPath = '/' + parts.slice(0, 2).join('/');
    if (ROUTE_MAP[parentPath]) return ROUTE_MAP[parentPath];
  }
  return null;
}

export default function BreadcrumbBack({ disabled }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentLabel = resolveLabel(location.pathname);

  const handleBack = () => {
    if (disabled) return;
    navigate(-1);
  };

  const handleHome = (e) => {
    e.stopPropagation();
    navigate('/');
  };

  return (
    <div className="hidden md:flex items-center gap-1 flex-shrink-0">
      {/* Home button — always navigates to dashboard */}
      <button
        onClick={handleHome}
        aria-label="Go to dashboard"
        title="Dashboard"
        className={cn(
          'group inline-flex items-center justify-center w-9 h-9 rounded-full border transition-all duration-300 active:scale-95',
          'border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-[rgba(var(--panel-accent-rgb),0.35)]'
        )}
      >
        <Home className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </button>

      {/* Breadcrumb trail — clickable to go back */}
      <button
        onClick={handleBack}
        disabled={disabled}
        aria-label="Go back"
        title="Go back"
        className={cn(
          'group inline-flex items-center gap-1.5 h-9 px-3 rounded-full border transition-all duration-300',
          disabled
            ? 'opacity-40 cursor-not-allowed border-transparent bg-transparent'
            : 'border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-[rgba(var(--panel-accent-rgb),0.35)] active:scale-95'
        )}
      >
        <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
        <span className="text-xs font-medium text-muted-foreground">Apps</span>
        {currentLabel && (
          <>
            <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
            <span className="text-xs font-bold text-foreground">{currentLabel}</span>
          </>
        )}
      </button>
    </div>
  );
}