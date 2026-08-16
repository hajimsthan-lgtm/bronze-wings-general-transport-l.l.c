import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[120px] py-6 px-4 text-center ${className}`}>
      <Icon className="w-8 h-8 text-muted-foreground/30 mb-2.5" />
      <p className="text-[13px] text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground/60 mt-1 max-w-[280px] leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}