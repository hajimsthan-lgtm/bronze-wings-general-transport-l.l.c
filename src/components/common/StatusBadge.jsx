import { getStatusColor } from '@/lib/formatters';

export default function StatusBadge({ status, label }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border backdrop-blur-md ${getStatusColor(status)}`}>
      {label || status?.replace(/_/g, ' ')}
    </span>
  );
}