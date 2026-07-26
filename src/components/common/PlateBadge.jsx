import { cn } from '@/lib/utils';

/**
 * UAE Abu Dhabi commercial-style license plate: green emirate band + white plate body.
 */
export default function PlateBadge({ plate, holder, compact = false, className = '' }) {
  return (
    <div className={cn('relative rounded-lg overflow-hidden border border-white/20 shadow-md flex items-stretch', compact ? 'h-9 max-w-[180px]' : 'h-16 max-w-[230px]', className)}>
      {/* Green emirate band */}
      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-emerald-500 to-emerald-700 text-white px-1.5 py-0.5" style={{ minWidth: compact ? 30 : 46 }}>
        <span className="text-[7px] font-bold tracking-widest leading-none">UAE</span>
        {!compact && <span className="text-[11px] font-bold leading-tight mt-0.5" dir="rtl">أبوظبي</span>}
        {!compact && <span className="text-[7px] font-semibold tracking-wider leading-none mt-0.5">ABU DHABI</span>}
        {compact && <span className="text-[7px] font-semibold leading-none mt-0.5">AD</span>}
      </div>
      {/* White plate body */}
      <div className="relative flex-1 bg-white flex flex-col items-center justify-center px-2">
        <span className={cn('font-extrabold tracking-wider text-neutral-900 leading-none', compact ? 'text-xs' : 'text-2xl')} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>{plate || '—'}</span>
        {!compact && holder && <span className="text-[8px] text-neutral-500 mt-1 truncate max-w-full">{holder}</span>}
        {!compact && <span className="absolute top-1 right-2 text-[6px] font-bold tracking-[0.2em] text-emerald-700">COMMERCIAL</span>}
      </div>
      {/* glossy reflection */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 45%)' }} />
    </div>
  );
}