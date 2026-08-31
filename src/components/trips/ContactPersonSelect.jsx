import { Mail, Phone, Briefcase } from 'lucide-react';
import SearchableSelect from '@/components/common/SearchableSelect';
import GradientAvatar from '@/components/common/GradientAvatar';

/**
 * ContactPersonSelect — profile-view dropdown for client contact persons.
 * Shows avatar, name, department, email and phone in each option.
 *
 * Props:
 *  - contacts: [{ name, email, phone, department, position }]
 *  - value:     currently selected contact name
 *  - onChange:  (name) => void
 *  - error:     optional error class string
 *  - placeholder
 */
export default function ContactPersonSelect({
  contacts = [],
  value,
  onChange,
  error = '',
  placeholder = 'Select contact person',
}) {
  const selected = contacts.find((c) => c.name === value);

  return (
    <SearchableSelect
      value={value || ''}
      onChange={(v) => onChange(v)}
      placeholder={placeholder}
      className={error}
      renderLabel={(it) => (
        <span className="flex items-center gap-2 truncate">
          <GradientAvatar name={it.label} size="xs" />
          <span className="truncate">{it.label}</span>
          {selected?.department && (
            <span className="text-[9px] text-muted-foreground truncate hidden sm:inline">· {selected.department}</span>
          )}
        </span>
      )}
      items={contacts.map((cp) => ({
        value: cp.name,
        label: cp.name,
        search: [cp.email, cp.phone, cp.department, cp.position].filter(Boolean).join(' '),
        content: (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <GradientAvatar name={cp.name} size="md" />
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-sm font-medium text-foreground truncate">{cp.name}</p>
              {cp.position && (
                <p className="text-[10px] text-primary/80 truncate flex items-center gap-1">
                  <Briefcase className="w-2.5 h-2.5" /> {cp.position}
                  {cp.department && <span className="text-muted-foreground">· {cp.department}</span>}
                </p>
              )}
              {cp.email && (
                <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                  <Mail className="w-2.5 h-2.5" /> {cp.email}
                </p>
              )}
              {cp.phone && (
                <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                  <Phone className="w-2.5 h-2.5" /> {cp.phone}
                </p>
              )}
            </div>
          </div>
        ),
      }))}
    />
  );
}