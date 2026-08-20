import { base44 } from '@/api/base44Client';

const DRIVER_LICENSE_FIELDS = [
  'name', 'nameArabic', 'licenseNumber', 'licenseExpiry',
  'nationality', 'dateOfBirth', 'placeOfIssue', 'licenseType',
  'bloodGroup', 'address', 'gender',
];

const EXTRACTION_PROMPT = `You are an expert OCR + data extraction assistant specialized in UAE driving license documents.

Analyze the uploaded document image/PDF and extract ALL of the following fields. The document may be in Arabic, English, or both (UAE driving licenses are bilingual). Return ONLY structured JSON — no prose, no markdown.

Field guide:
- name: Full name in English as printed on the license
- nameArabic: Full name in Arabic as printed on the license
- licenseNumber: Driving license number
- licenseExpiry: License expiry date (ISO format YYYY-MM-DD if parseable, otherwise raw string)
- nationality: Nationality as printed
- dateOfBirth: Date of birth (ISO format YYYY-MM-DD if parseable, otherwise raw string)
- placeOfIssue: Place/Emirate of issue (e.g. "Dubai", "Abu Dhabi")
- licenseType: Type/category of license (e.g. "Light Vehicle", "Heavy Vehicle", "Motorcycle")
- bloodGroup: Blood group if visible
- address: Address if printed on the license
- gender: Gender if visible

Rules:
- If a field is not visible or unreadable, return empty string "".
- For dates, prefer ISO YYYY-MM-DD; if only day/month/year Arabic numerals are visible, convert.
- Do NOT invent data. Only extract what is visible on the document.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: DRIVER_LICENSE_FIELDS.reduce((acc, f) => {
    acc[f] = { type: 'string' };
    return acc;
  }, {}),
  additionalProperties: false
};

export async function uploadAndExtractDriverLicense(file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: EXTRACTION_PROMPT,
    file_urls: [file_url],
    response_json_schema: RESPONSE_SCHEMA,
    model: 'automatic'
  });

  const extracted = result && typeof result === 'object' ? result : {};
  const clean = {};
  DRIVER_LICENSE_FIELDS.forEach((f) => {
    clean[f] = extracted[f] != null ? String(extracted[f]) : '';
  });
  return { file_url, data: clean };
}