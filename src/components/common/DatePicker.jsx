import DateTimePicker from './DateTimePicker';

/**
 * DatePicker — date-only picker.
 * Thin wrapper over the shared DateTimePicker (mode="date") so every
 * date-only form in the app uses the same masked input + enhanced calendar.
 *
 * External API preserved: value is "YYYY-MM-DD", onChange returns "YYYY-MM-DD".
 * Extra props (id, name, required, className, placeholder, disabled) pass through.
 */
export default function DatePicker({ value, onChange, placeholder, disabled, className, ...rest }) {
  // Convert YYYY-MM-DD → internal "YYYY-MM-DDT00:00"
  const internal = value ? `${value}T00:00` : '';
  const handleChange = (v) => {
    if (!v) return onChange('');
    // v is "YYYY-MM-DDTHH:mm" → take date part
    onChange(v.split('T')[0]);
  };
  return (
    <DateTimePicker
      mode="date"
      value={internal}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      {...rest}
    />
  );
}