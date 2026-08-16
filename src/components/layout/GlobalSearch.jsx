import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { navItems, secondaryNav, getIcon } from '@/lib/navConfig';
import { cn } from '@/lib/utils';

// Entity records to search across. `fields` are the keys scanned for keyword matches.
const ENTITY_SEARCH = [
  { name: 'Vehicle', label: 'Vehicles', fields: ['plate_number', 'make', 'model', 'vendor_name'], path: (r) => `/admin/vehicles/${r.id}`, icon: 'Truck' },
  { name: 'Driver', label: 'Drivers', fields: ['name', 'phone', 'license_number', 'vendor_name'], path: (r) => `/admin/drivers/${r.id}`, icon: 'UsersRound' },
  { name: 'Client', label: 'Clients', fields: ['name', 'contact_person', 'email', 'phone'], path: (r) => `/admin/clients/${r.id}`, icon: 'Building2' },
  { name: 'Vendor', label: 'Vendors', fields: ['name', 'contact_person', 'category'], path: (r) => `/admin/vendors/${r.id}`, icon: 'Building2' },
  { name: 'Invoice', label: 'Invoices', fields: ['invoice_number', 'client_name'], path: () => '/accounts/invoices', icon: 'FileText' },
  { name: 'Trip', label: 'Trips', fields: ['trip_number', 'from_location', 'to_location', 'client_name', 'driver_name', 'vehicle_plate'], path: () => '/trips', icon: 'Route' },
  { name: 'Agreement', label: 'Agreements', fields: ['agreement_number', 'client_name', 'title'], path: () => '/accounts/agreements', icon: 'FileSignature' },
  { name: 'Quotation', label: 'Quotations', fields: ['quotation_number', 'client_name', 'subject'], path: () => '/accounts/quotations', icon: 'FilePlus2' },
];

const PAGE_ENTRIES = [
  ...navItems.flatMap((s) => s.children.map((c) => ({ ...c, group: s.label }))),
  ...secondaryNav.map((c) => ({ ...c, group: 'Tools' })),
];

const recordTitle = (r, fields) => {
  for (const f of fields) {
    if (r[f]) return String(r[f]);
  }
  return r.id?.slice(-6) || 'Untitled';
};

const recordSubtitle = (r, fields) => {
  for (const f of fields) {
    if (r[f] && f !== fields[0]) return String(r[f]);
  }
  return '';
};

export default function GlobalSearch({ query, setQuery }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [records, setRecords] = useState(null);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const fetchedRef = useRef(false);

  const q = query.trim().toLowerCase();

  // Fetch entity records once on first open, cache client-side.
  const ensureRecords = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const results = [];
      // Fetch in small batches to stay under API rate limits.
      for (let i = 0; i < ENTITY_SEARCH.length; i += 3) {
        const batch = ENTITY_SEARCH.slice(i, i + 3);
        const settled = await Promise.all(
          batch.map(async (cfg) => {
            try {
              const rows = await base44.entities[cfg.name].list('-updated_date', 100);
              return { cfg, rows: rows || [] };
            } catch {
              return { cfg, rows: [] };
            }
          })
        );
        results.push(...settled);
        setRecords([...results]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Build flat, grouped suggestion list from the current query.
  const groups = useMemo(() => {
    if (!q) return [];
    const out = [];

    // Pages
    const pages = PAGE_ENTRIES.filter((p) => (p.label || '').toLowerCase().includes(q)).slice(0, 6);
    if (pages.length) {
      out.push({ type: 'group', label: 'Pages', items: pages.map((p) => ({ kind: 'page', id: `page:${p.path}`, label: p.label, subtitle: p.group, path: p.path, icon: p.icon, color: p.color })) });
    }

    // Entity records
    if (records) {
      for (const { cfg, rows } of records) {
        const matches = rows
          .filter((r) => cfg.fields.some((f) => r[f] && String(r[f]).toLowerCase().includes(q)))
          .slice(0, 5);
        if (matches.length) {
          out.push({
            type: 'group',
            label: cfg.label,
            items: matches.map((r) => ({
              kind: 'record',
              id: `rec:${cfg.name}:${r.id}`,
              label: recordTitle(r, cfg.fields),
              subtitle: recordSubtitle(r, cfg.fields),
              path: cfg.path(r),
              icon: cfg.icon,
            })),
          });
        }
      }
    }
    return out;
  }, [q, records]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Reset active index when results change.
  useEffect(() => { setActive(0); }, [q]);

  // Click outside to close.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const select = (item) => {
    if (!item) return;
    navigate(item.path);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      select(flat[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  let runningIndex = -1;

  return (
    <div className="relative w-full max-w-[420px]" ref={wrapRef}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={async () => { setOpen(true); await ensureRecords(); }}
        onKeyDown={onKeyDown}
        placeholder="Search the whole app…"
        className="w-full h-9 pl-10 pr-4 rounded-full text-[13px] bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:border-primary/40 focus:bg-muted/70"
      />

      {open && q && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] rounded-2xl border border-border/60 overflow-hidden z-50"
          style={{
            background: 'hsl(var(--popover))',
            backdropFilter: 'blur(18px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(18px) saturate(1.3)',
            boxShadow: '0 18px 50px -12px rgba(0,0,0,0.55)',
          }}
        >
          {loading && !records ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">Loading records…</div>
          ) : flat.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">No matches for “{query}”.</div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto thin-scroll py-1.5">
              {groups.map((g) => (
                <div key={g.label} className="mb-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground/70">{g.label}</div>
                  {g.items.map((item) => {
                    runningIndex += 1;
                    const idx = runningIndex;
                    const Icon = getIcon(item.icon);
                    const isActive = idx === active;
                    return (
                      <button
                        key={item.id}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => select(item)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors',
                          isActive ? 'bg-white/[0.06] text-foreground' : 'text-foreground/85'
                        )}
                      >
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(var(--panel-accent-rgb),0.12)', color: item.color || 'rgb(var(--panel-accent-rgb))' }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{item.label}</span>
                          {item.subtitle && <span className="block truncate text-[11px] text-muted-foreground">{item.subtitle}</span>}
                        </span>
                        {isActive && <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          <div className="px-3 py-1.5 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground/70">
            <span>↑↓ navigate · ↵ open · esc close</span>
            <span>{flat.length} result{flat.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      )}
    </div>
  );
}