import { base44 } from '@/api/base44Client';

const VEHICLE_LICENSE_FIELDS = [
  'trafficPlateNo', 'placeOfIssue', 'tcNo', 'plateCategory',
  'ownerArabic', 'ownerEnglish', 'nationality',
  'expDate', 'regDate',
  'insurer', 'insExpDate', 'policyNo', 'insuranceType', 'mortgageBy',
  'model', 'numOfPassengers', 'origin', 'vehicleColor', 'vehicleCategory', 'vehicleType',
  'gvw', 'emptyWeight', 'engineNo', 'chassisNo',
  'category', 'notes'
];

const EXTRACTION_PROMPT = `You are an expert OCR + data extraction assistant specialized in UAE vehicle license documents (Mulkiya / vehicle registration card).

Analyze the uploaded document image/PDF and extract ALL of the following fields. The document may be in Arabic, English, or both (UAE vehicle licenses are bilingual). Return ONLY structured JSON — no prose, no markdown.

Field guide:
- trafficPlateNo: Traffic plate number (e.g. "12345" or Arabic plate)
- placeOfIssue: Place/Emirate of issue (e.g. "Dubai", "Abu Dhabi", "الإمارة")
- tcNo: Traffic Code number / TC number
- plateCategory: Plate category code (e.g. "P", "C", "T")
- ownerArabic: Owner name in Arabic
- ownerEnglish: Owner name in English
- nationality: Owner nationality
- expDate: License expiry date (ISO format YYYY-MM-DD if parseable, otherwise raw string)
- regDate: Registration date (ISO format YYYY-MM-DD if parseable, otherwise raw string)
- insurer: Insurance company name
- insExpDate: Insurance expiry date (ISO format YYYY-MM-DD if parseable, otherwise raw string)
- policyNo: Insurance policy number
- insuranceType: Type of insurance (e.g. "Comprehensive", "Third Party")
- mortgageBy: Mortgage/lien holder if any (e.g. bank name), empty if none
- model: Vehicle model (e.g. "Toyota Hilux")
- numOfPassengers: Number of passengers (as string)
- origin: Country of origin / manufacture
- vehicleColor: Vehicle color (Arabic + English if present)
- vehicleCategory: Vehicle category code from document
- vehicleType: Vehicle type (e.g. "Light Vehicle", "Heavy Vehicle")
- gvw: Gross Vehicle Weight (as string)
- emptyWeight: Empty vehicle weight (as string)
- engineNo: Engine number
- chassisNo: Chassis number
- category: One of "Private", "Commercial", "Truck", "Bus", "Taxi", "Other" — infer from vehicle type/plate category
- notes: Any additional notes visible on the document

Rules:
- If a field is not visible or unreadable, return empty string "".
- For dates, prefer ISO YYYY-MM-DD; if only day/month/year Arabic numerals are visible, convert.
- For category, map: private car → "Private", commercial vehicle → "Commercial", truck/lorry → "Truck", bus → "Bus", taxi → "Taxi", anything else → "Other".
- Do NOT invent data. Only extract what is visible on the document.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: VEHICLE_LICENSE_FIELDS.reduce((acc, f) => {
    acc[f] = { type: 'string' };
    return acc;
  }, {}),
  additionalProperties: false
};

export async function uploadAndExtractVehicleLicense(file) {
  // 1. Upload the file
  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  // 2. Invoke LLM with vision (file_urls) to extract structured data
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: EXTRACTION_PROMPT,
    file_urls: [file_url],
    response_json_schema: RESPONSE_SCHEMA,
    model: 'automatic'
  });

  // result is already a parsed object (response_json_schema was specified)
  const extracted = result && typeof result === 'object' ? result : {};
  const clean = {};
  VEHICLE_LICENSE_FIELDS.forEach((f) => {
    clean[f] = extracted[f] != null ? String(extracted[f]) : '';
  });
  return { file_url, data: clean };
}