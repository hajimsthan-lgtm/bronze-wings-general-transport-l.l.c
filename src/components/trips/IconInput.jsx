import { Input } from '@/components/ui/input';

export default function IconInput({ icon: Icon, className = '', list, onKeyDown, ...props }) {
  // Native <datalist> reverts the input value on Escape. Intercept it:
  // prevent the default revert and blur to close the dropdown cleanly.
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && list) {
      e.preventDefault();
      e.target.blur();
    }
    onKeyDown?.(e);
  };

  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 pointer-events-none" />}
      <Input className={`${Icon ? 'pl-9' : ''} ${className}`} list={list} onKeyDown={handleKeyDown} {...props} />
    </div>
  );
}