import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import {
  Truck, ChartColumn, UsersRound, Search,
  Route, Receipt, ClipboardList, TrendingUp, FileText, Landmark, Building2, Wallet,
  FileSignature, FilePlus2, PanelLeftClose, PanelLeftOpen } from
'lucide-react';
import { getCompanySettings } from '@/lib/companySettings';
import { railVisibility, useRailCollapsed } from '@/lib/railVisibility';

/* Sectioned sidebar model — search at top, grouped sections, full-width
   icon+label rows, active row as a bordered bronze pill. Always visible. */
const navItems = [
{
  key: 'operations', label: 'Operations',
  children: [
  { key: 'trips', label: 'Trips', path: '/trips', icon: Route, color: '#1ED760' },
  { key: 'expenses', label: 'Expenses', path: '/expenses', icon: Receipt, color: '#f97316' }]

},
{
  key: 'admin', label: 'Admin',
  children: [
  { key: 'vehicles', label: 'Vehicles', path: '/admin/vehicles', icon: Truck, color: '#3b82f6' },
  { key: 'drivers', label: 'Drivers', path: '/admin/drivers', icon: UsersRound, color: '#0ea5e9' },
  { key: 'clients', label: 'Clients', path: '/admin/clients', icon: Building2, color: '#14b8a6' }]

},
{
  key: 'reports', label: 'Reports',
  children: [
  { key: 'daily_report', label: 'Daily', path: '/reports/daily', icon: ClipboardList, color: '#fbbf24' },
  { key: 'profit_loss', label: 'P&L', path: '/reports/pnl', icon: TrendingUp, color: '#22c55e' },
  { key: 'soa', label: 'SOA', path: '/reports/soa', icon: FileText, color: '#ef4444' }]

},
{
  key: 'accounts', label: 'Accounts',
  children: [
  { key: 'bank_reconciliation', label: 'Bank Rec', path: '/reports/bank-reconciliation', icon: Landmark, color: '#6366f1' },
  { key: 'petty_cash', label: 'Petty Cash', path: '/accounts/petty-cash', icon: Wallet, color: '#f59e0b' },
  { key: 'quotations', label: 'Quotations', path: '/accounts/quotations', icon: FilePlus2, color: '#06b6d4' },
  { key: 'agreements', label: 'Agreements', path: '/accounts/agreements', icon: FileSignature, color: '#eab308' }]

}];


const RAIL_W = 196;
const RAIL_W_COLLAPSED = 64;

