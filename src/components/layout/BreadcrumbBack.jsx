import { useNavigate } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BreadcrumbBack({ disabled }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => !disabled && navigate(-1)}
      disabled={disabled}
      aria-label="Go back"
      title="Go back"
      className={cn(
        'group hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-full border transition-all duration-300 flex-shrink-0',
        disabled
          ? 'opacity-40 cursor-not-allowed border-transparent bg-transparent'
          : 'border-border/60 bg-muted/30 hover:bg-muted/50 hover:border-[rgba(var(--panel-accent-rgb),0.35)] active:scale-95'
      )}
    >
      <Home className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
      <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
      <span className="text-xs font-medium text-muted-foreground">Apps</span>
      <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
      <span className="text-xs font-bold text-foreground">BWGT</span>
    </button>
  );
}