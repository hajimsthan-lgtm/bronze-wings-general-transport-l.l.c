import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Search, X } from 'lucide-react';

/**
 * DriverRecipientField — dual-mode recipient input.
 * mode: 'manual' | 'driver'
 * In manual mode → free text input.
 * In driver mode → autocomplete dropdown pulling live from Drivers table.
 *
 * Props:
 *  - value: { mode, recipient, driver_id }
 *  - onChange: (patch) => void  — merges patch into the recipient field group
 */
export default function DriverRecipientField({ value, onChange }) {
  const [drivers, setDrivers] = useState([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    base44.entities.Driver.list('-created_date', 500).catch(() => []).then((d) => setDrivers(d || []));
  }, []);

  const mode = value?.mode || 'manual';
  const selectedDriver = drivers.find((d) => d.id === value?.driver_id);

  const filtered = useMemo(() => {
    if (!query) return drivers;
    const q = query.toLowerCase();
    return drivers.filter((d) =>
      (d.name || '').toLowerCase().includes(q) ||
      (d.phone || '').toLowerCase().includes(q) ||
      (d.license_number || '').toLowerCase().includes(q)
    );
  }, [drivers, query]);

  const setMode = (m) => {
    if (m === mode) return;
    if (m === 'driver') {
      onChange({ recipient_mode: 'driver', recipient: '', driver_id: '' });
    } else {
      onChange({ recipient_mode: 'manual', recipient: '', driver_id: '' });
    }
    setOpen(false);
  };

  const pickDriver = (d) => {
    onChange({ recipient_mode: 'driver', recipient: d.name, driver_id: d.id });
    setOpen(false);
    setQuery('');
  };

  const initials = (name) => (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div>
      {/* Compact mode toggle */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <button
          type="button"
          onClick={() => setMode(mode === 'driver' ? 'manual' : 'driver')}
          className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors flex-shrink-0 ${
            mode === 'driver' ? 'bg-primary' : 'bg-muted-foreground/30'
          }`}
          title={mode === 'driver' ? 'Switch to manual entry' : 'Link to a driver'}
        >
          <span className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${
            mode === 'driver' ? 'translate-x-3.5' : 'translate-x-0.5'
          }`} />
        </button>
        <span className="text-[11px] font-medium text-muted-foreground">
          {mode === 'driver' ? 'Driver-linked' : 'Manual entry'}
        </span>
      </div>

      {mode === 'manual' ? (
        <input
          type="text"
          value={value?.recipient || ''}
          onChange={(e) => onChange({ recipient: e.target.value, driver_id: '' })}
          placeholder="Paid to / Received from"
          className="clay-input w-full"
          style={{ padding: '10px 14px', fontSize: 13 }}
        />
      ) : (
        <div className="relative">
          {selectedDriver && !open ? (
            <div className="flex items-center gap-2 clay-input w-full" style={{ padding: '6px 10px', fontSize: 13 }}>
              <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                {selectedDriver.image_url ? (
                  <img src={selectedDriver.image_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  initials(selectedDriver.name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{selectedDriver.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {selectedDriver.phone || 'No phone'} · ID: {selectedDriver.id.slice(0, 8)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { onChange({ recipient_mode: 'driver', recipient: '', driver_id: '' }); setOpen(true); }}
                className="text-muted-foreground hover:text-primary p-1 rounded transition-colors"
                title="Change driver"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onChange({ recipient_mode: 'manual', recipient: '', driver_id: '' })}
                className="text-muted-foreground hover:text-rose-400 p-1 rounded transition-colors"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex items-center clay-input w-full" style={{ padding: 0, fontSize: 13 }}>
                <Search className="w-3.5 h-3.5 text-muted-foreground ml-3 flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setOpen(true)}
                  autoFocus={open}
                  placeholder="Search driver by name, phone, license..."
                  className="flex-1 bg-transparent border-none outline-none px-2 py-2.5 text-foreground placeholder:text-muted-foreground"
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground px-2">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {open && (
                <div className="absolute z-[200] mt-1 w-full min-w-[16rem] rounded-xl border border-white/10 bg-popover/95 backdrop-blur-xl text-popover-foreground shadow-2xl shadow-black/50 ring-1 ring-white/5 overflow-hidden">
                  <div className="max-h-64 overflow-y-auto p-1.5">
                    {filtered.length === 0 ? (
                      <p className="px-2.5 py-3 text-xs text-muted-foreground text-center">No drivers found</p>
                    ) : (
                      filtered.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => pickDriver(d)}
                          className="w-full flex items-center gap-2.5 rounded-lg py-2 px-2.5 text-left transition-colors hover:bg-primary/15"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                            {d.image_url ? (
                              <img src={d.image_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              initials(d.name)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {d.phone || 'No phone'} · ID: {d.id.slice(0, 8)}
                            </p>
                          </div>
                          {d.status && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${
                              d.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'
                            }`}>
                              {d.status}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}