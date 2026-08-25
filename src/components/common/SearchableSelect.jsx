import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SearchableSelect — a dropdown with a built-in search input.
 *
 * Matching is substring-based AND formatting-agnostic: spaces, slashes,
 * hyphens and underscores are stripped from both the query and the
 * searchable text before comparing, so "85" matches "1/ 85215".
 *
 * Props:
 *  - items:       [{ value, label, search }]  (search = extra text to match)
 *  - value:       currently selected value
 *  - onChange:     (value, item) => void
 *  - placeholder:  trigger placeholder
 *  - emptyText:    text when no items match the query
 *  - className:    extra classes for the trigger
 *  - renderLabel:  optional (item) => ReactNode  to customise the trigger label
 */
export default function SearchableSelect({
  items = [],
  value,
  onChange,
  placeholder = 'Select…',
  emptyText = 'No matches',
  className = '',
  renderLabel,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Boost closest trip-section z-index when dropdown is open
  useEffect(() => {
    const section = ref.current?.closest('.trip-section');
    if (section) {
      section.style.zIndex = open ? '50' : '';
    }
  }, [open]);

  // focus the search input when the popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    if (!open) setQuery('');
  }, [open]);

  // Normalise: strip spaces, slashes, hyphens, underscores → lowercase
  const norm = (s) => String(s || '').replace(/[\s/_-]/g, '').toLowerCase();
  const normQuery = norm(query);

  const filtered = useMemo(() => {
    if (!normQuery) return items;
    return items.filter((it) => {
      const haystack = norm([it.label, it.search].filter(Boolean).join(' '));
      return haystack.includes(normQuery);
    });
  }, [items, normQuery]);

  const selected = items.find((it) => it.value === value);

  const triggerLabel = selected
    ? (renderLabel ? renderLabel(selected) : selected.label)
    : placeholder;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-lg border border-input bg-input px-3 py-2 text-sm shadow-sm ring-offset-background transition-colors hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
          className
        )}
      >
        <span className={cn('truncate', !selected && 'text-muted-foreground')}>
          {triggerLabel}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 opacity-50 transition-transform duration-200 flex-shrink-0 ml-2', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute z-[200] mt-1 w-full min-w-[8rem] rounded-xl border border-white/10 bg-popover/95 backdrop-blur-xl text-popover-foreground shadow-2xl shadow-black/50 ring-1 ring-white/5 overflow-hidden">
          {/* Search input */}
          <div className="relative p-2 border-b border-white/8">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setOpen(false);
                if (e.key === 'Enter' && filtered.length > 0) {
                  e.preventDefault();
                  onChange(filtered[0].value, filtered[0]);
                  setOpen(false);
                }
              }}
              placeholder="Search…"
              className="w-full rounded-lg border border-white/10 bg-background/60 pl-8 pr-7 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtered items */}
          <div className="max-h-56 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <p className="px-2.5 py-3 text-xs text-muted-foreground text-center">{emptyText}</p>
            ) : (
              filtered.map((it) => (
                <button
                  key={it.value}
                  type="button"
                  onClick={() => {
                    onChange(it.value, it);
                    setOpen(false);
                  }}
                  className={cn(
                    'relative flex w-full cursor-default select-none items-center rounded-lg py-2 pl-2.5 pr-8 text-sm outline-none transition-colors hover:bg-primary/15',
                    it.value === value && 'bg-primary/10'
                  )}
                >
                  <span className="absolute right-2.5 flex h-3.5 w-3.5 items-center justify-center text-primary">
                    {it.value === value && <Check className="h-4 w-4" />}
                  </span>
                  {it.content || <span className="truncate">{it.label}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}