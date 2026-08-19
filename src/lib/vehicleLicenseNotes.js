/**
 * Shared utilities for mapping between the VehicleAddForm's VehicleLicense-style
 * field names and the Vehicle entity's field names + serialized notes text.
 *
 * The Vehicle entity stores a subset of fields (plate_number, make, model, dates…)
 * plus a `notes` text blob.  The structured scan data (owner, chassis, engine, insurer…)
 * lives in a separate VehicleLicense entity AND is serialized into the Vehicle.notes
 * text as "Label: value" lines so VehicleLicenseInfo can render it on the detail page.
 */

// VehicleLicense form field name → notes text label
const FIELD_TO_LABEL = {
  placeOfIssue: 'Place of Issue',
  tcNo: 'TC No',
  plateCategory: 'Plate Category',
  regDate: 'Reg Date',
  ownerEnglish: 'Owner',
  ownerArabic: 'Owner (AR)',
  nationality: 'Nationality',
  insurer: 'Insurer',
  policyNo: 'Policy No',
  insuranceType: 'Insurance Type',
  mortgageBy: 'Mortgage By',
  numOfPassengers: 'Passengers',
  origin: 'Origin',
  vehicleColor: 'Color',
  vehicleCategory: 'Vehicle Category',
  vehicleType: 'Vehicle Type',
  gvw: 'GVW',
  emptyWeight: 'Empty Weight',
  engineNo: 'Engine No',
  chassisNo: 'Chassis No',
};

// notes text label → VehicleLicense form field name
const LABEL_TO_FIELD = Object.fromEntries(
  Object.entries(FIELD_TO_LABEL).map(([k, v]) => [v, k])
);

/** Serialize license form fields into "Label: value" text lines for Vehicle.notes. */
export function serializeLicenseNotes(form) {
  const lines = [];
  for (const [field, label] of Object.entries(FIELD_TO_LABEL)) {
    const val = form[field];
    if (val != null && String(val).trim()) {
      lines.push(`${label}: ${String(val).trim()}`);
    }
  }
  // Append free-form notes (from the Notes textarea) as a "Notes:" line
  if (form.notes && String(form.notes).trim()) {
    lines.push(`Notes: ${String(form.notes).replace(/\n/g, ' ').trim()}`);
  }
  return lines.join('\n');
}

/** Parse "Label: value" text lines back into a VehicleLicense-style form object. */
export function parseLicenseNotes(notes = '') {
  const out = {};
  notes.split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key === 'Notes') { out.notes = val; return; }
    const field = LABEL_TO_FIELD[key];
    if (field && val) out[field] = val;
  });
  return out;
}

/** Combine make + model into the single "model" field the form uses. */
function joinMakeModel(make, model) {
  return [make, model].filter(Boolean).join(' ').trim();
}

/** Split "make model" string → { make, model }. */
function splitMakeModel(modelRaw) {
  const trimmed = (modelRaw || '').trim();
  if (!trimmed) return { make: '', model: '' };
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) return { make: parts[0], model: parts.slice(1).join(' ') };
  return { make: trimmed, model: '' };
}

/**
 * Map a Vehicle entity record (+ optional VehicleLicense record) → VehicleAddForm state.
 * Used when opening the edit form for an existing vehicle.
 * Priority: VehicleLicense entity > parsed notes text > Vehicle entity fields.
 */
export function vehicleToLicenseForm(vehicle = {}, license = null) {
  const fromNotes = parseLicenseNotes(vehicle.notes || '');

  // Pull structured fields from the VehicleLicense record (source of truth)
  const licenseFields = {};
  if (license) {
    for (const key of Object.keys(FIELD_TO_LABEL)) {
      if (license[key] != null && String(license[key]).trim()) {
        licenseFields[key] = license[key];
      }
    }
    if (license.category) licenseFields.category = license.category;
  }

  return {
    // 1. Parsed notes text (lowest priority — for old vehicles without a VehicleLicense record)
    ...fromNotes,
    // 2. VehicleLicense entity data overrides parsed notes
    ...licenseFields,
    // 3. Vehicle entity fields mapped to form field names (highest priority for shared fields)
    trafficPlateNo: vehicle.plate_number || license?.trafficPlateNo || fromNotes.trafficPlateNo || '',
    expDate: vehicle.registration_expiry || license?.expDate || fromNotes.expDate || '',
    insExpDate: vehicle.insurance_expiry || license?.insExpDate || fromNotes.insExpDate || '',
    model: joinMakeModel(vehicle.make, vehicle.model) || license?.model || fromNotes.model || '',
    year: vehicle.year || '',
    assigned_driver: vehicle.assigned_driver || '',
    fuel_type: vehicle.fuel_type || 'diesel',
    status: vehicle.status || 'active',
    category: license?.category || fromNotes.category || 'Private',
    notes: fromNotes.notes || '',
  };
}

/** Map a VehicleLicense-style form object → Vehicle entity fields (with serialized notes). */
export function licenseFormToVehicle(form) {
  const { make, model } = splitMakeModel(form.model);
  return {
    plate_number: form.trafficPlateNo || '',
    make,
    model,
    year: form.year ? Number(form.year) : undefined,
    registration_expiry: form.expDate || '',
    insurance_expiry: form.insExpDate || '',
    assigned_driver: form.assigned_driver || '',
    fuel_type: form.fuel_type || 'diesel',
    status: form.status || 'active',
    notes: serializeLicenseNotes(form),
  };
}