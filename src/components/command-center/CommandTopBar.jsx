import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Search, Bell, Settings, Feather } from 'lucide-react';
import ThemeToggle from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';

export default function CommandTopBar({ dateFrom, dateTo, setDateFrom, setDateTo, alertCount = 0, user }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dateOpen, setDateOpen] = useState(false);

  const initials = user?.full_name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const role = user?.role || 'admin';

  const iconBtn = 'w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all duration-200';

  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30 relative">
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{
        background: 'linear-gradient(90deg, transparent, rgba(var(--brand-bronze-rgb),0.3), rgba(var(--brand-blue-rgb),0.3), transparent)'
      }} />
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate('/command-center')}>
          <div className="w-9 h-9 rounded-xl brand-gradient-bg flex items-center justify-center transition-transform group-hover:scale-105">
            <Feather className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="text-sm font-bold brand-gradient-text">Bronze Wings</span>
            <span className="block text-[9px] tracking-[0.2em] text-muted-foreground">HOME</span>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-auto relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/'); }}
            placeholder="Search across the fleet..."
            className="w-full h-10 pl-10 pr-4 rounded-full bg-foreground/[0.04] border border-border/40 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-[rgba(var(--brand-blue-rgb),0.4)] focus:bg-foreground/[0.06] focus:shadow-[0_0_0_3px_rgba(var(--brand-blue-rgb),0.1)] transition-all"
          />
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {/* Date filter — icon only */}
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

          {/* Notifications */}
          <button className={cn(iconBtn, 'relative')} title="Alerts">
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>

          {/* Settings */}
          <button onClick={() => navigate('/settings')} className={iconBtn} title="Settings">
            <Settings className="w-4 h-4" />
          </button>

          {/* Theme toggle */}
          <ThemeToggle />

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