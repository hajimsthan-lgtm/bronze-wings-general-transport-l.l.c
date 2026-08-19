import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import EntityFormDialog from '@/components/common/EntityFormDialog';
import VehicleAddForm from './VehicleAddForm';
import { Truck } from 'lucide-react';

/**
 * Edit modal that wraps the new sectioned VehicleAddForm (same UI as Add New).
 * Fetches the VehicleLicense record by plate on open, saves both Vehicle +
 * VehicleLicense on submit, then calls onSaved(updatedVehicleData) so the
 * detail page can refresh its local state without re-doing the API call.
 */
export default function VehicleEditModal({ open, onOpenChange, vehicle, onSaved }) {
  const [editLicense, setEditLicense] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !vehicle?.plate_number) return;
    setEditLicense(null);
    base44.entities.VehicleLicense.filter({ trafficPlateNo: vehicle.plate_number })
      .then((res) => setEditLicense(res?.[0] || null))
      .catch(() => setEditLicense(null));
  }, [open, vehicle]);

  const handleSave = async (vehicleData, licenseData) => {
    try {
      await base44.entities.Vehicle.update(vehicle.id, vehicleData);
      if (licenseData?.trafficPlateNo) {
        const existing = await base44.entities.VehicleLicense.filter({ trafficPlateNo: licenseData.trafficPlateNo });
        if (existing?.length) {
          await base44.entities.VehicleLicense.update(existing[0].id, licenseData);
        } else {
          await base44.entities.VehicleLicense.create(licenseData);
        }
      }
      onOpenChange(false);
      onSaved?.(vehicleData);
    } catch (e) {
      toast({ title: 'Save failed', description: e?.message, variant: 'destructive' });
    }
  };

  return (
    <EntityFormDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={Truck}
      title="Edit Vehicle"
      subtitle="Scan license or enter details manually"
    >
      <VehicleAddForm
        editItem={vehicle}
        editLicense={editLicense}
        onSave={handleSave}
        onCancel={() => onOpenChange(false)}
      />
    </EntityFormDialog>
  );
}