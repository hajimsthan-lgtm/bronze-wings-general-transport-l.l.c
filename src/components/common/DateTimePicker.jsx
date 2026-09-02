import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────
   Minimal native DateTimePicker.
   Uses the browser's built-in date / datetime-local input — no
   masked overlay, no custom popover, no segment cells.

   External API preserved:
     • datetime mode → value is "YYYY-MM-DDTHH:mm" (24h)
     • date mode     → value is "YYYY-MM-DDTHH:mm" (DatePicker strips T)
   ───────────────────────────────────────────────────────────── */

export default function DateTimePicker({
  value, onChange, mode = 'datetime', disabled, className,
  placeholder: _placeholder, required, id, name,
}) {
  const handleChange = (e) => {
    const v = e.target.value;
    if (!v) return onChange('');
    // native date → "YYYY-MM-DD", native datetime-local → "YYYY-MM-DDTHH:mm"
    onChange(mode === 'date' ? `${v}T00:00` : v);
  };

  // Convert internal canonical → native input value
  const nativeValue = !value ? '' : mode === 'date' ? value.split('T')[0] : value;

  return (
    <Input
      type={mode === 'date' ? 'date' : 'datetime-local'}
      value={nativeValue}
      onChange={handleChange}
      disabled={disabled}
      id={id}
      name={name}
      required={required}
      className={cn('date-input-clean', className)}
    />
  );
}