import DocumentScanZone from './DocumentScanZone';
import { uploadAndExtractVehicleLicense } from '@/lib/vehicleLicenseScan';

/** Backward-compatible wrapper — delegates to the generic DocumentScanZone. */
export default function VehicleLicenseScanZone({ onExtracted, disabled }) {
  return (
    <DocumentScanZone
      extractFn={uploadAndExtractVehicleLicense}
      onExtracted={onExtracted}
      title="Scan UAE Vehicle License"
      description="Drag & drop a PDF or image, or browse. AI extracts all fields — review before saving."
      disabled={disabled}
    />
  );
}