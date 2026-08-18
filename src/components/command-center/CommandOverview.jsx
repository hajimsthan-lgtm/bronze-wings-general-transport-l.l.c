import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CommandOverview({ stats }) {
  return (
    <div className="cmd-card animate-enter-up" style={{ animationDelay: '0.5s' }}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold">Overview</h3>
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 transition-colors">
          View all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const chipClass = s.chip || 'chip-blue';
          return (
            <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-foreground/[0.04] border border-border/30 hover:border-[rgba(0,242,195,0.25)] transition-colors">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', chipClass)}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold truncate">{s.label}</p>
                <p className="text-lg font-bold tabular-nums mt-0.5">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}