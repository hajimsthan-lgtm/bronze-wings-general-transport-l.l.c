import { Building2 } from 'lucide-react';
import SearchableSelect from '@/components/common/SearchableSelect';
import GradientAvatar from '@/components/common/GradientAvatar';

/**
 * ClientSelect — profile-view dropdown for clients.
 * Shows avatar, name, contact person, and status badge in each option.
 *
 * Props:
 *  - clients:   [{ name, image_url, contact_person, status, ... }]
 *  - value:     currently selected client name
 *  - onChange:  (name) => void
 *  - error:     optional error class string
 *  - placeholder
 */
export default function ClientSelect({
  clients = [],
  value,
  onChange,
  error = '',
  placeholder = 'Select client',
}) {
  const selected = clients.find((c) => c.name === value);

  return (
    <SearchableSelect
      value={value || ''}
      onChange={(v) => onChange(v)}
      placeholder={placeholder}
      className={error}
      renderLabel={(it) => (
        <span className="flex items-center gap-2 truncate">
          {selected?.image_url ? (
            <img src={selected.image_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
          ) : (
            <GradientAvatar name={it.label} size="xs" />
          )}
          <span className="truncate">{it.label}</span>
        </span>
      )}
      items={clients
        .filter((c) => c.status === 'active' || c.name === value)
        .map((c) => ({
          value: c.name,
          label: c.name,
          search: c.contact_person ? ` ${c.contact_person}` : '',
          content: (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {c.image_url ? (
                <img src={c.image_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
              ) : (
                <GradientAvatar name={c.name} size="md" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {c.contact_person || 'No contact'} · ID: {(c.id || '').slice(0, 8)}
                </p>
              </div>
              {c.status && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${
                  c.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'
                }`}>
                  {c.status}
                </span>
              )}
            </div>
          ),
        }))}
    />
  );
}