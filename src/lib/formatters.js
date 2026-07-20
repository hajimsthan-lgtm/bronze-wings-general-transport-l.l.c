import moment from 'moment';

export function formatCurrency(amount, currency = 'AED') {
  if (amount == null) return `${currency} 0.00`;
  return `${currency} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date) {
  if (!date) return '—';
  return moment(date).format('DD/MM/YYYY');
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
    delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    canceled: 'bg-red-500/15 text-red-400 border-red-500/20',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
    draft: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    sent: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    overdue: 'bg-red-500/15 text-red-400 border-red-500/20',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/20',
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    maintenance: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    inactive: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
    on_leave: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    valid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    expiring_soon: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    expired: 'bg-red-500/15 text-red-400 border-red-500/20',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
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