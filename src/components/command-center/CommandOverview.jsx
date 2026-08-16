import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

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
          return (
            <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-foreground/[0.03]">
              <div className="w-10 h-10 rounded-xl bg-foreground/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-muted-foreground" />
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