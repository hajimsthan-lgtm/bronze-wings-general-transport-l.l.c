import { Link } from 'react-router-dom';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CommandAlertsPanel({ alerts }) {
  if (!alerts?.length) return null;
  return (
    <div className="cmd-card animate-enter-up" style={{ animationDelay: '0.4s' }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg chip-red flex items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-semibold">Actionable Alerts</h3>
        <span className="ml-auto text-xs text-muted-foreground">{alerts.length} active</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {alerts.map((a, i) => {
          const Icon = a.icon;
          const isUrgent = a.severity === 'urgent';
          return (
            <Link key={i} to={a.link} className={cn(
              'flex items-center gap-3 p-3 rounded-xl border-l-[4px] transition-all hover:-translate-y-0.5 group',
              isUrgent
                ? 'bg-gradient-to-r from-rose-500/[0.14] to-rose-500/[0.06] border-rose-500 hover:from-rose-500/[0.20] hover:to-rose-500/[0.1] hover:shadow-[0_0_24px_-8px_rgba(244,63,94,0.5)]'
                : 'bg-gradient-to-r from-amber-500/[0.14] to-amber-500/[0.06] border-amber-500 hover:from-amber-500/[0.20] hover:to-amber-500/[0.1] hover:shadow-[0_0_24px_-8px_rgba(251,191,36,0.5)]'
            )}>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                isUrgent ? 'chip-red' : 'chip-amber'
              )}>
                <Icon className="w-4 h-4 text-white" />
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