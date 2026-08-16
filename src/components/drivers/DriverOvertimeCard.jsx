import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Clock, Plus, Eye, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import EmptyState from '@/components/common/EmptyState';
import QuickViewModal from './QuickViewModal';
import DriverOvertimeFormSheet from './DriverOvertimeFormSheet';
import DriverOvertimeSettingsSheet from './DriverOvertimeSettingsSheet';
import { getEffectiveSettings, syncDriverOvertime, SCENARIO_META } from '@/lib/overtimeCalc';
import { getCompanySettings } from '@/lib/companySettings';

const STATUS_META = {
  pending: { dot: 'bg-amber-400', text: 'text-amber-400', label: 'Pending', color: '#f59e0b' },
  applied: { dot: 'bg-emerald-400', text: 'text-emerald-400', label: 'Applied', color: '#22c55e' },
};

const SCENARIO_ICON = {
  standard: '₦',
  tiered: '⬆',
  flat_daily: '★',
  weekend_multiplier: '☀',
};

export default function DriverOvertimeCard({ driverName, trips = [] }) {
  const { toast } = useToast();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [driver, setDriver] = useState(null);
  const [companySettings, setCompanySettings] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [otRes, drvRes, csRes] = await Promise.all([
        base44.entities.DriverOvertime.filter({ driver_name: driverName }).catch(() => []),
        base44.entities.Driver.filter({ name: driverName }).catch(() => []),
        getCompanySettings().catch(() => {}),
      ]);
      const drv = (drvRes && drvRes[0]) || null;
      setDriver(drv);
      setCompanySettings(csRes || {});

      // Auto-sync from trips
      const settings = getEffectiveSettings(drv || {}, csRes || {});
      if (trips.length > 0) {
        await syncDriverOvertime(driverName, trips, settings, otRes || []);
        // Re-fetch after sync
        const refreshed = await base44.entities.DriverOvertime.filter({ driver_name: driverName }).catch(() => []);
        setEntries(refreshed || []);
      } else {
        setEntries(otRes || []);
      }
    } finally {
      setLoading(false);
    }
  }, [driverName, trips]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (item) => {
    if (item.source === 'trip') {
      toast({ title: 'Auto-generated overtime cannot be deleted. It will update with trip data.', variant: 'destructive' });
      return;
    }
    if (!confirm('Delete this overtime entry?')) return;
    try {
      await base44.entities.DriverOvertime.delete(item.id);
      setEntries((p) => p.filter((e) => e.id !== item.id));
      toast({ title: 'Overtime entry deleted' });
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const pendingEntries = entries.filter((e) => e.status === 'pending');
  const totalPendingHours = pendingEntries.reduce((s, e) => s + (Number(e.hours) || 0), 0);
  const totalPendingAmount = pendingEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const displayList = entries.slice(0, 8);

  return (
    <div className="glass-card rounded-2xl flex flex-col transition-all duration-200" style={{ borderLeft: '4px solid #f59e0b' }}>
      {/* Header — fixed */}
      <div className="flex items-center justify-between h-12 px-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba('#f59e0b', 0.10), border: `1px solid ${hexToRgba('#f59e0b', 0.25)}` }}>
            <Clock className="w-4 h-4" style={{ color: '#f59e0b' }} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">Driver Overtime</h3>
            <p className="text-xs text-muted-foreground truncate">
              {totalPendingHours > 0
                ? `${totalPendingHours.toFixed(1)} hrs pending`
                : 'No pending overtime'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => setSettingsOpen(true)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Overtime Settings">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={() => setQuickViewOpen(true)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="Quick View">
            <Eye className="w-4 h-4" />
          </button>
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }} size="sm" className="h-7 px-3 rounded-full text-[13px] font-medium border-0" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff' }}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
      </div>

      {/* Body — fixed height, internal scroll */}
      <div className="h-[280px] flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto thin-scroll min-h-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : displayList.length === 0 ? (
            <div className="py-4"><EmptyState icon={Clock} title="No overtime recorded this period" /></div>
          ) : (
            <div className="divide-y divide-border">
              {displayList.map((e) => {
                const st = STATUS_META[e.status] || STATUS_META.pending;
                const isTrip = e.source === 'trip';
                return (
                  <div key={e.id} className="flex items-start gap-3 p-4 hover:bg-muted/20 transition-colors">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba('#f59e0b', 0.10), border: '1px solid ' + hexToRgba('#f59e0b', 0.20) }}>
                      <Clock className="w-4 h-4" style={{ color: '#f59e0b' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {e.description || (isTrip ? 'Trip ' + (e.trip_number || '') : 'Manual overtime')}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                          <span className={'w-1.5 h-1.5 rounded-full ' + st.dot} />
                          <span className={st.text}>{st.label}</span>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(e.date)} · {Number(e.hours || 0).toFixed(1)} hrs over
                        {e.scenario && e.scenario !== 'standard' ? ' · ' + (SCENARIO_META[e.scenario]?.label || e.scenario) : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(e.amount)}</span>
                      {!isTrip && e.status === 'pending' && (
                        <button onClick={() => handleDelete(e)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary footer */}
        {entries.length > 0 && (
          <div className="grid grid-cols-2 border-t border-border bg-muted/20 flex-shrink-0">
            <div className="p-4 border-r border-border">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pending Hours</p>
              <p className="text-lg font-bold text-amber-400 tabular-nums">{totalPendingHours.toFixed(1)}</p>
            </div>
            <div className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pending Amount</p>
              <p className="text-lg font-bold text-amber-400 tabular-nums">{formatCurrency(totalPendingAmount)}</p>
            </div>
          </div>
        )}
      </div>

      <DriverOvertimeFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        driverName={driverName}
        editItem={editItem}
        onSaved={load}
      />

      <DriverOvertimeSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        driver={driver}
        companySettings={companySettings}
        onSaved={load}
      />

      <QuickViewModal
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        title="Driver Overtime — Quick View"
        icon={Clock}
        accent="#f59e0b"
        records={entries}
        dateField="date"
        filename={`driver-${driverName}-overtime`}
        columns={[
          { label: 'Date', key: 'date' },
          { label: 'Description', key: 'description' },
          { label: 'Source', key: 'source' },
          { label: 'Hours', key: 'hours', numeric: true },
          { label: 'Rate', key: 'rate', numeric: true },
          { label: 'Amount', key: 'amount', numeric: true },
          { label: 'Scenario', key: 'scenario' },
          { label: 'Status', key: 'status' },
        ]}
        renderRow={(e) => {
          const st = STATUS_META[e.status] || STATUS_META.pending;
          const borderColor = st.color;
          return (
            <div key={e.id} className="flex items-start gap-3 rounded-xl p-3 border-l-4" style={{ background: `${borderColor}08`, borderColor }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${borderColor}15`, border: `1px solid ${borderColor}30` }}>
                <Clock className="w-4 h-4" style={{ color: borderColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground truncate">{e.description || 'Overtime'}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${st.color}15`, color: st.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
                    {st.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs">
                  <p className="text-muted-foreground">Date: <span className="text-foreground/80">{formatDate(e.date)}</span></p>
                  <p className="text-muted-foreground text-right">Hours: <span className="text-foreground font-medium">{Number(e.hours || 0).toFixed(1)}</span></p>
                  <p className="text-muted-foreground">Rate: <span className="text-foreground font-medium">{formatCurrency(e.rate)}</span></p>
                  <p className="text-muted-foreground text-right">Amount: <span className="text-foreground font-medium">{formatCurrency(e.amount)}</span></p>
                </div>
              </div>
            </div>
          );
        }}
        summaryFooter={(filtered) => {
          const pending = filtered.filter((e) => e.status === 'pending');
          const applied = filtered.filter((e) => e.status === 'applied');
          const ph = pending.reduce((s, e) => s + (Number(e.hours) || 0), 0);
          const pa = pending.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          const aa = applied.reduce((s, e) => s + (Number(e.amount) || 0), 0);
          return (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pending Hours</p>
                <p className="text-lg font-bold text-amber-400 tabular-nums">{ph.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Pending Amount</p>
                <p className="text-lg font-bold text-amber-400 tabular-nums">{formatCurrency(pa)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Applied Total</p>
                <p className="text-lg font-bold text-emerald-400 tabular-nums">{formatCurrency(aa)}</p>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}