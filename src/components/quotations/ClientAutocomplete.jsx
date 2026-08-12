import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ClientAutocomplete({ form, update }) {
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState(form.client_name || '');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef(null);

  useEffect(() => {
    base44.entities.Client.list()
      .then(list => setClients(list || []))
      .catch(() => {});
  }, []);

  useEffect(() => { setQuery(form.client_name || ''); }, [form.client_name]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const matches = query.trim()
    ? clients.filter(c => c.name?.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 8)
    : clients.slice(0, 8);

  const pick = (c) => {
    update('client_name', c.name);
    if (c.contact_person) update('contact_person', c.contact_person);
    if (c.email) update('client_email', c.email);
    if (c.phone) update('client_phone', c.phone);
    if (c.address) update('client_address', c.address);
    if (c.trn) update('client_trn', c.trn);
    setQuery(c.name);
    setOpen(false);
    setHighlight(-1);
  };

  const onKeyDown = (e) => {
    if (!open || !matches.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(h + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && highlight >= 0) { e.preventDefault(); pick(matches[highlight]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div className="col-span-2 relative" ref={wrapRef}>
      <Label>Client Name *</Label>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={e => { setQuery(e.target.value); update('client_name', e.target.value); setOpen(true); setHighlight(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Type or select existing client"
          className="pl-8"
        />
      </div>
      {open && matches.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          {matches.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => pick(c)}
              onMouseEnter={() => setHighlight(i)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors ${
                i === highlight ? 'bg-accent/60' : 'hover:bg-accent/40'
              }`}
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{c.name}</div>
                {(c.contact_person || c.phone) && (
                  <div className="text-[11px] text-muted-foreground truncate">
                    {[c.contact_person, c.phone].filter(Boolean).join(' · ')}
                  </div>
                )}
              </div>
              {form.client_name === c.name && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}