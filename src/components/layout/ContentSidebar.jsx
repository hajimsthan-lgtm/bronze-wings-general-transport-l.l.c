import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import {
  Truck, ChartColumn, UsersRound, Search,
  Route, Receipt, ClipboardList, TrendingUp, FileText, Landmark, Building2, Wallet,
  FileSignature, FilePlus2, PanelLeftClose, PanelLeftOpen, Files,
  ChevronRight } from 'lucide-react';
import { getCompanySettings } from '@/lib/companySettings';
import { railVisibility, useRailCollapsed } from '@/lib/railVisibility';

const navItems = [
  {
    key: 'operations', label: 'Operations', icon: Route, color: '#00f2c3',
    children: [
      { key: 'trips', label: 'Trips', path: '/trips', icon: Route, color: '#00f2c3' },
      { key: 'expenses', label: 'Expenses', path: '/expenses', icon: Receipt, color: '#f97316' }]
  },
  {
    key: 'admin', label: 'Admin', icon: Building2, color: '#3b82f6',
    children: [
      { key: 'vehicles', label: 'Vehicles', path: '/admin/vehicles', icon: Truck, color: '#3b82f6' },
      { key: 'drivers', label: 'Drivers', path: '/admin/drivers', icon: UsersRound, color: '#0ea5e9' },
      { key: 'clients', label: 'Clients', path: '/admin/clients', icon: Building2, color: '#14b8a6' }]
  },
  {
    key: 'reports', label: 'Reports', icon: ClipboardList, color: '#fbbf24',
    children: [
      { key: 'daily_report', label: 'Daily', path: '/reports/daily', icon: ClipboardList, color: '#fbbf24' },
      { key: 'profit_loss', label: 'P&L', path: '/reports/pnl', icon: TrendingUp, color: '#22c55e' },
      { key: 'soa', label: 'SOA', path: '/reports/soa', icon: FileText, color: '#ef4444' }]
  },
  {
    key: 'accounts', label: 'Accounts', icon: Wallet, color: '#6366f1',
    children: [
      { key: 'bank_reconciliation', label: 'Bank Rec', path: '/reports/bank-reconciliation', icon: Landmark, color: '#6366f1' },
      { key: 'petty_cash', label: 'Petty Cash', path: '/accounts/petty-cash', icon: Wallet, color: '#f59e0b' }]
  },
  {
    key: 'documents', label: 'Documents', icon: Files, color: '#06b6d4',
    children: [
      { key: 'quotations', label: 'Quotations', path: '/accounts/quotations', icon: FilePlus2, color: '#06b6d4' },
      { key: 'invoices', label: 'Invoices', path: '/accounts/invoices', icon: FileText, color: '#22c55e' },
      { key: 'agreements', label: 'Agreements', path: '/accounts/agreements', icon: FileSignature, color: '#eab308' }]
  }
];

const RAIL_W = 236;
const RAIL_W_COLLAPSED = 72;

