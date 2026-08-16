import { hexToRgba } from '@/components/reports/ReportStatCard';

export default function IconChip({ icon: Icon, accent = '#0A84FF', size = 32, className = '' }) {
  const isHex = accent.startsWith('#');
  const dim = size === 24 ? 'w-6 h-6' : 'w-8 h-8';
  const iconDim = size === 24 ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const bg = isHex
    ? `linear-gradient(135deg, ${hexToRgba(accent, 0.14)}, ${hexToRgba(accent, 0.08)})`
    : `linear-gradient(135deg, hsl(var(--primary) / 0.14), hsl(var(--primary) / 0.08))`;
  const border = isHex ? `1px solid ${hexToRgba(accent, 0.25)}` : '1px solid hsl(var(--primary) / 0.25)';
  const color = isHex ? accent : 'hsl(var(--primary))';

  return (
    <div className={`${dim} rounded-xl flex items-center justify-center flex-shrink-0 ${className}`} style={{ background: bg, border }}>
      {Icon && <Icon className={iconDim} style={{ color }} />}
    </div>
  );
}