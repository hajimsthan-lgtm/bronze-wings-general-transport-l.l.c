import { cn } from '@/lib/utils';

/**
 * Extracts the category code from a UAE plate number string.
 * Plate format: "1/ 99588" or "2/97372" → category code is the part before "/".
 */
function parsePlateCategory(plate) {
  if (!plate) return '';
  const idx = plate.indexOf('/');
  if (idx === -1) return '';
  return plate.slice(0, idx).trim();
}

/**
 * UAE Abu Dhabi commercial license plate: cyan/teal emirate header + white plate body.
 * Top band: category label (left) + category code (center) + emirate label (right).
 * Bottom body: the plate number only, large and bold.
 */
export default function PlateBadge({ plate, holder, compact = false, className = '' }) {
  const categoryCode = parsePlateCategory(plate);
  return (
    <div
      className={cn(
        'relative rounded-md overflow-hidden border-2 border-neutral-900 shadow-md flex flex-col bg-white',
        compact ? 'h-9 w-[150px]' : 'h-16 w-[220px]',
        className
      )}
    >
      {/* Cyan emirate header band */}
      <div className="relative flex items-center justify-between bg-[#20B2AA] px-1.5 gap-1" style={{ height: compact ? 12 : 20 }}>
        {/* Left: Arabic "Public" + TRP */}
        <div className="flex flex-col items-center leading-none">
          <span className="text-black font-bold" style={{ fontSize: compact ? 7 : 9 }} dir="rtl">عمومي</span>
          <span className="text-black font-semibold tracking-wide" style={{ fontSize: compact ? 5 : 6 }}>TRP.</span>
        </div>
        {/* Center: plate category code (extracted from plate number) */}
        {categoryCode && (
          <span className="text-black font-bold leading-none" style={{ fontSize: compact ? 8 : 11 }}>{categoryCode}</span>
        )}
        {/* Right: Arabic "Abu Dhabi" + A.D */}
        <div className="flex flex-col items-center leading-none">
          <span className="text-black font-bold" style={{ fontSize: compact ? 7 : 9 }} dir="rtl">أبوظبي</span>
          <span className="text-black font-semibold tracking-wide" style={{ fontSize: compact ? 5 : 6 }}>A.D</span>
        </div>
        {/* Corner bolts */}
        <span className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-neutral-700" />
        <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-neutral-700" />
      </div>

      {/* White plate body with number */}
      <div className="relative flex-1 bg-white flex flex-col items-center justify-center px-2">
        <span
          className="font-extrabold tracking-wider text-black leading-none"
          style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: compact ? 14 : 26 }}
        >
          {plate || '—'}
        </span>
        {!compact && holder && (
          <span className="text-[8px] text-neutral-500 mt-0.5 truncate max-w-full">{holder}</span>
        )}
      </div>

      {/* glossy reflection */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 40%)' }}
      />
    </div>
  );
}