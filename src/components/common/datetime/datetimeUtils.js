import { isValid } from 'date-fns';

export const pad2 = (n) => String(n).padStart(2, '0');

export const DATE_SEGS = [
  { key: 'day', len: 2, ph: 'D', kind: 'num', label: 'Day' },
  { key: 'month', len: 2, ph: 'M', kind: 'num', label: 'Month' },
  { key: 'year', len: 4, ph: 'Y', kind: 'num', label: 'Year' },
];
export const DATE_SEPS = ['-', '-'];

export const TIME_SEGS = [
  { key: 'hour', len: 2, ph: 'H', kind: 'hour', label: 'Hour' },
  { key: 'minute', len: 2, ph: 'M', kind: 'num', label: 'Minute' },
  { key: 'meridiem', len: 2, ph: ['A', 'M'], kind: 'ampm', label: 'AM/PM' },
];
export const TIME_SEPS = [':', ' '];

export function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isValid(d) ? d : null;
}

export function toCanonical(d, mode) {
  if (!d || !isValid(d)) return '';
  const datePart = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  return mode === 'date' ? datePart : `${datePart}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function fromDateRaw(value) {
  const d = toDate(value);
  if (!d) return {};
  return { day: pad2(d.getDate()), month: pad2(d.getMonth() + 1), year: String(d.getFullYear()) };
}

export function fromTimeRaw(value) {
  const d = toDate(value);
  if (!d) return {};
  const h24 = d.getHours();
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour: pad2(h12), minute: pad2(d.getMinutes()), meridiem: h24 >= 12 ? 'PM' : 'AM' };
}

export function buildChars(raw, segs, seps) {
  const chars = [];
  segs.forEach((seg, i) => {
    const val = raw[seg.key] || '';
    for (let s = 0; s < seg.len; s++) {
      if (s < val.length) chars.push({ ch: val[s], typed: true });
      else if (Array.isArray(seg.ph)) chars.push({ ch: seg.ph[s], typed: false });
      else chars.push({ ch: seg.ph, typed: false });
    }
    if (i < segs.length - 1) chars.push({ ch: seps[i], typed: null });
  });
  return chars;
}

export function buildSentinel(raw, segs, seps) {
  return buildChars(raw, segs, seps).map((c) => (c.typed === null ? c.ch : c.typed ? c.ch : ' ')).join('');
}

export function segValid(seg, val) {
  if (!val || val.length < seg.len) return false;
  if (seg.kind === 'ampm') return val === 'AM' || val === 'PM';
  const n = parseInt(val, 10);
  if (seg.key === 'day') return n >= 1 && n <= 31;
  if (seg.key === 'month') return n >= 1 && n <= 12;
  if (seg.key === 'hour') return n >= 1 && n <= 12;
  if (seg.key === 'minute') return n >= 0 && n <= 59;
  if (seg.key === 'year') return val.length === 4 && n > 0;
  return true;
}

export function isComplete(raw, segs) {
  return segs.every((s) => (raw[s.key] || '').length >= s.len);
}

export function dateRawToDate(raw) {
  if (!isComplete(raw, DATE_SEGS)) return null;
  const day = parseInt(raw.day, 10);
  const month = parseInt(raw.month, 10);
  const year = parseInt(raw.year, 10);
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return isValid(d) ? d : null;
}

export function applyDate(value, dateRaw, mode) {
  const d = dateRawToDate(dateRaw);
  if (!d) return null;
  if (mode === 'date') return toCanonical(d, 'date');
  const ex = toDate(value);
  d.setHours(ex ? ex.getHours() : 0, ex ? ex.getMinutes() : 0, 0, 0);
  return toCanonical(d, 'datetime');
}

export function applyTime(value, timeRaw) {
  if (!isComplete(timeRaw, TIME_SEGS)) return null;
  const h12 = parseInt(timeRaw.hour, 10);
  const min = parseInt(timeRaw.minute, 10);
  const h24 = timeRaw.meridiem === 'PM' ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
  const ex = toDate(value) || new Date();
  const d = new Date(ex);
  d.setHours(h24, min, 0, 0);
  return toCanonical(d, 'datetime');
}

export function applyTime24(value, hhmm24) {
  if (!hhmm24) return null;
  const [h, m] = hhmm24.split(':').map(Number);
  const ex = toDate(value) || new Date();
  const d = new Date(ex);
  d.setHours(h, m, 0, 0);
  return toCanonical(d, 'datetime');
}

export function timeStr24(value) {
  const d = toDate(value);
  if (!d) return '00:00';
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}