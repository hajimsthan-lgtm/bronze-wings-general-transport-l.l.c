import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 bg-muted/40 border border-border">
        <Icon className="w-5 h-5 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      {description && <p className="text-xs text-muted-foreground/70 max-w-[280px] leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}