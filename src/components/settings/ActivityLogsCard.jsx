import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Search, Trash2, Download, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ACTION_LABELS = {
  create: { label: 'Created', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  update: { label: 'Updated', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  delete: { label: 'Deleted', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  login: { label: 'Login', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
  logout: { label: 'Logout', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  export: { label: 'Export', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  import: { label: 'Import', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  status_change: { label: 'Status', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  payment: { label: 'Payment', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  view: { label: 'Viewed', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
  other: { label: 'Other', color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ActivityLogsCard() {
  const { toast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ActivityLog.list('-created_date', 200);
      setLogs(data || []);
    } catch {
      toast({ title: 'Failed to load logs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter((log) => {
    const matchesSearch = !search ||
      (log.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.entity_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.entity_type || '').toLowerCase().includes(search.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const handleClearLogs = async () => {
    try {
      await base44.entities.ActivityLog.deleteMany({});
      setLogs([]);
      toast({ title: 'All logs cleared' });
    } catch {
      toast({ title: 'Failed to clear logs', variant: 'destructive' });
    }
  };

  const handleExport = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity Name', 'Details'];
    const rows = filtered.map((l) => [
      l.created_date || '',
      l.user_name || '',
      l.action || '',
      l.entity_type || '',
      l.entity_name || '',
      (l.details || '').replace(/,/g, ';'),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/25">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Activity Logs</h2>
            <p className="text-sm text-muted-foreground">Track user actions across the system ({filtered.length} entries)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="destructive" size="sm" onClick={handleClearLogs} disabled={logs.length === 0}>
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, entity, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {Object.entries(ACTION_LABELS).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <div className="glass-sm rounded-2xl border border-border/60 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Activity className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No activity logs found</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="divide-y divide-border/30">
              {filtered.map((log) => {
                const meta = ACTION_LABELS[log.action] || ACTION_LABELS.other;
                return (
                  <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${meta.bg} border ${meta.border}`}>
                      <span className={`text-xs font-bold ${meta.color}`}>
                        {(log.user_name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground truncate">
                          {log.user_name || 'Unknown'}
                        </span>
                        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${meta.bg} ${meta.color} border ${meta.border}`}>
                          {meta.label}
                        </span>
                        {log.entity_type && (
                          <span className="text-xs text-muted-foreground">
                            {log.entity_type}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {log.entity_name || '—'}
                        {log.details ? ` · ${log.details}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {timeAgo(log.created_date)}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}