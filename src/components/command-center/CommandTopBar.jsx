import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Search, Bell, Settings, Feather, Home, X, ChevronRight, FileWarning, Wrench, Truck, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALERT_ICONS = { FileWarning, Wrench, Truck, FileText };
const ALERT_STYLES = {
  urgent: 'text-red-400 bg-red-500/10 border-red-500/20',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
};

const CATEGORY_ICONS = { Truck, FileText, User: 'User' };

function SearchResultItem({ item, onSelect }) {
  return (
    <button
      onClick={() => onSelect(item.link)}
      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-foreground/5 transition-colors text-left group"
    >
      <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{item.label}</p>
        {item.sub && <p className="text-[10px] text-muted-foreground truncate">{item.sub}</p>}
      </div>
    </button>
  );
}

export default function CommandTopBar({ dateFrom, dateTo, setDateFrom, setDateTo, alertCount = 0, alerts = [], searchData = {}, user }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dateOpen, setDateOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef(null);

  const initials = user?.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const role = user?.role || 'admin';

  const iconBtn = 'w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all duration-200';

  // Client-side search across loaded data
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const results = [];

    const trips = (searchData.trips || []).filter(t =>
      (t.trip_number || '').toLowerCase().includes(q) ||
      (t.from_location || '').toLowerCase().includes(q) ||
      (t.to_location || '').toLowerCase().includes(q) ||
      (t.driver_name || '').toLowerCase().includes(q) ||
      (t.vehicle_plate || '').toLowerCase().includes(q) ||
      (t.client_name || '').toLowerCase().includes(q)
    ).slice(0, 4);
    if (trips.length) results.push({ category: 'Trips', items: trips.map(t => ({ label: `${t.trip_number || 'Trip'} · ${t.from_location} → ${t.to_location}`, sub: t.driver_name || t.client_name, link: '/trips' })) });

    const invoices = (searchData.invoices || []).filter(i =>
      (i.invoice_number || '').toLowerCase().includes(q) ||
      (i.client_name || '').toLowerCase().includes(q)
    ).slice(0, 4);
    if (invoices.length) results.push({ category: 'Invoices', items: invoices.map(i => ({ label: `${i.invoice_number || 'Invoice'} · ${i.client_name}`, sub: `AED ${Number(i.total_amount || 0).toLocaleString()}`, link: '/accounts/invoices' })) });

    const drivers = (searchData.drivers || []).filter(d =>
      (d.name || '').toLowerCase().includes(q) ||
      (d.phone || '').toLowerCase().includes(q)
    ).slice(0, 4);
    if (drivers.length) results.push({ category: 'Drivers', items: drivers.map(d => ({ label: d.name, sub: d.phone, link: d.id ? `/admin/drivers/${d.id}` : '/admin/drivers' })) });

    const clients = (searchData.clients || []).filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.contact_person || '').toLowerCase().includes(q)
    ).slice(0, 4);
    if (clients.length) results.push({ category: 'Clients', items: clients.map(c => ({ label: c.name, sub: c.contact_person, link: c.id ? `/admin/clients/${c.id}` : '/admin/clients' })) });

    return results;
  }, [search, searchData]);

  const totalResults = searchResults?.reduce((s, g) => s + g.items.length, 0) || 0;

  const handleResultClick = (link) => {
    navigate(link);
    setSearch('');
    setSearchFocused(false);
    searchRef.current?.blur();
  };

  // Close search dropdown on outside click
  useEffect(() => {
    if (!searchFocused) return;
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [searchFocused]);

  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30 relative">
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{
        background: 'linear-gradient(90deg, transparent, rgba(var(--brand-bronze-rgb),0.3), rgba(var(--brand-blue-rgb),0.3), transparent)'
      }} />
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/command-center')}>
          <div className="w-9 h-9 rounded-xl brand-gradient-bg flex items-center justify-center transition-transform group-hover:scale-105">
            <Feather className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight hidden sm:block">
            <span className="text-sm font-bold brand-gradient-text">Bronze Wings</span>
            <span className="block text-[9px] tracking-[0.2em] text-muted-foreground">HOME</span>
          </div>
        </div>

        {/* Home button */}
        <button onClick={() => navigate('/command-center')} className={cn(iconBtn, 'flex-shrink-0')} title="Home Dashboard">
          <Home className="w-4 h-4" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto relative" ref={searchRef}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' && searchResults?.[0]?.items?.[0]) handleResultClick(searchResults[0].items[0].link); }}
            placeholder="Search trips, invoices, drivers, clients..."
            className="w-full h-10 pl-10 pr-4 rounded-full bg-foreground/[0.04] border border-border/40 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-[rgba(var(--brand-blue-rgb),0.4)] focus:bg-foreground/[0.06] focus:shadow-[0_0_0_3px_rgba(var(--brand-blue-rgb),0.1)] transition-all"
          />

          {/* Search dropdown */}
          {searchFocused && search.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden z-50 animate-fade-in" style={{ animation: 'fadeIn 0.15s ease both' }}>
              {totalResults === 0 ? (
                <div className="px-4 py-6 text-center">
                  <Search className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No results for "{search}"</p>
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto thin-scroll p-2">
                  {searchResults.map(group => (
                    <div key={group.category} className="mb-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2.5 py-1.5">{group.category}</p>
                      {group.items.map((item, i) => (
                        <SearchResultItem key={i} item={item} onSelect={handleResultClick} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {/* Date filter */}
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <button className={iconBtn} title="Date range">
                <Calendar className="w-4 h-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72" align="end">
              <div className="space-y-3 p-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date Range</h4>
                <div>
                  <label className="text-xs text-muted-foreground">From</label>
                  <input type="date" value={dateFrom || ''} onChange={(e) => setDateFrom(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-foreground/[0.04] border border-border/40 text-sm focus:outline-none focus:border-[rgba(var(--brand-blue-rgb),0.4)]" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To</label>
                  <input type="date" value={dateTo || ''} onChange={(e) => setDateTo(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-foreground/[0.04] border border-border/40 text-sm focus:outline-none focus:border-[rgba(var(--brand-blue-rgb),0.4)]" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-foreground/5 hover:bg-foreground/10 transition-colors">Clear</button>
                  <button onClick={() => setDateOpen(false)} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium brand-gradient-bg text-white">Apply</button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Notifications bell with dropdown */}
          <Popover open={bellOpen} onOpenChange={setBellOpen}>
            <PopoverTrigger asChild>
              <button className={cn(iconBtn, 'relative')} title="Alerts">
                <Bell className="w-4 h-4" />
                {alertCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="px-4 py-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold">Alerts</h4>
                  {alertCount > 0 && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20 font-bold">{alertCount} active</span>}
                </div>
              </div>
              <div className="max-h-[50vh] overflow-y-auto thin-scroll">
                {alerts.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No active alerts</p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {alerts.map((alert, i) => {
                      const Icon = ALERT_ICONS[alert.icon?.name] || FileWarning;
                      return (
                        <button
                          key={i}
                          onClick={() => { navigate(alert.link); setBellOpen(false); }}
                          className={cn(
                            'w-full flex items-start gap-2.5 px-2.5 py-2.5 rounded-lg border transition-all hover:scale-[1.02] text-left',
                            ALERT_STYLES[alert.severity] || ALERT_STYLES.warning
                          )}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="text-xs font-medium leading-snug">{alert.message}</span>
                          <ChevronRight className="w-3 h-3 flex-shrink-0 mt-0.5 ml-auto opacity-50" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Settings */}
          <button onClick={() => navigate('/settings')} className={iconBtn} title="Settings">
            <Settings className="w-4 h-4" />
          </button>

          {/* Avatar */}
          <button onClick={() => navigate('/settings')} className="flex items-center gap-2 pl-2 ml-1 border-l border-border/30">
            <div className="w-9 h-9 rounded-full brand-gradient-bg flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
            <div className="hidden xl:block leading-tight text-left">
              <span className="text-xs font-semibold block">{displayName}</span>
              <span className="text-[10px] text-muted-foreground capitalize">{role}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}