import { base44 } from '@/api/base44Client';

const EID_FIELDS = ['name', 'nameArabic', 'idNumber', 'dateOfBirth', 'nationality', 'expiryDate', 'gender'];

const EXTRACTION_PROMPT = `You are an expert OCR + data extraction assistant specialized in UAE Emirates ID (National ID) cards.

Analyze the uploaded document image/PDF and extract the following fields. The document may be in Arabic, English, or both (Emirates ID is bilingual). Return ONLY structured JSON — no prose, no markdown.

Field guide:
- name: Full name in English as printed on the card
- nameArabic: Full name in Arabic as printed on the card
- idNumber: Emirates ID number (the 15-digit number starting with 784 for UAE)
- dateOfBirth: Date of birth (ISO YYYY-MM-DD if parseable, otherwise raw string)
- nationality: Nationality as printed
- expiryDate: ID card expiry date (ISO YYYY-MM-DD if parseable, otherwise raw string)
- gender: Gender if visible

Rules:
- If a field is not visible or unreadable, return empty string "".
- The Emirates ID number is 15 digits. Extract exactly as printed.
- For dates, prefer ISO YYYY-MM-DD.
- Do NOT invent data. Only extract what is visible on the document.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: EID_FIELDS.reduce((acc, f) => { acc[f] = { type: 'string' }; return acc; }, {}),
  additionalProperties: false
};

export async function uploadAndExtractEmiratesId(file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: EXTRACTION_PROMPT,
    file_urls: [file_url],
    response_json_schema: RESPONSE_SCHEMA,
    model: 'automatic'
  });

  const extracted = result && typeof result === 'object' ? result : {};
  const clean = {};
  EID_FIELDS.forEach((f) => { clean[f] = extracted[f] != null ? String(extracted[f]) : ''; });
  return { file_url, data: clean };
}