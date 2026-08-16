import { useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import HeaderActionButton from './HeaderActionButton';
import ClientNavDropdown from './ClientNavDropdown';
import DriverNavDropdown from './DriverNavDropdown';
import VehicleNavDropdown from './VehicleNavDropdown';
import ReportClientDropdown from './ReportClientDropdown';
import HeaderSubNav, { subNavMap, hasSubNavForPath } from './headerSubNav';
import { useOpsFilter } from '@/lib/operationsFilterStore';

export { hasSubNavForPath };

export default function TopBar() {
  const location = useLocation();
  const { t } = useI18n();
  const opsFilter = useOpsFilter();

  const matchedKey = Object.keys(subNavMap).find((k) => location.pathname === k || location.pathname.startsWith(k + '/'));
  const subNav = matchedKey ? subNavMap[matchedKey] : [];

  const isOpsPage = location.pathname === '/trips' || location.pathname === '/contracts';
  const showOpsFilter = isOpsPage && opsFilter.active && opsFilter.options?.length > 0;

  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] md:top-20 z-40">
      <div className="w-full px-4 md:px-6 bg-background/85 backdrop-blur-xl border-b border-border/50 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4)]">
        <div className="flex items-center justify-between py-1.5 gap-2">
          {/* Left: status filter pills for Operations pages */}
          {showOpsFilter && (
            <div className="hidden md:flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto no-scrollbar py-1">
              {opsFilter.options.map((s) => {
                const active = opsFilter.value === s;
                const count = s === 'all' ? null : opsFilter.counts?.[s];
                return (
                  <button
                    key={s}
                    onClick={() => opsFilter.onChange?.(s)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors whitespace-nowrap ${
                      active
                        ? 'border-primary text-primary bg-primary/10'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                    }`}
                  >
                    {s === 'all' ? t('all') : t(s)}{count != null ? ` · ${count}` : ''}
                  </button>
                );
              })}
            </div>
          )}
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
          </div>
        </div>
      </div>
    </div>
  );
}