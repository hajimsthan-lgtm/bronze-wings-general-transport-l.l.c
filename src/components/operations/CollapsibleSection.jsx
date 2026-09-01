import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Collapsible section with a blue-accent header bar.
 * Default state: collapsed.
 * When collapsed, the header has a subtle shine sweep animation.
 */
export default function CollapsibleSection({
  icon: Icon,
  label,
  count,
  accent = 'blue',
  defaultCollapsed = true,
  children,
  rightSlot,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const ACCENTS = {
    blue: {
      icon: 'text-blue-400',
      label: 'text-blue-400',
      count: 'text-blue-500',
      chevron: 'text-blue-400',
      bar: 'bg-blue-500/[0.06] hover:bg-blue-500/[0.10]',
      edge: 'bg-blue-500',
      edgeShadow: 'shadow-[0_0_10px_rgba(59,130,246,0.6)]',
      shineFrom: 'from-blue-400/0',
      shineVia: 'via-blue-400/25',
      shineTo: 'to-blue-400/0',
    },
    violet: {
      icon: 'text-violet-400',
      label: 'text-violet-400',
      count: 'text-violet-500',
      chevron: 'text-violet-400',
      bar: 'bg-violet-500/[0.06] hover:bg-violet-500/[0.10]',
      edge: 'bg-violet-500',
      edgeShadow: 'shadow-[0_0_10px_rgba(168,85,247,0.6)]',
      shineFrom: 'from-violet-400/0',
      shineVia: 'via-violet-400/25',
      shineTo: 'to-violet-400/0',
    },
    amber: {
      icon: 'text-amber-400',
      label: 'text-amber-400',
      count: 'text-amber-500',
      chevron: 'text-amber-400',
      bar: 'bg-amber-500/[0.06] hover:bg-amber-500/[0.10]',
      edge: 'bg-amber-500',
      edgeShadow: 'shadow-[0_0_10px_rgba(245,158,11,0.6)]',
      shineFrom: 'from-amber-400/0',
      shineVia: 'via-amber-400/25',
      shineTo: 'to-amber-400/0',
    },
  };
  const a = ACCENTS[accent] || ACCENTS.blue;

  return (
    <div className="edge-panel pane-edge-neon rounded-xl overflow-hidden">
      {/* Collapsible header bar */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className={cn(
          'group relative w-full px-4 py-2.5 border-b border-border/50 flex items-center gap-2 transition-colors overflow-hidden',
          a.bar,
          collapsed && 'border-b-0'
        )}
      >
        {/* Left edge cursor sensor — lights up on hover */}
        <span
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 opacity-0 group-hover:opacity-100',
            a.edge, a.edgeShadow
          )}
        />

        {/* Shine sweep — only when collapsed */}
        {collapsed && (
          <span
            className={cn(
              'pointer-events-none absolute inset-0 bg-gradient-to-r opacity-60',
              a.shineFrom, a.shineVia, a.shineTo,
            )}
            style={{
              backgroundSize: '200% 100%',
              animation: 'collapse-shine 3s linear infinite',
            }}
          />
        )}

        {Icon && <Icon className={cn('w-3.5 h-3.5 relative z-10', a.icon)} />}
        <span className={cn('text-xs font-bold uppercase tracking-widest relative z-10', a.label)}>
          {label}
        </span>
        <span className={cn('text-[10px] relative z-10', a.count)}>
          {count} record{count !== 1 ? 's' : ''}
        </span>

        {rightSlot && <span className="relative z-10 ml-2">{rightSlot}</span>}

        <span className="ml-auto relative z-10">
          {collapsed
            ? <ChevronDown className={cn('w-4 h-4', a.chevron)} />
            : <ChevronUp className={cn('w-4 h-4', a.chevron)} />}
        </span>
      </button>

      {/* Expandable content */}
      {!collapsed && (
        <div className="animate-fade-in-up">
          {children}
        </div>
      )}
    </div>
  );
}