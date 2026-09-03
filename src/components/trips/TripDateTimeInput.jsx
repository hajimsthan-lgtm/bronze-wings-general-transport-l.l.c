import { useState, useEffect, useRef } from 'react';
import { CalendarClock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Text-based datetime input that displays MM-DD-YYYY HH:mm format.
 * Internal value remains "YYYY-MM-DDTHH:mm" (same as DateTimePicker).
 * Auto-formats as the user types: digits → MM-DD-YYYY HH:mm.
 */
export default function TripDateTimeInput({ value, onChange, placeholder, className, disabled }) {
  const [display, setDisplay] = useState('');
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  // Convert internal "YYYY-MM-DDTHH:mm" → display "MM-DD-YYYY HH:mm"
  const toDisplay = (v) => {
    if (!v) return '';
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return '';
    return `${m[2]}-${m[3]}-${m[1]} ${m[4]}:${m[5]}`;
  };

  // Parse display "MM-DD-YYYY HH:mm" → internal "YYYY-MM-DDTHH:mm"
  const fromDisplay = (d) => {
    const m = d.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
    if (m) return `${m[3]}-${m[1]}-${m[2]}T${m[4]}:${m[5]}`;
    return '';
  };

  // Auto-format raw digits into MM-DD-YYYY HH:mm mask
  const autoFormat = (raw) => {
    const digits = raw.replace(/[^0-9]/g, '').slice(0, 12);
    let out = '';
    if (digits.length > 0) out += digits.slice(0, 2);
    if (digits.length > 2) out += '-' + digits.slice(2, 4);
    if (digits.length > 4) out += '-' + digits.slice(4, 8);
    if (digits.length > 8) out += ' ' + digits.slice(8, 10);
    if (digits.length > 10) out += ':' + digits.slice(10, 12);
    return out;
  };

  useEffect(() => {
    if (!editing) setDisplay(toDisplay(value));
  }, [value, editing]);

  const handleChange = (e) => {
    const raw = e.target.value;
    // If user is deleting, allow clearing
    if (raw === '') {
      setDisplay('');
      onChange('');
      return;
    }
    const formatted = autoFormat(raw);
    setDisplay(formatted);
    const internal = fromDisplay(formatted);
    if (internal) onChange(internal);
  };

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        type="text"
        value={display}
        onChange={handleChange}
        onFocus={() => setEditing(true)}
        onBlur={() => setEditing(false)}
        placeholder={placeholder || 'MM-DD-YYYY HH:mm'}
        disabled={disabled}
        className={cn('font-mono text-sm tabular-nums pr-9', className)}
      />
      <CalendarClock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}