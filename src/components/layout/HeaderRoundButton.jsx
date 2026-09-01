import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared round icon button used in the top header cluster.
 * forwardRef so it can be used as a Radix asChild trigger.
 */
const HeaderRoundButton = React.forwardRef(({ icon: Icon, label, onClick, active, className }, ref) => {
  return (
    <button
      type="button"
      ref={ref}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-full border border-border/50 text-muted-foreground transition-all duration-200 hover:text-foreground hover:border-primary/40 hover:bg-white/[0.05] flex-shrink-0',
        active && 'text-primary border-primary/40 bg-primary/10',
        className
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
});
HeaderRoundButton.displayName = 'HeaderRoundButton';

export default HeaderRoundButton;