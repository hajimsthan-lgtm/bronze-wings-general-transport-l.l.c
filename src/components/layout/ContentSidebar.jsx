import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import {
  Truck, ChartColumn, UsersRound,
  Route, Receipt, ClipboardList, TrendingUp, FileText, Landmark, Building2,
} from 'lucide-react';

/* Pill Rail — flat glassmorphic pills grouped by section headers, joined by a
   vertical bronze spine. Always expanded, permanently visible (no auto-hide). */
const navItems = [
  {
    key: 'operations', label: 'Operations',
    children: [
      { key: 'trips', label: 'Trips', path: '/trips', icon: Route, glow: '184,70,58' },
      { key: 'expenses', label: 'Expenses', path: '/expenses', icon: Receipt, glow: '196,163,90' },
    ],
  },
  {
    key: 'reports', label: 'Reports',
    children: [
      { key: 'daily_report', label: 'Daily', path: '/reports/daily', icon: ClipboardList, glow: '196,163,90' },
      { key: 'profit_loss', label: 'P&L', path: '/reports/pnl', icon: TrendingUp, glow: '184,70,58' },
      { key: 'soa', label: 'SOA', path: '/reports/soa', icon: FileText, glow: '212,99,79' },
      { key: 'bank_reconciliation', label: 'Bank Rec', path: '/reports/bank-reconciliation', icon: Landmark, glow: '184,70,58' },
    ],
  },
  {
    key: 'admin', label: 'Admin',
    children: [
      { key: 'vehicles', label: 'Vehicles', path: '/admin/vehicles', icon: Truck, glow: '139,58,46' },
      { key: 'drivers', label: 'Drivers', path: '/admin/drivers', icon: UsersRound, glow: '196,163,90' },
      { key: 'clients', label: 'Clients', path: '/admin/clients', icon: Building2, glow: '184,70,58' },
    ],
  },
];

const RAIL_W = 204;

export default function ContentSidebar() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredChild, setHoveredChild] = useState(null);

  const isChildActive = (child) =>
    location.pathname === child.path || location.pathname.startsWith(child.path + '/');

  return (
    <div className="hidden md:block fixed left-0 top-20 z-[55] h-[calc(100dvh-5rem)]">
      <aside
        className="relative flex flex-col h-full"
        style={{
          width: RAIL_W,
          paddingTop: 22,
          paddingBottom: 22,
          paddingLeft: 14,
          paddingRight: 14,
          background: 'linear-gradient(180deg, #1a1010 0%, #140c0c 100%)',
          borderRight: '1px solid rgba(184,70,58,0.18)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.45)',
          overflow: 'visible',
        }}
      >
        {/* vertical bronze spine — runs through the center of every pill */}
        <span
          className="absolute top-6 bottom-6 w-px pointer-events-none"
          style={{
            left: '50%',
            transform: 'translateX(-50%)',
            background:
              'linear-gradient(180deg, transparent 0%, rgba(196,163,90,0.28) 6%, rgba(196,163,90,0.28) 94%, transparent 100%)',
            zIndex: 0,
          }}
        />

        <div
          className="relative flex-1 overflow-y-auto thin-scroll flex flex-col gap-6"
          style={{ zIndex: 1 }}
          onMouseLeave={() => setHoveredChild(null)}
        >
          {navItems.map((section) => (
            <div key={section.key} className="flex flex-col items-center gap-2.5">
              {/* section header */}
              <span
                className="text-[10px] font-semibold tracking-[0.16em] uppercase whitespace-nowrap my-1"
                style={{ color: 'rgba(196,163,90,0.88)' }}
              >
                {t(section.key) || section.label}
              </span>

              {/* pills */}
              {section.children.map((child) => {
                const active = isChildActive(child);
                const lit = active || hoveredChild === child.key;
                const label = child.label || t(child.key);
                return (
                  <button
                    key={child.key}
                    onClick={() => navigate(child.path)}
                    onMouseEnter={() => setHoveredChild(child.key)}
                    aria-label={label}
                    className="relative flex items-center justify-center gap-2 rounded-full transition-all duration-300 select-none"
                    style={{
                      height: 38,
                      padding: '0 18px',
                      background: lit
                        ? `linear-gradient(135deg, rgba(${child.glow},0.24), rgba(${child.glow},0.08))`
                        : 'rgba(255,255,255,0.035)',
                      border: `1px solid ${lit ? 'rgba(196,163,90,0.55)' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: lit
                        ? '0 0 0 1px rgba(196,163,90,0.30), 0 0 20px -4px rgba(196,163,90,0.55), inset 0 1px 0 rgba(255,255,255,0.12)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      cursor: 'pointer',
                    }}
                  >
                    <child.icon
                      strokeWidth={1.5}
                      style={{
                        width: 15,
                        height: 15,
                        color: lit ? '#FDF8ED' : `rgba(${child.glow},0.92)`,
                        filter: active ? 'drop-shadow(0 0 4px rgba(196,163,90,0.6))' : 'none',
                      }}
                    />
                    <span
                      className="text-[11px] font-semibold tracking-[0.06em] uppercase whitespace-nowrap"
                      style={{ color: lit ? '#FDF8ED' : 'rgba(255,255,255,0.72)' }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}