/**
 * Truncate a driver name to the first two words (first + second name only).
 * "HARMANPREET SINGH SARWAN SINGH" → "HARMANPREET SINGH"
 * Preserves original casing.
 */
export function shortDriverName(name) {
  if (!name) return '';
  const parts = String(name).trim().split(/\s+/);
  return parts.slice(0, 2).join(' ');
}