import { useNavigate } from 'react-router-dom';
import { X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CommandAlertBanner({ alerts, onDismiss }) {
  const navigate = useNavigate();
  if (!alerts?.length) return null;
  const alert = alerts[0];
  const Icon = alert.icon;
  const isUrgent = alert.severity === 'urgent';

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-2xl border-l-4 animate-enter-up',
      isUrgent ? 'bg-rose-500/[0.08] border-rose-500 shadow-[0_0_24px_-8px_rgba(244,63,94,0.4)]' : 'bg-amber-500/[0.08] border-amber-500 shadow-[0_0_24px_-8px_rgba(251,191,36,0.4)]'
    )}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
        isUrgent ? 'bg-rose-500/20 border border-rose-500/40' : 'bg-amber-500/20 border border-amber-500/40'
      )}>
        <Icon className={cn('w-4 h-4', isUrgent ? 'text-rose-400' : 'text-amber-400')} />
      </div>
      <p className="text-sm flex-1">
        <span className={cn('font-semibold', isUrgent ? 'text-red-400' : 'text-amber-400')}>{isUrgent ? 'Urgent: ' : 'Warning: '}</span>
        <span className="text-foreground">{alert.message}</span>
      </p>
      <button onClick={() => navigate(alert.link)} className={cn(
        'text-xs font-semibold px-3 py-1.5 rounded-full transition-colors inline-flex items-center gap-1',
        isUrgent ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25' : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
      )}>
        View <ChevronRight className="w-3 h-3" />
      </button>
      <button onClick={onDismiss} className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}