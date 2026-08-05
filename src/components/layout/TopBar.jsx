import { useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Plus } from 'lucide-react';
import ClientNavDropdown from './ClientNavDropdown';
import DriverNavDropdown from './DriverNavDropdown';
import VehicleNavDropdown from './VehicleNavDropdown';
import ReportClientDropdown from './ReportClientDropdown';
import HeaderSubNav, { subNavMap, hasSubNavForPath } from './headerSubNav';

export { hasSubNavForPath };

export default function TopBar() {
  const location = useLocation();
  const { t } = useI18n();

  const matchedKey = Object.keys(subNavMap).find((k) => location.pathname === k || location.pathname.startsWith(k + '/'));
  const subNav = matchedKey ? subNavMap[matchedKey] : [];

  if (subNav.length === 0) return null;

  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] md:top-20 z-40">
      <div className="w-full px-4 md:px-6">
        <div className="flex items-center justify-between py-1.5 gap-2">
          {/* mobile sub-nav tiles — desktop tiles live in the main header */}
          <HeaderSubNav className="flex md:hidden overflow-x-auto no-scrollbar flex-1 min-w-0 py-1.5 pb-8" />
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
            {(location.pathname.startsWith('/admin/clients') || location.pathname.startsWith('/admin/vendors')) && <ClientNavDropdown />}
            {location.pathname.startsWith('/admin/vehicles') && <VehicleNavDropdown />}
            {location.pathname.startsWith('/admin/drivers') && <DriverNavDropdown />}
            {location.pathname.startsWith('/reports/') && <ReportClientDropdown />}
            {(location.pathname === '/trips' || location.pathname === '/contracts') && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('ops:new-trip'))}
                className="btn-new-trip inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold uppercase tracking-wider text-white transition-all whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> {t('new_trip')}
              </button>
            )}
            {location.pathname === '/expenses' && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('expenses:new'))}
                className="btn-new-expense inline-flex items-center gap-1.5 h-8 px-4 rounded-full text-xs font-semibold uppercase tracking-wider text-white transition-all whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> {t('add_new')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}