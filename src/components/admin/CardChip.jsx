import { cn } from '@/lib/utils';

/**
 * Dark glassmorphic metadata pill chip used on entity cards.
 * Renders an icon + uppercase label + value, e.g. "TYPE / Truck".
 */
export default function CardChip({ icon: Icon, label, value, accent = '#3b82f6' }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md flex-shrink-0"
      title={`${label} / ${value || '—'}`}
    >
      {Icon && <Icon className="w-3 h-3 flex-shrink-0" style={{ color: accent }} />}
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70">{label}</span>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-foreground/90 truncate max-w-[70px]">
        {value || '—'}
      </span>
    </div>
  );
}