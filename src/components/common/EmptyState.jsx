import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[180px] py-10 px-6 text-center ${className}`}>
      <div className="empty-orb-icon w-16 h-16 rounded-full flex items-center justify-center mb-4 relative">
        <Icon className="w-7 h-7 text-primary/70" strokeWidth={1.5} />
      </div>
      <p className="text-sm font-semibold text-foreground/90 mb-1.5">{title}</p>
      {description && <p className="text-xs text-muted-foreground/70 max-w-[280px] leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}