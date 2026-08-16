import { useLocation } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Plus } from 'lucide-react';
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

  if (subNav.length === 0 && !showOpsFilter) return null;

  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] md:top-20 z-40">
      <div className="w-full px-4 md:px-6 bg-background/85 backdrop-blur-xl border-b border-border/50 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4)]">
        


















































        
      </div>
    </div>);

}