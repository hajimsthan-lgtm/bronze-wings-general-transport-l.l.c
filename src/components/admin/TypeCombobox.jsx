import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Combobox: user can type a custom value or pick from suggestions.
 * Custom-entered values are persisted to localStorage (storageKey) so they
 * appear as suggestions next time.
 */
export default function TypeCombobox({
  value,
  onChange,
  suggestions = [],
  storageKey,
  placeholder = 'Select or type…',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const [custom, setCustom] = useState([]);
  const ref = useRef(null);

  // load previously-entered custom values
  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setCustom(Array.isArray(stored) ? stored : []);
    } catch {
      setCustom([]);
    }
  }, [storageKey]);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // sync from external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  const allSuggestions = Array.from(new Set([...suggestions, ...custom]));
  const filtered = query
    ? allSuggestions.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : allSuggestions;

  const persistCustom = (val) => {
    if (!storageKey) return;
    const v = val.trim();
    if (!v) return;
    const next = Array.from(new Set([...custom, v]));
    setCustom(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  };

  const commit = (val) => {
    onChange(val);
    persistCustom(val);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (query.trim()) commit(query.trim());
          }
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder={placeholder}
        className="flex h-10 w-full rounded-xl border border-input bg-input px-4 py-1 text-sm text-foreground shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)] transition-all duration-300 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary/40 focus-visible:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03),0_0_0_3px_rgba(var(--panel-accent-rgb),0.15)]"
      />
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      {open && filtered.length > 0 && (
        <div className="absolute z-[200] mt-1 w-full rounded-xl border border-white/10 bg-popover/95 backdrop-blur-xl shadow-2xl max-h-56 overflow-auto p-1.5">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => commit(s)}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm text-left text-popover-foreground hover:bg-primary/15 transition-colors capitalize"
            >
              <span>{s}</span>
              {value === s && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}