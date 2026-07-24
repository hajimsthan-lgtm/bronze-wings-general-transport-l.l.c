import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <h3 className="text-sm font-semibold text-foreground mb-1 font-display">{title}</h3>
      {description && <p className="text-xs text-muted-foreground text-center max-w-[300px] leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}