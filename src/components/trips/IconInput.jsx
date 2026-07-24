import { Input } from '@/components/ui/input';

export default function IconInput({ icon: Icon, className = '', ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />}
      <Input className={`${Icon ? 'pl-9' : ''} ${className}`} {...props} />
    </div>
  );
}