import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import {
  Truck, ChartColumn, UsersRound, Search,
  Route, Receipt, ClipboardList, TrendingUp, FileText, Landmark, Building2, Wallet,
  FileSignature, FilePlus2,
} from 'lucide-react';

/* Sectioned sidebar model — search at top, grouped sections, full-width
   icon+label rows, active row as a bordered bronze pill. Always visible. */
const navItems = [
  {
    key: 'operations', label: 'Operations',
    children: [
      { key: 'trips', label: 'Trips', path: '/trips', icon: Route },
      { key: 'expenses', label: 'Expenses', path: '/expenses', icon: Receipt },
    ],
  },
  {
    key: 'admin', label: 'Admin',
    children: [
      { key: 'vehicles', label: 'Vehicles', path: '/admin/vehicles', icon: Truck },
      { key: 'drivers', label: 'Drivers', path: '/admin/drivers', icon: UsersRound },
      { key: 'clients', label: 'Clients', path: '/admin/clients', icon: Building2 },
    ],
  },
  {
    key: 'reports', label: 'Reports',
    children: [
      { key: 'daily_report', label: 'Daily', path: '/reports/daily', icon: ClipboardList },
      { key: 'profit_loss', label: 'P&L', path: '/reports/pnl', icon: TrendingUp },
      { key: 'soa', label: 'SOA', path: '/reports/soa', icon: FileText },
    ],
  },
  {
    key: 'accounts', label: 'Accounts',
    children: [
      { key: 'bank_reconciliation', label: 'Bank Rec', path: '/reports/bank-reconciliation', icon: Landmark },
      { key: 'petty_cash', label: 'Petty Cash', path: '/accounts/petty-cash', icon: Wallet },
      { key: 'quotations', label: 'Quotations', path: '/accounts/quotations', icon: FilePlus2 },
      { key: 'agreements', label: 'Agreements', path: '/accounts/agreements', icon: FileSignature },
    ],
  },
];

const RAIL_W = 196;

export default function ContentSidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [hovered, setHovered] = useState(null);

  const isChildActive = (child) =>
    location.pathname === child.path || location.pathname.startsWith(child.path + '/');

  const q = query.trim().toLowerCase();
  const sections = useMemo(() => navItems
    .map((s) => ({
      ...s,
      children: s.children.filter((c) => !q || (c.label || t(c.key) || '').toLowerCase().includes(q)),
    }))
    .filter((s) => s.children.length > 0), [q, t]);

  return (
    <div className="hidden md:block fixed left-0 top-20 z-[55] h-[calc(100dvh-5rem)]">
      <aside
        className="relative flex flex-col h-full"
        style={{
          width: RAIL_W,
          paddingTop: 16,
          paddingBottom: 16,
          paddingLeft: 14,
          paddingRight: 14,
          gap: 14,
          background: 'hsl(var(--sidebar-background))',
          borderRight: '1px solid hsl(var(--sidebar-border))',
          boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
          overflow: 'visible',
        }}
      >
        {/* search */}
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
              outline: 'none',
            }}
          />
          <span
            className="absolute right-2.5 text-[10px] font-mono px-1.5 py-0.5 rounded-md pointer-events-none"
            style={{ color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
          >
            ⌘P
          </span>
        </div>

        <div
          className="relative flex-1 overflow-y-auto thin-scroll flex flex-col gap-5"
          onMouseLeave={() => setHovered(null)}
        >
          {sections.map((section) => (
            <div key={section.key} className="flex flex-col gap-1.5">
              <span
                className="text-[10px] font-semibold tracking-[0.14em] uppercase px-2 mb-1"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                {t(section.key) || section.label}
              </span>

              {section.children.map((child) => {
                const active = isChildActive(child);
                const lit = active || hovered === child.key;
                const label = child.label || t(child.key);
                return (
                  <button
                    key={child.key}
                    onClick={() => navigate(child.path)}
                    onMouseEnter={() => setHovered(child.key)}
                    aria-label={label}
                    className="relative flex items-center gap-3 rounded-xl transition-all duration-300 select-none"
                    style={{
                      height: 40,
                      padding: '0 12px',
                      width: '100%',
                      background: active
                        ? 'hsl(var(--sidebar-accent))'
                        : lit
                          ? 'hsl(var(--sidebar-accent))'
                          : 'transparent',
                      border: `1px solid ${active ? 'hsl(var(--sidebar-border))' : 'transparent'}`,
                      boxShadow: active
                        ? 'inset 2px 0 0 0 hsl(var(--sidebar-primary))'
                        : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <child.icon
                      strokeWidth={1.6}
                      style={{
                        width: 17,
                        height: 17,
                        color: active ? 'hsl(var(--sidebar-primary))' : 'hsl(var(--muted-foreground))',
                      }}
                    />
                    <span
                      className="text-[12.5px] font-medium tracking-wide whitespace-nowrap"
                      style={{ color: active ? 'hsl(var(--sidebar-foreground))' : 'hsl(var(--muted-foreground))' }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}

          {sections.length === 0 && (
            <div className="text-center text-xs py-8" style={{ color: 'hsl(var(--muted-foreground))' }}>
              No results
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}