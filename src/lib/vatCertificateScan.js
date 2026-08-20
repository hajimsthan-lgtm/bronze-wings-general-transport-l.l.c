import { base44 } from '@/api/base44Client';

const VAT_FIELDS = ['trn', 'companyName', 'companyNameArabic', 'registrationDate', 'status'];

const EXTRACTION_PROMPT = `You are an expert OCR + data extraction assistant specialized in UAE VAT Registration Certificate documents (Tax Registration Certificate).

Analyze the uploaded document image/PDF and extract the following fields. The document may be in Arabic, English, or both. Return ONLY structured JSON — no prose, no markdown.

Field guide:
- trn: Tax Registration Number — the 15-digit TRN (e.g. 100123456700003). This is the MOST important field.
- companyName: Company/trade name in English as printed on the certificate
- companyNameArabic: Company name in Arabic if present
- registrationDate: Date of VAT registration (ISO YYYY-MM-DD if parseable, otherwise raw string)
- status: Status shown on certificate (e.g. "Active", "Registered")

Rules:
- If a field is not visible or unreadable, return empty string "".
- The TRN is always 15 digits. Extract exactly as printed.
- Do NOT invent data. Only extract what is visible on the document.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: VAT_FIELDS.reduce((acc, f) => { acc[f] = { type: 'string' }; return acc; }, {}),
  additionalProperties: false
};

export async function uploadAndExtractVatCertificate(file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: EXTRACTION_PROMPT,
    file_urls: [file_url],
    response_json_schema: RESPONSE_SCHEMA,
    model: 'automatic'
  });

  const extracted = result && typeof result === 'object' ? result : {};
  const clean = {};
  VAT_FIELDS.forEach((f) => { clean[f] = extracted[f] != null ? String(extracted[f]) : ''; });
  return { file_url, data: clean };
}