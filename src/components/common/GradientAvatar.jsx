/**
 * GradientAvatar — gradient-ring avatar with initials fallback.
 * Used for drivers/clients without a profile picture.
 *
 * Props:
 *  - name: string (used for initials)
 *  - size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 *  - className: extra classes
 */
const SIZE_MAP = {
  xs: 'w-5 h-5 text-[8px]',
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
  xl: 'w-16 h-16 text-lg',
};

const initials = (name) =>
  (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function GradientAvatar({ name, size = 'md', className = '' }) {
  const sz = SIZE_MAP[size] || SIZE_MAP.md;
  return (
    <div
      className={`relative rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-600 p-0.5 flex-shrink-0 ${sz} ${className}`}
    >
      <div className="h-full w-full rounded-full bg-card flex items-center justify-center font-bold text-foreground">
        {initials(name)}
      </div>
    </div>
  );
}