export default function ContentSidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState(null);
  const [company, setCompany] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState({});
  const collapsed = useRailCollapsed();
  useEffect(() => { getCompanySettings().then(setCompany); }, []);

  const isChildActive = (child) =>
    location.pathname === child.path || location.pathname.startsWith(child.path + '/');

  useEffect(() => {
    navItems.forEach((s) => {
      if (s.children.some((c) => isChildActive(c))) {
        setCollapsedSections((prev) => prev[s.key] === false ? prev : { ...prev, [s.key]: false });
      }
    });
  }, [location.pathname]);

  const toggleSection = (key) =>
    setCollapsedSections((prev) => ({ ...prev, [key]: prev[key] === false ? true : false }));

  const q = query.trim().toLowerCase();
  const sections = useMemo(() =>
    navItems
      .map((s) => ({
        ...s,
        children: s.children.filter((c) => !q || (c.label || t(c.key) || '').toLowerCase().includes(q))
      }))
      .filter((s) => s.children.length > 0), [q, t]);

  const width = collapsed ? RAIL_W_COLLAPSED : RAIL_W;

  return (
    <div className="hidden md:block fixed left-0 top-0 z-[55] h-[calc(100dvh-42px)]">
      <aside
        className="morph-sidebar relative flex flex-col h-full"
        style={{
          width,
          paddingTop: 18,
          paddingBottom: 14,
          paddingLeft: collapsed ? 12 : 14,
          paddingRight: collapsed ? 12 : 14,
          gap: collapsed ? 10 : 12,
          overflow: 'visible',
          transition: 'width 0.35s cubic-bezier(0.16,1,0.3,1), padding 0.35s cubic-bezier(0.16,1,0.3,1)'
        }}>

        {/* company brand — click to navigate home */}
        <button
          onClick={() => navigate('/')}
          aria-label="Go to dashboard"
          title="Go to dashboard"
          className="flex items-center gap-2.5 px-1 flex-shrink-0 transition-all duration-200"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start', cursor: 'pointer' }}>
          {company?.logo_url ?
            <div className="morph-tile rounded-xl p-0.5 flex-shrink-0">
              <img src={company.logo_url} alt="" className="w-8 h-8 rounded-lg object-contain" />
            </div> :
            <div className="morph-tile w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold tracking-wide" style={{ color: 'hsl(var(--sidebar-primary))', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>BW</span>
            </div>
          }
          <span className="text-[12.5px] font-bold tracking-wide leading-tight" style={{ color: 'hsl(var(--sidebar-foreground))', display: collapsed ? 'none' : 'inline' }}>
            {company?.company_name || 'Bronze Wings'}
          </span>
        </button>

        {/* search */}
        {!collapsed && (
          <div className="morph-search relative flex items-center rounded-xl" style={{ marginBottom: 2 }}>
            <Search className="absolute left-3 w-3.5 h-3.5 pointer-events-none" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full h-9 rounded-xl text-xs pl-9 pr-3 transition-all bg-transparent"
              style={{ border: 'none', color: 'hsl(var(--foreground))', outline: 'none', boxShadow: 'none' }} />
          </div>
        )}
        {collapsed && (
          <button
            onClick={() => railVisibility.setCollapsed(false)}
            aria-label="Search"
            className="morph-search flex items-center justify-center w-full h-9 rounded-xl transition-all">
            <Search className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          </button>
        )}

        <div
          className="relative flex-1 overflow-y-auto thin-scroll flex flex-col"
          style={{ gap: collapsed ? 10 : 16 }}
          onMouseLeave={() => setHovered(null)}>

          {sections.map((section, sIdx) => {
            const secCollapsed = collapsedSections[section.key] === true;
            const hasActive = section.children.some((c) => isChildActive(c));
            const sc = section.color || 'rgb(var(--panel-accent-rgb))';
            return (
              <div key={section.key} className="flex flex-col" style={{ gap: collapsed ? 6 : 4 }}>
                {/* category boundary divider — visible when collapsed */}
                {collapsed && sIdx > 0 && (
                  <div className="morph-divider" style={{ margin: '4px 8px 8px', opacity: 0.7 }} />
                )}

                {/* minimal section header — plain label + divider */}
                {!collapsed && (
                  <button
                    onClick={() => toggleSection(section.key)}
                    className="flex items-center gap-2 px-2 pt-1 pb-1.5 transition-all duration-200 group"
                    style={{ cursor: 'pointer', border: 'none', background: 'transparent' }}>
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase flex-1 text-left" style={{ color: hasActive ? sc : 'hsl(var(--muted-foreground))' }}>
                      {t(section.key) || section.label}
                    </span>
                    <ChevronRight
                      strokeWidth={2.5}
                      style={{
                        width: 13, height: 13,
                        color: 'hsl(var(--muted-foreground))',
                        opacity: 0.6,
                        transform: secCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                        transition: 'transform 0.25s cubic-bezier(0.16,1,0.3,1)'
                      }} />
                  </button>
                )}
                {!collapsed && (
                  <div className="morph-divider" style={{ margin: '0 4px 6px', opacity: 0.4 }} />
                )}

                {/* section children — collapsible */}
                {(!collapsed ? !secCollapsed : true) && section.children.map((child) => {
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
                      className={`relative flex items-center rounded-xl transition-all duration-200 select-none overflow-hidden ${collapsed ? 'morph-row' : ''} ${active && collapsed ? 'morph-row-active' : ''}`}
                      style={{
                        height: collapsed ? 42 : 36,
                        padding: collapsed ? 0 : '0 10px',
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        gap: collapsed ? 0 : 10,
                        marginLeft: collapsed ? 0 : 0,
                        width: '100%',
                        border: 'none',
                        cursor: 'pointer',
                        ...(active && !collapsed ? { background: `${c}14` } : {}),
                        ...(!active && lit && !collapsed ? { background: 'rgba(255,255,255,0.04)' } : {}),
                      }}>

                      {/* active left accent bar */}
                      {active && (
                        <span
                          className="absolute left-0 rounded-r-full"
                          style={{
                            top: collapsed ? 6 : 8,
                            bottom: collapsed ? 6 : 8,
                            width: 3,
                            background: c,
                            boxShadow: collapsed ? `0 0 10px ${c}, 0 0 4px ${c}` : 'none',
                          }} />
                      )}

                      {/* icon — morph tile when collapsed, flat when expanded */}
                      {collapsed ? (
                        <span
                          className={`relative flex items-center justify-center rounded-lg flex-shrink-0 ${active ? 'morph-tile-pressed' : lit ? 'morph-tile-raised' : 'morph-tile'}`}
                          style={{
                            width: 32, height: 32,
                            ...(active ? { boxShadow: `inset 2px 2px 5px rgba(0,0,0,0.36), inset -1px -1px 2px rgba(255,255,255,0.05), 0 0 0 1px ${c}55, 0 0 14px -2px ${c}66` } : {}),
                          }}>
                          <child.icon
                            strokeWidth={2.1}
                            fill={active ? c : 'currentColor'}
                            fillOpacity={active ? 0.22 : 0}
                            style={{
                              width: 18, height: 18,
                              color: active ? c : lit ? c : 'hsl(var(--muted-foreground))',
                              filter: active ? `drop-shadow(0 0 6px ${c})` : lit ? `drop-shadow(0 0 4px ${c}88)` : 'none',
                              transition: 'all 0.25s ease'
                            }} />
                        </span>
                      ) : (
                        <span className="flex items-center justify-center flex-shrink-0" style={{ width: 22, height: 22 }}>
                          <child.icon
                            strokeWidth={2}
                            style={{
                              width: 16, height: 16,
                              color: active ? c : lit ? c : 'hsl(var(--muted-foreground))',
                              transition: 'all 0.2s ease'
                            }} />
                        </span>
                      )}

                      {!collapsed && (
                        <span
                          className="text-[13px] font-medium tracking-wide whitespace-nowrap"
                          style={{
                            color: active ? 'hsl(var(--sidebar-foreground))' : 'hsl(var(--muted-foreground))',
                          }}>
                          {label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}

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
          className="morph-toggle flex items-center rounded-xl transition-all duration-300 flex-shrink-0"
          style={{
            height: 38,
            justifyContent: 'center',
            gap: 10,
            padding: collapsed ? 0 : '0 12px',
            border: 'none',
            color: 'hsl(var(--muted-foreground))',
            cursor: 'pointer',
          }}>
          {collapsed ?
            <PanelLeftOpen className="w-4 h-4" strokeWidth={2.2} style={{ color: 'hsl(var(--sidebar-primary))', filter: 'drop-shadow(0 0 4px hsl(var(--sidebar-primary)))' }} /> :
            <>
              <PanelLeftClose className="w-4 h-4" strokeWidth={2.2} style={{ color: 'hsl(var(--sidebar-primary))', filter: 'drop-shadow(0 0 4px hsl(var(--sidebar-primary)))' }} />
              <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'hsl(var(--sidebar-foreground))' }}>Collapse</span>
            </>
          }
        </button>

        {/* hover tooltip bubble — shown only when the rail is collapsed */}
        {tooltip && (
          <div
            className="fixed z-[60] pointer-events-none animate-fade-in"
            style={{ left: width + 10, top: tooltip.top, transform: 'translateY(-50%)' }}>
            <div
              className="morph-tile px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
              style={{
                color: 'hsl(var(--popover-foreground))',
                boxShadow: `0 6px 18px rgba(0,0,0,0.35), 0 0 14px -4px ${tooltip.color || 'transparent'}66, inset 0 1px 0 rgba(255,255,255,0.1)`,
              }}>
              {tooltip.label}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}