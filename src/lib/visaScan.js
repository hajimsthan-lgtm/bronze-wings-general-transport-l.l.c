import { base44 } from '@/api/base44Client';

const VISA_FIELDS = ['name', 'nameArabic', 'visaNumber', 'visaExpiry', 'visaType', 'sponsor', 'nationality', 'passportNumber'];

const EXTRACTION_PROMPT = `You are an expert OCR + data extraction assistant specialized in UAE visa / residence visa documents.

Analyze the uploaded document image/PDF and extract the following fields. The document may be in Arabic, English, or both. Return ONLY structured JSON — no prose, no markdown.

Field guide:
- name: Full name in English as printed on the visa
- nameArabic: Full name in Arabic if present
- visaNumber: Visa / permit number
- visaExpiry: Visa expiry date (ISO YYYY-MM-DD if parseable, otherwise raw string)
- visaType: Type of visa (e.g. "Employment", "Residence", "Visit")
- sponsor: Sponsor company or person name
- nationality: Nationality as printed
- passportNumber: Passport number if visible

Rules:
- If a field is not visible or unreadable, return empty string "".
- For dates, prefer ISO YYYY-MM-DD.
- Do NOT invent data. Only extract what is visible on the document.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: VISA_FIELDS.reduce((acc, f) => { acc[f] = { type: 'string' }; return acc; }, {}),
  additionalProperties: false
};

export async function uploadAndExtractVisa(file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: EXTRACTION_PROMPT,
    file_urls: [file_url],
    response_json_schema: RESPONSE_SCHEMA,
    model: 'automatic'
  });

  const extracted = result && typeof result === 'object' ? result : {};
  const clean = {};
  VISA_FIELDS.forEach((f) => { clean[f] = extracted[f] != null ? String(extracted[f]) : ''; });
  return { file_url, data: clean };
}