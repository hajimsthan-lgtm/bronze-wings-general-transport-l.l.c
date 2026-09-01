import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { safeAll } from '@/lib/safeRequest';
import { buildAlerts, CATEGORIES, SEVERITY } from '@/lib/alertEngine';
import { getCompanySettings } from '@/lib/companySettings';
import NotificationCard from '@/components/notifications/NotificationCard';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import {
  Bell, CheckCircle2, AlertTriangle, AlertOctagon, Filter, ArrowLeft,
  Search, X, ArrowDownUp, RefreshCw, Sparkles, Loader2,
} from 'lucide-react';

const RESOLVED_KEY = 'bw-resolved-alerts-v1';

const SORTS = [
  { key: 'severity', label: 'Severity' },
  { key: 'newest', label: 'Newest' },
  { key: 'category', label: 'Category' },
];
const SEV_RANK = { critical: 0, warning: 1, info: 2, success: 3 };

export default function Notifications() {
  const navigate = useNavigate();
  const [rawAlerts, setRawAlerts] = useState({ alerts: [], byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [resolved, setResolved] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RESOLVED_KEY) || '[]'); } catch { return []; }
  });
  const [filter, setFilter] = useState('all');
  const [showResolved, setShowResolved] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('severity');
  const [sortOpen, setSortOpen] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [invoices, vehicles, documents, drivers, trips, clientPayments, companyDocuments, vendorTransactions, settings] = await safeAll([
        () => base44.entities.Invoice.list('-created_date', 80).catch(() => []),
        () => base44.entities.Vehicle.list().catch(() => []),
        () => base44.entities.Document.list().catch(() => []),
        () => base44.entities.Driver.list().catch(() => []),
        () => base44.entities.Trip.list('-trip_date', 50).catch(() => []),
        () => base44.entities.ClientPayment.list('-created_date', 50).catch(() => []),
        () => base44.entities.CompanyDocument.list().catch(() => []),
        () => base44.entities.VendorTransaction.list('-created_date', 50).catch(() => []),
        () => getCompanySettings().catch(() => ({})),
      ], 1);
      setRawAlerts(buildAlerts({ invoices, vehicles, documents, drivers, trips, clientPayments, companyDocuments, vendorTransactions, companyName: settings?.company_name || 'Company' }));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  const allAlerts = useMemo(() => rawAlerts.alerts || [], [rawAlerts]);
  const activeAlerts = useMemo(() => allAlerts.filter((a) => !resolved.includes(a.id)), [allAlerts, resolved]);
  const resolvedAlerts = useMemo(() => allAlerts.filter((a) => resolved.includes(a.id)), [allAlerts, resolved]);

  const filteredAlerts = useMemo(() => {
    const list = showResolved ? resolvedAlerts : activeAlerts;
    let r = list;
    if (filter !== 'all') {
      if (filter === 'critical') r = r.filter((a) => a.severity === 'critical');
      else r = r.filter((a) => a.category === filter);
    }
    const q = query.trim().toLowerCase();
    if (q) r = r.filter((a) => (`${a.title} ${a.sub} ${a.meta || ''}`).toLowerCase().includes(q));
    r = [...r];
    if (sort === 'severity') r.sort((a, b) => (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9));
    else if (sort === 'category') r.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
    return r;
  }, [activeAlerts, resolvedAlerts, showResolved, filter, query, sort]);

  const stats = useMemo(() => {
    const critical = activeAlerts.filter((a) => a.severity === 'critical').length;
    const warning = activeAlerts.filter((a) => a.severity === 'warning').length;
    const info = activeAlerts.filter((a) => a.severity === 'info' || a.severity === 'success').length;
    return { total: activeAlerts.length, critical, warning, info, resolved: resolvedAlerts.length };
  }, [activeAlerts, resolvedAlerts]);

  const handleResolve = useCallback((id) => {
    setResolved((prev) => { const next = [...prev, id]; localStorage.setItem(RESOLVED_KEY, JSON.stringify(next)); return next; });
  }, []);
  const handleUnresolve = useCallback((id) => {
    setResolved((prev) => { const next = prev.filter((r) => r !== id); localStorage.setItem(RESOLVED_KEY, JSON.stringify(next)); return next; });
  }, []);
  const handleResolveAll = useCallback(() => {
    setResolved((prev) => { const next = [...new Set([...prev, ...activeAlerts.map((a) => a.id)])]; localStorage.setItem(RESOLVED_KEY, JSON.stringify(next)); return next; });
  }, [activeAlerts]);
  const handleOpen = useCallback((to) => navigate(to), [navigate]);

  const visibleCategories = Object.keys(CATEGORIES).filter((k) => (rawAlerts.byCategory[k] || []).length > 0);

  return (
    <div className="professional-page-bg min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="hud-icon-tile w-12 h-12">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">Notifications</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.total > 0 ? `${stats.total} active · ${stats.critical} critical · ${stats.warning} warnings` : 'All caught up'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAlerts} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border bg-card/50 hover:bg-muted/50 transition-all">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            {activeAlerts.length > 0 && !showResolved && (
              <button onClick={handleResolveAll} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all">
                <CheckCircle2 className="w-3.5 h-3.5" /> Resolve All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Total Active" value={stats.total} icon={Bell} color="rgb(var(--panel-accent-rgb))" />
        <StatCard label="Critical" value={stats.critical} icon={AlertOctagon} color="#ef4444" pulse={stats.critical > 0} />
        <StatCard label="Warnings" value={stats.warning} icon={AlertTriangle} color="#f59e0b" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} color="#10b981" />
      </div>

      {/* Toolbar: search + sort */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search alerts…"
            className="w-full h-9 rounded-xl pl-9 pr-9 text-xs bg-card/60 border border-border focus-visible:border-primary/40 focus-visible:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="relative">
          <button onClick={() => setSortOpen((o) => !o)} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border border-border bg-card/50 hover:bg-muted/50 transition-all">
            <ArrowDownUp className="w-3.5 h-3.5" /> {SORTS.find((s) => s.key === sort)?.label}
          </button>
          {sortOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl p-1">
                {SORTS.map((s) => (
                  <button key={s.key} onClick={() => { setSort(s.key); setSortOpen(false); }} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${sort === s.key ? 'bg-primary/15 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}>{s.label}</button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
        <FilterChip label="All" count={stats.total} active={filter === 'all'} onClick={() => setFilter('all')} />
        {visibleCategories.map((k) => {
          const cat = CATEGORIES[k];
          const n = (rawAlerts.byCategory[k] || []).filter((a) => !resolved.includes(a.id)).length;
          if (n === 0) return null;
          return <FilterChip key={k} label={cat.label} count={n} color={cat.color} active={filter === k} onClick={() => setFilter(filter === k ? 'all' : k)} />;
        })}
        <FilterChip label="Critical Only" count={stats.critical} color="#ef4444" active={filter === 'critical'} onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')} />
        <div className="flex-1" />
        <button onClick={() => { setShowResolved(!showResolved); setFilter('all'); }} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${showResolved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-card/50 border-border text-muted-foreground hover:text-foreground'}`}>
          {showResolved ? 'Showing Resolved' : 'Show Resolved'}
        </button>
      </div>

      {/* Alert list */}
      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : filteredAlerts.length > 0 ? (
        <div className="space-y-2.5 max-w-3xl">
          {filteredAlerts.map((alert) => (
            <NotificationCard key={alert.id} alert={alert} onOpen={handleOpen} onResolve={showResolved ? handleUnresolve : handleResolve} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={showResolved ? CheckCircle2 : Bell}
          title={showResolved ? 'No resolved alerts' : stats.total === 0 ? 'All caught up' : 'No alerts match'}
          description={showResolved ? 'Resolved alerts will appear here' : stats.total === 0 ? 'No active alerts right now' : 'Try a different filter or search'}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, pulse }) {
  return (
    <div className="stat-tile p-4 relative overflow-hidden" style={pulse ? { borderColor: `${color}40` } : undefined}>
      {pulse && <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}`, animation: 'live-pulse 1.6s infinite' }} />}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tabular-nums text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, count, color, active, onClick }) {
  const c = color || 'rgb(var(--panel-accent-rgb))';
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all" style={active ? { background: `${c}20`, border: `1px solid ${c}55`, color: c, boxShadow: `0 0 12px -4px ${c}40` } : { background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: 'hsl(var(--muted-foreground))' }}>
      {label}{count > 0 && <span className="tabular-nums opacity-70">{count}</span>}
    </button>
  );
}