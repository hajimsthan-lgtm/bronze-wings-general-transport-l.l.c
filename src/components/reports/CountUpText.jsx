import { useCountUp } from './ReportStatCard';
import { formatCurrency } from '@/lib/formatters';

export default function CountUpText({ value, format = formatCurrency, className = '' }) {
  const v = useCountUp(value);
  return <span className={className}>{format(v)}</span>;
}