export default function ContentSidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState(null);
  const [company, setCompany] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const collapsed = useRailCollapsed();
  useEffect(() => {getCompanySettings().then(setCompany);}, []);

  const isChildActive = (child) =>
  location.pathname === child.path || location.pathname.startsWith(child.path + '/');

  const q = query.trim().toLowerCase();
  const sections = useMemo(() => navItems.
  map((s) => ({
    ...s,
    children: s.children.filter((c) => !q || (c.label || t(c.key) || '').toLowerCase().includes(q))
  })).
  filter((s) => s.children.length > 0), [q, t]);

  const width = collapsed ? RAIL_W_COLLAPSED : RAIL_W;

  return (
    <div className="hidden md:block fixed left-0 top-0 z-[55] h-[calc(100dvh-42px)]">
      <aside
        className="relative flex flex-col h-full"
        style={{
          width,
          paddingTop: 16,
          paddingBottom: 12,
          paddingLeft: collapsed ? 10 : 14,
          paddingRight: collapsed ? 10 : 14,
          gap: collapsed ? 10 : 14,
          background: 'hsl(var(--sidebar-background))',
          borderRight: '1px solid hsl(var(--sidebar-border))',
          boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
          overflow: 'visible',
          transition: 'width 0.35s cubic-bezier(0.16,1,0.3,1), padding 0.35s cubic-bezier(0.16,1,0.3,1)'
        }}>

        {/* company brand — click to navigate home */}
        <button
          onClick={() => navigate('/')}
          aria-label="Go to dashboard"
          title="Go to dashboard"
          className="flex items-center gap-2.5 px-1 flex-shrink-0 transition-all duration-200 hover:opacity-80"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start', cursor: 'pointer' }}>
          {company?.logo_url ?
          <img src={company.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain flex-shrink-0" style={{ border: '1px solid hsl(var(--sidebar-border))' }} /> :

          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--sidebar-accent))', border: '1px solid hsl(var(--sidebar-border))' }}>
              <span className="text-[11px] font-bold" style={{ color: 'hsl(var(--sidebar-primary))' }}>BW</span>
            </div>
          }
          <span className="text-[12px] font-bold tracking-wide leading-tight" style={{ color: 'hsl(var(--sidebar-foreground))', display: collapsed ? 'none' : 'inline' }}>
            {company?.company_name || 'Bronze Wings'}
          </span>
        </button>

        {/* search */}
        {!collapsed && (
        <div className="relative flex items-center" style={{ marginBottom: 4 }}>
          <Search className="absolute left-3 w-3.5 h-3.5 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full h-9 rounded-xl text-xs pl-9 pr-12 transition-all"
            style={{
              background: 'hsl(var(--input))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
              outline: 'none'
            }} />

          <span
            className="absolute right-2.5 text-[10px] font-mono px-1.5 py-0.5 rounded-md pointer-events-none"
            style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>

            ⌘P
          </span>
        </div>
        )}
        {collapsed && (
          <button
            onClick={() => railVisibility.setCollapsed(false)}
            aria-label="Search"
            className="flex items-center justify-center w-full h-9 rounded-xl transition-all"
            style={{ background: 'hsl(var(--input))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}>
            <Search className="w-4 h-4" />
          </button>
        )}

        <div
          className="relative flex-1 overflow-y-auto thin-scroll flex flex-col"
          style={{ gap: collapsed ? 8 : 20 }}
          onMouseLeave={() => setHovered(null)}>

          {sections.map((section) =>
          <div key={section.key} className="flex flex-col" style={{ gap: collapsed ? 4 : 6 }}>
              {!collapsed && (
              <span
              className="text-[10px] font-semibold tracking-[0.14em] uppercase px-2 mb-1"
              style={{ color: 'hsl(var(--muted-foreground))' }}>

                {t(section.key) || section.label}
              </span>
              )}

              {section.children.map((child) => {
              const active = isChildActive(child);
              const lit = active || hovered === child.key;
              const label = child.label || t(child.key);
              const c = child.color || 'rgb(var(--panel-accent-rgb))';
              return (
                <button
                  key={child.key}
                  onClick={() => navigate(child.path)}
                  onMouseEnter={(e) => {
                    setHovered(child.key);
                    if (collapsed) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({ label, top: rect.top + rect.height / 2, color: c });
                    }
                  }}
                  onMouseLeave={() => {
                    setHovered(null);
                    if (collapsed) setTooltip(null);
                  }}
                  aria-label={label}
                  className="nav-shine relative flex items-center rounded-xl transition-all duration-300 select-none overflow-hidden"
                  style={{
                    height: 40,
                    padding: collapsed ? 0 : '0 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: collapsed ? 0 : 12,
                    width: '100%',
                    background: active
                      ? `${c}14`
                      : lit
                        ? `${c}0a`
                        : 'transparent',
                    border: `1px solid ${active ? `${c}40` : 'transparent'}`,
                    boxShadow: active
                      ? `inset 2px 0 0 0 ${c}, 0 0 18px -6px ${c}66`
                      : lit
                        ? `inset 0 0 0 1px ${c}1a`
                        : 'none',
                    cursor: 'pointer',
                    ['--nav-shine-color']: c,
                  }}>

                    {/* shine sweep on hover */}
                    <span className="nav-shine-sweep" />

                    <child.icon
                    strokeWidth={2}
                    fill={active ? c : 'currentColor'}
                    fillOpacity={active ? 0.15 : 0}
                    style={{
                      width: collapsed ? 20 : 18,
                      height: collapsed ? 20 : 18,
                      color: active ? c : lit ? c : 'hsl(var(--muted-foreground))',
                      filter: active ? `drop-shadow(0 0 6px ${c}88)` : 'none',
                      transition: 'all 0.25s ease'
                    }} />

                    {!collapsed && (
                    <span
                    className="text-[12.5px] font-medium tracking-wide whitespace-nowrap"
                    style={{ color: active ? 'hsl(var(--sidebar-foreground))' : lit ? c : 'hsl(var(--muted-foreground))' }}>

                      {label}
                    </span>
                    )}
                  </button>);

            })}
            </div>
          )}

          {sections.length === 0 &&
          <div className="text-center text-xs py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No results
            </div>
          }
        </div>

        {/* collapse toggle */}
        <button
          onClick={() => railVisibility.toggleCollapsed()}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
          className="flex items-center rounded-xl transition-all duration-300 flex-shrink-0"
          style={{
            height: 38,
            justifyContent: 'center',
            gap: 10,
            padding: collapsed ? 0 : '0 12px',
            background: 'hsl(var(--sidebar-accent))',
            border: '1px solid hsl(var(--sidebar-border))',
            color: 'hsl(var(--muted-foreground))',
            cursor: 'pointer',
          }}>
          {collapsed ?
            <PanelLeftOpen className="w-4 h-4" strokeWidth={2} style={{ color: 'hsl(var(--sidebar-primary))' }} /> :
            <>
              <PanelLeftClose className="w-4 h-4" strokeWidth={2} style={{ color: 'hsl(var(--sidebar-primary))' }} />
              <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'hsl(var(--sidebar-foreground))' }}>Collapse</span>
            </>
          }
        </button>

        {/* hover tooltip bubble — shown only when the rail is collapsed */}
        {tooltip && (
          <div
            className="fixed z-[60] pointer-events-none animate-fade-in"
            style={{ left: width + 10, top: tooltip.top, transform: 'translateY(-50%)' }}
          >
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
              style={{
                background: 'hsl(var(--popover))',
                color: 'hsl(var(--popover-foreground))',
                border: `1px solid ${tooltip.color || 'hsl(var(--border))'}`,
                boxShadow: `0 6px 18px rgba(0,0,0,0.35), 0 0 14px -4px ${tooltip.color || 'transparent'}66`,
              }}
            >
              {tooltip.label}
            </div>
          </div>
        )}
      </aside>
    </div>);
}