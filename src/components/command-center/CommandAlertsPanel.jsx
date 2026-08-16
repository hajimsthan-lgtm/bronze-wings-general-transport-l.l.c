import { Link } from 'react-router-dom';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CommandAlertsPanel({ alerts }) {
  if (!alerts?.length) return null;
  return (
    <div className="cmd-card animate-enter-up" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold">Actionable Alerts</h3>
        <span className="ml-auto text-xs text-muted-foreground">{alerts.length} active</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {alerts.map((a, i) => {
          const Icon = a.icon;
          const isUrgent = a.severity === 'urgent';
          return (
            <Link key={i} to={a.link} className={cn(
              'flex items-center gap-3 p-3 rounded-xl border-l-[3px] transition-all hover:-translate-y-0.5 group',
              isUrgent ? 'bg-red-500/[0.06] border-red-500 hover:bg-red-500/[0.1]' : 'bg-amber-500/[0.06] border-amber-500 hover:bg-amber-500/[0.1]'
            )}>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                isUrgent ? 'bg-red-500/15' : 'bg-amber-500/15'
              )}>
                <Icon className={cn('w-4 h-4', isUrgent ? 'text-red-400' : 'text-amber-400')} />
              </div>
              <span className="text-sm text-foreground flex-1">{a.message}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}