import moment from 'moment';

/**
 * Normalize various date formats to ISO yyyy-MM-dd.
 * Handles: ISO (2026-07-30), dd-MM-yy (30-07-26), dd/MM/yyyy (30/07/2026),
 * dd-MM-yyyy (30-07-2026), and moment-parsable strings.
 * Returns the original string if it can't be normalized.
 */
export function normalizeDate(date) {
  if (!date) return '';
  const s = String(date).trim();
  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // dd-MM-yy or dd/MM/yy
  let m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/);
  if (m) {
    const [, dd, mm, yy] = m;
    const year = 2000 + parseInt(yy, 10);
    return `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  // dd-MM-yyyy or dd/MM/yyyy
  m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  // Fall back to moment parsing
  const parsed = moment(s);
  if (parsed.isValid()) return parsed.format('YYYY-MM-DD');
  return s;
}

export function formatCurrency(amount, currency = 'AED') {
  if (amount == null) return `${currency} 0.00`;
  return `${currency} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date) {
  if (!date) return '—';
  const normalized = normalizeDate(date);
  return moment(normalized).format('DD/MM/YYYY');
}

export function formatDateToLocal(date) {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
}

export function formatDateShort(date) {
  if (!date) return '—';
  return moment(date).format('DD/MM/YY');
}

export function formatNumber(num) {
  if (num == null) return '0';
  return Number(num).toLocaleString();
}

export function getStatusColor(status) {
  const colors = {
    scheduled: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    in_transit: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    delivered: 'bg-[#01B574]/15 text-[#01B574] border-[#01B574]/30',
    completed: 'bg-[#01B574]/15 text-[#01B574] border-[#01B574]/30',
    canceled: 'bg-red-500/15 text-red-400 border-red-500/20',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
    draft: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    sent: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    paid: 'bg-[#01B574]/15 text-[#01B574] border-[#01B574]/30',
    overdue: 'bg-red-500/15 text-red-400 border-red-500/20',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    approved: 'bg-[#01B574]/15 text-[#01B574] border-[#01B574]/30',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/20',
    active: 'bg-[#01B574]/15 text-[#01B574] border-[#01B574]/30',
    maintenance: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    inactive: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    on_leave: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    valid: 'bg-[#01B574]/15 text-[#01B574] border-[#01B574]/30',
    expiring_soon: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    expired: 'bg-red-500/15 text-red-400 border-red-500/20',
    in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    partial: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  };
  return colors[status] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20';
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getMonthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
}

export function getToday() {
  return new Date().toISOString().split('T')[0];
}