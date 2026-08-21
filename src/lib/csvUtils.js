// ─── Robust CSV utilities: parsing, delimiter detection, normalization ───

/**
 * Detect the most likely delimiter from the first non-empty line.
 */
export function detectDelimiter(text) {
  const clean = text.replace(/^\uFEFF/, '');
  const firstLine = clean.split(/\r?\n/).find((l) => l.trim()) || '';
  const counts = {
    ',': (firstLine.match(/,/g) || []).length,
    ';': (firstLine.match(/;/g) || []).length,
    '\t': (firstLine.match(/\t/g) || []).length,
    '|': (firstLine.match(/\|/g) || []).length,
  };
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : ',';
}

/**
 * Parse CSV text into a 2D array, properly handling quoted fields with
 * embedded commas, newlines, and escaped double-quotes.
 */
export function parseCsvRobust(text, delimiter) {
  text = text.replace(/^\uFEFF/, '');
  if (!delimiter) delimiter = detectDelimiter(text);

  const rows = [];
  let current = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        current.push(field);
        field = '';
      } else if (ch === '\n') {
        current.push(field);
        rows.push(current);
        current = [];
        field = '';
      } else if (ch === '\r') {
        // skip carriage return
      } else {
        field += ch;
      }
    }
  }
  if (field !== '' || current.length > 0) {
    current.push(field);
    rows.push(current);
  }
  // Drop fully-empty rows
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

/**
 * Parse CSV into { headers, rows } where rows is an array of objects keyed by header.
 */
export function parseCsvToObject(text, delimiter) {
  const raw = parseCsvRobust(text, delimiter);
  if (raw.length < 2) return { headers: [], rows: [] };
  const headers = raw[0].map((h) => h.trim());
  const rows = raw.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim(); });
    return obj;
  });
  return { headers, rows };
}

// ─── Normalization helpers ───

/**
 * Normalize various date formats to YYYY-MM-DD.
 * Handles: ISO, DD-MM-YYYY, DD/MM/YYYY, MM/DD/YYYY, Excel serials.
 */
export function normalizeDate(val) {
  if (!val && val !== 0) return '';
  val = String(val).trim();
  if (!val) return '';

  // Already ISO (YYYY-MM-DD or YYYY-MM-DDTHH:MM...)
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);

  // DD-MM-YYYY or DD.MM.YYYY (day-first, common outside US)
  let m = val.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  if (m) {
    const [_, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // MM/DD/YYYY (US) — only if first part > 12 would be impossible for day-first
  m = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) {
    let [_, p1, p2, y] = m;
    if (y.length === 2) y = '20' + y;
    // If first part > 12, it must be day-first
    if (Number(p1) > 12) {
      return `${y}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    }
    // Ambiguous — assume MM/DD (US format) since it uses slashes
    return `${y}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
  }

  // Excel serial date number
  if (/^\d{4,5}(\.\d+)?$/.test(val)) {
    const serial = parseFloat(val);
    if (serial > 30000 && serial < 80000) {
      const date = new Date((serial - 25569) * 86400 * 1000);
      if (!isNaN(date)) return date.toISOString().slice(0, 10);
    }
  }

  // Fallback: let JS Date try
  const parsed = new Date(val);
  if (!isNaN(parsed) && val.length >= 6) return parsed.toISOString().slice(0, 10);

  return val; // can't parse — return as-is
}

/**
 * Clean and parse a number from a messy string.
 * Handles: commas, currency symbols, spaces, parentheses (negative).
 */
export function normalizeNumber(val) {
  if (val === '' || val == null) return 0;
  const s = String(val).trim();
  if (!s) return 0;
  let negative = false;
  let cleaned = s
    .replace(/[AED$€£\s]/gi, '')
    .replace(/[()]/g, (m) => { if (m === '(') negative = true; return ''; });
  // If there's a leading minus, track it
  if (cleaned.startsWith('-')) { negative = true; cleaned = cleaned.slice(1); }
  cleaned = cleaned.replace(/,/g, '');
  // If both comma and dot, assume comma is thousands sep (e.g. "1.234,56" → "1234.56")
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  }
  const n = parseFloat(cleaned);
  if (isNaN(n)) return 0;
  return negative ? -Math.abs(n) : n;
}

// ─── Column auto-mapping ───

const normalizeHeader = (h) => String(h).toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Common aliases for each entity field.
 * Used to auto-map CSV headers to expected entity fields.
 */
export const FIELD_ALIASES = {
  date: ['date', 'txndate', 'transactiondate', 'valuedate', 'postingdate', 'dt', 'trxdate', 'businessdate', 'dated'],
  reference: ['reference', 'ref', 'refno', 'referencenumber', 'chequeno', 'chequenumber', 'transactionid', 'txnid', 'docno', 'documentno', 'slno'],
  description: ['description', 'desc', 'narration', 'details', 'memo', 'particulars', 'transactiondetails', 'remarks', 'note', 'notes', 'narrationdescription', 'transactiondescription'],
  deposit: ['deposit', 'credit', 'inflow', 'creditamount', 'amountcredit', 'incoming', 'received', 'creditamountaed', 'depositamount'],
  withdrawal: ['withdrawal', 'debit', 'outflow', 'debitamount', 'amountdebit', 'outgoing', 'paid', 'debitamountaed', 'withdrawalamount'],
  recipient: ['recipient', 'payee', 'beneficiary', 'counterparty', 'party', 'paidto', 'receivedfrom', 'to', 'from'],
  amount: ['amount', 'amt', 'value', 'transactionamount', 'amountaed'],
};

/**
 * Auto-map CSV headers to entity field keys.
 * Returns { fieldKey: columnIndex } for matched fields.
 */
export function autoMapColumns(csvHeaders, entityFields) {
  const mapping = {};
  const normalized = csvHeaders.map(normalizeHeader);
  const used = new Set();

  for (const field of entityFields) {
    const aliases = FIELD_ALIASES[field] || [normalizeHeader(field)];
    // Try exact alias match first
    for (let i = 0; i < normalized.length; i++) {
      if (used.has(i)) continue;
      if (aliases.includes(normalized[i])) {
        mapping[field] = i;
        used.add(i);
        break;
      }
    }
    if (mapping[field] !== undefined) continue;
    // Try contains match (header contains alias or vice versa)
    for (let i = 0; i < normalized.length; i++) {
      if (used.has(i)) continue;
      for (const alias of aliases) {
        if (normalized[i].includes(alias) || alias.includes(normalized[i])) {
          mapping[field] = i;
          used.add(i);
          break;
        }
      }
      if (mapping[field] !== undefined) break;
    }
  }
  return mapping;
}

/**
 * Validate a row against required fields and expected types.
 * Returns { valid: boolean, errors: string[] }.
 */
export function validateRow(row, fieldDefs) {
  const errors = [];
  for (const def of fieldDefs) {
    const val = row[def.key];
    if (def.required && (val === '' || val == null || val === undefined)) {
      errors.push(`${def.label} is required`);
    }
    if (def.type === 'number' && val !== '' && val != null) {
      const n = Number(val);
      if (isNaN(n)) errors.push(`${def.label} is not a valid number`);
    }
    if (def.type === 'date' && val) {
      if (!/^\d{4}-\d{2}-\d{2}/.test(val)) {
        errors.push(`${def.label} is not a valid date`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}