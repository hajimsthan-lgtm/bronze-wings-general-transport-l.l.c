import EntityFormDialog from '@/components/common/EntityFormDialog';
import DriverAddForm from './DriverAddForm';
import { Users } from 'lucide-react';

/**
 * Edit modal that wraps the scan-based DriverAddForm (same UI as Add New).
 * Used by DriverProfileCard on the driver detail page.
 */
export default function DriverEditModal({ open, onOpenChange, driver, onSaved }) {
  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Users}
      title="Edit Driver"
      subtitle="Scan license or enter details manually"
    >
      <DriverAddForm
        editItem={driver}
        onSave={async (data) => { await onSaved(data); onOpenChange(false); }}
        onCancel={() => onOpenChange(false)}
      />
    </EntityFormDialog>
  );
}