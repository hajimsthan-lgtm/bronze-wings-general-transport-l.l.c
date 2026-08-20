import { base44 } from '@/api/base44Client';

const TRADE_LICENSE_FIELDS = [
  'companyName', 'companyNameArabic', 'trn', 'licenseNumber',
  'legalType', 'issueDate', 'expiryDate', 'address',
  'phone', 'email', 'poBox', 'activities',
];

const EXTRACTION_PROMPT = `You are an expert OCR + data extraction assistant specialized in UAE Trade License documents.

Analyze the uploaded document image/PDF and extract ALL of the following fields. The document may be in Arabic, English, or both (UAE trade licenses are bilingual). Return ONLY structured JSON — no prose, no markdown.

Field guide:
- companyName: Trade name / company name in English
- companyNameArabic: Trade name in Arabic if present
- trn: Tax Registration Number (TRN) — 15-digit number
- licenseNumber: Trade license number
- legalType: Legal form (e.g. "LLC", "FZE", "FZ-LLC", "DMCC", "Private Company")
- issueDate: Issue date (ISO format YYYY-MM-DD if parseable, otherwise raw string)
- expiryDate: Expiry date (ISO format YYYY-MM-DD if parseable, otherwise raw string)
- address: Business address as printed
- phone: Phone number if printed
- email: Email address if printed
- poBox: PO Box number if printed
- activities: Business activities description (may be long text)

Rules:
- If a field is not visible or unreadable, return empty string "".
- For dates, prefer ISO YYYY-MM-DD; if only day/month/year Arabic numerals are visible, convert.
- Do NOT invent data. Only extract what is visible on the document.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: TRADE_LICENSE_FIELDS.reduce((acc, f) => {
    acc[f] = { type: 'string' };
    return acc;
  }, {}),
  additionalProperties: false
};

export async function uploadAndExtractTradeLicense(file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: EXTRACTION_PROMPT,
    file_urls: [file_url],
    response_json_schema: RESPONSE_SCHEMA,
    model: 'automatic'
  });

  const extracted = result && typeof result === 'object' ? result : {};
  const clean = {};
  TRADE_LICENSE_FIELDS.forEach((f) => {
    clean[f] = extracted[f] != null ? String(extracted[f]) : '';
  });
  return { file_url, data: clean };
}