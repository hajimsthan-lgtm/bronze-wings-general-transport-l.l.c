import { Input } from '@/components/ui/input';

export default function IconInput({ icon: Icon, className = '', list, onKeyDown, ...props }) {
  // Native <datalist> reverts the input value on Escape and the event can
  // bubble to the Radix Dialog causing focus-management side effects that
  // reset form state. Intercept: prevent default, stop propagation, blur,
  // and restore the value if the browser reverted it despite preventDefault.
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && list) {
      const savedValue = e.target.value;
      e.preventDefault();
      e.stopPropagation();
      e.target.blur();
      // Some browsers revert the value on Escape even with preventDefault.
      // Restore it on the next frame and re-dispatch so React state stays in sync.
      requestAnimationFrame(() => {
        if (e.target.value !== savedValue) {
          e.target.value = savedValue;
          e.target.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
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