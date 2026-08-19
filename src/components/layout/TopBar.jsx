import { useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import HeaderActionButton from './HeaderActionButton';
import ClientNavDropdown from './ClientNavDropdown';
import DriverNavDropdown from './DriverNavDropdown';
import VehicleNavDropdown from './VehicleNavDropdown';
import ReportClientDropdown from './ReportClientDropdown';
import HeaderSubNav, { subNavMap, hasSubNavForPath } from './headerSubNav';
import { useMaintenanceMode, setMaintenanceMode } from '@/lib/maintenanceStore';
import { BarChart3, LayoutGrid, Plus } from 'lucide-react';

export { hasSubNavForPath };

export default function TopBar() {
  const location = useLocation();
  const { t } = useI18n();

  const matchedKey = Object.keys(subNavMap).find((k) => location.pathname === k || location.pathname.startsWith(k + '/'));
  const subNav = matchedKey ? subNavMap[matchedKey] : [];

  const isMaintenancePage = location.pathname === '/maintenance';
  const maintMode = useMaintenanceMode();

  return (
    <div className="sticky top-0 md:top-20 z-40">
      <div className="w-full px-4 md:px-6 bg-background/85 backdrop-blur-xl border-b border-border/50 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between py-2 gap-2 min-h-[54px]">
            {/* Status filter pills moved to OperationsToolbar (near search) */}
          {/* mobile sub-nav tiles — desktop tiles live in the main header */}
          <HeaderSubNav className="flex md:hidden overflow-x-auto no-scrollbar flex-1 min-w-0 py-1" />
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            <div className="md:hidden flex items-center gap-2">
              {(location.pathname.startsWith('/admin/clients') || location.pathname.startsWith('/admin/vendors')) && <ClientNavDropdown />}
              {location.pathname.startsWith('/admin/vehicles') && <VehicleNavDropdown />}
              {location.pathname.startsWith('/admin/drivers') && <DriverNavDropdown />}
            </div>
            {location.pathname.startsWith('/reports/') && <ReportClientDropdown />}
            {(location.pathname === '/trips' || location.pathname === '/contracts') && (
              <HeaderActionButton
                label={t('new_trip')}
                variant="trip"
                onClick={() => window.dispatchEvent(new CustomEvent('ops:new-trip'))}
              />
            )}
            {location.pathname === '/expenses' && (
              <HeaderActionButton
                label={t('add_new')}
                variant="expense"
                onClick={() => window.dispatchEvent(new CustomEvent('expenses:new'))}
              />
            )}
            {(location.pathname === '/admin/salary' || location.pathname === '/salary') && (
              <HeaderActionButton
                label={t('add_new')}
                variant="trip"
                onClick={() => window.dispatchEvent(new CustomEvent('salary:new'))}
              />
            )}
            {isMaintenancePage && (
              <>
                <div className="hidden md:inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
                  <button onClick={() => setMaintenanceMode('analytics')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${maintMode === 'analytics' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart3 className="w-3.5 h-3.5" />Analytics</button>
                  <button onClick={() => setMaintenanceMode('browse')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${maintMode === 'browse' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" />Browse</button>
                </div>
                <HeaderActionButton
                  label={t('add_new')}
                  variant="trip"
                  onClick={() => window.dispatchEvent(new CustomEvent('maintenance:new'))}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}