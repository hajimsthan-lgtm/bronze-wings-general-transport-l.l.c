import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { Truck, FileText } from 'lucide-react';
import SegmentedToggle from '@/components/operations/SegmentedToggle';
import TripsView from '@/components/operations/TripsView';
import ContractsView from '@/components/operations/ContractsView';

export default function Operations() {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const mode = location.pathname === '/contracts' ? 'contract' : 'trip';

  return (
    <div>
      <div className="flex justify-center mb-5">
        <SegmentedToggle
          value={mode}
          onChange={(v) => navigate(v === 'contract' ? '/contracts' : '/trips')}
          options={[
            { value: 'trip', label: t('trips'), icon: Truck },
            { value: 'contract', label: t('contracts'), icon: FileText },
          ]}
        />
      </div>
      {mode === 'contract' ? <ContractsView /> : <TripsView />}
    </div>
  );
}