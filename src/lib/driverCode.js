import { base44 } from '@/api/base44Client';

export function formatDriverCode(n) {
  return `DR-${String(n).padStart(4, '0')}`;
}

function parseCodeNum(code) {
  const m = /DR-(\d+)/i.exec(code || '');
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * Returns the next auto-incremented driver code (e.g. DR-0007)
 * by scanning existing driver_code values across all drivers.
 */
export async function nextDriverCode() {
  try {
    const drivers = await base44.entities.Driver.list('-created_date', 500);
    let max = 0;
    for (const d of drivers) {
      const n = parseCodeNum(d.driver_code);
      if (n > max) max = n;
    }
    return formatDriverCode(max + 1);
  } catch {
    return formatDriverCode(1);
  }
}