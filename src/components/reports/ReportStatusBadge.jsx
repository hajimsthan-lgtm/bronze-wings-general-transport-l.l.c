import { hexToRgba } from './ReportStatCard';

const MAP = {
  paid: '#22c55e', completed: '#22c55e', approved: '#22c55e', active: '#22c55e',
  pending: '#f97316',
  partially_paid: '#f59e0b', partial: '#f59e0b', in_transit: '#f59e0b',
  sent: '#1ED760', scheduled: '#94a3b8',
  draft: '#e2e8f0',
  cancelled: '#ef4444', canceled: '#ef4444', rejected: '#ef4444', overdue: '#ef4444',
};

export default function ReportStatusBadge({ status, className = '' }) {
  const c = MAP[status] || '#94a3b8';
  const label = (status || '').replace(/_/g, ' ');
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${className}`}
      style={{
        background: hexToRgba(c, 0.12),
        border: `1px solid ${hexToRgba(c, 0.20)}`,
        color: c === '#e2e8f0' ? 'rgba(255,255,255,0.5)' : c,
      }}
    >
      {label}
    </span>
  );
}