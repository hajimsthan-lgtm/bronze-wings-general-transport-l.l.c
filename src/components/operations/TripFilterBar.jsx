import React, { useState, useMemo } from 'react';
import { Calendar, Filter, X, ChevronDown, ChevronUp, Truck, User, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { value: 'trip_started', label: 'In Transit', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { value: 'trip_ended', label: 'Ended', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500/15 text-green-400 border-green-500/30' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
];

const DATE_PRESETS = [
  { label: 'Today', get: () => { const d = new Date(); return [d, d]; } },
  { label: '7 days', get: () => { const d = new Date(); const f = new Date(d); f.setDate(f.getDate() - 6); return [f, d]; } },
  { label: '30 days', get: () => { const d = new Date(); const f = new Date(d); f.setDate(f.getDate() - 29); return [f, d]; } },
  { label: 'This month', get: () => { const d = new Date(); const f = new Date(d.getFullYear(), d.getMonth(), 1); return [f, d]; } },
];

function toDash(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TripFilterBar({
  dateFrom, dateTo, onDateFromChange, onDateToChange,
  selectedStatuses, onToggleStatus,
  clients, drivers, vehicles,
  clientFilter, onClientFilterChange,
  driverFilter, onDriverFilterChange,
  vehicleFilter, onVehicleFilterChange,
  onClearAll,
  totalCount, filteredCount,
}) {
  const [expanded, setExpanded] = useState(true);
  const activeCount = useMemo(() => {
    let n = 0;
    if (dateFrom || dateTo) n++;
    if (selectedStatuses && selectedStatuses.size > 0) n++;
    if (clientFilter && clientFilter !== 'all') n++;
    if (driverFilter && driverFilter !== 'all') n++;
    if (vehicleFilter && vehicleFilter !== 'all') n++;
    return n;
  }, [dateFrom, dateTo, selectedStatuses, clientFilter, driverFilter, vehicleFilter]);

  return (
    <div className="glass-card rounded-xl border border-border/40 mb-3 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Filters</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">{activeCount} active</span>
          )}
          <span className="text-xs text-muted-foreground tabular-nums">{filteredCount} of {totalCount}</span>
        </div>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onClearAll(); }}
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/30">
          {/* Date range + presets */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Date Range</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {DATE_PRESETS.map(p => {
                const [f, t] = p.get();
                const isActive = toDash(dateFrom) === toDash(f) && toDash(dateTo) === toDash(t);
                return (
                  <button
                    key={p.label}
                    onClick={() => { onDateFromChange(toDash(f)); onDateToChange(toDash(t)); }}
                    className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                      isActive ? 'bg-primary/20 text-primary border-primary/30' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-border/40')}
                  >
                    {p.label}
                  </button>
                );
              })}
              <div className="flex items-center gap-1.5 ml-1">
                <input
                  type="date"
                  value={dateFrom || ''}
                  onChange={e => onDateFromChange(e.target.value)}
                  className="h-7 rounded-lg bg-muted/30 border border-border/40 text-xs text-foreground px-2"
                />
                <span className="text-muted-foreground text-xs">→</span>
                <input
                  type="date"
                  value={dateTo || ''}
                  onChange={e => onDateToChange(e.target.value)}
                  className="h-7 rounded-lg bg-muted/30 border border-border/40 text-xs text-foreground px-2"
                />
              </div>
            </div>
          </div>

          {/* Status multi-select */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Truck className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Status</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_OPTIONS.map(s => {
                const active = selectedStatuses?.has(s.value);
                return (
                  <button
                    key={s.value}
                    onClick={() => onToggleStatus(s.value)}
                    className={cn('px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                      active ? s.color : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-border/40')}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Entity filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Building2 className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Client</span>
              </div>
              <Select value={clientFilter || 'all'} onValueChange={onClientFilterChange}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {(clients || []).map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Driver</span>
              </div>
              <Select value={driverFilter || 'all'} onValueChange={onDriverFilterChange}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {(drivers || []).map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Truck className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Vehicle</span>
              </div>
              <Select value={vehicleFilter || 'all'} onValueChange={onVehicleFilterChange}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {(vehicles || []).map(v => <SelectItem key={v.id} value={v.plate_number}>{v.plate_number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}