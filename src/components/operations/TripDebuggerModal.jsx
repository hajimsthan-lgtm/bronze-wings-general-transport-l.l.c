import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, Loader2, AlertTriangle, AlertCircle, Wrench, ExternalLink, CheckCircle2, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { runTripDiagnostics, summarizeIssues } from '@/lib/tripDebugger';
import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1];

const SEVERITY_META = {
  error: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Error' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Warning' },
};

/**
 * Trip Debugger modal — scans trips for data-integrity errors, reports them,
 * and applies safe auto-fixes (with confirmation + audit log).
 */
export default function TripDebuggerModal({
  open, onOpenChange,
  allTrips, selectedTrips,
  driverMap, vehicleMap, clientMap, companySettings,
  onOpenTrip, onFixed,
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [scope, setScope] = useState('filtered'); // 'filtered' | 'selected'
  const [scanning, setScanning] = useState(false);
  const [issues, setIssues] = useState(null); // null = not run yet
  const [filter, setFilter] = useState('all'); // 'all' | 'error' | 'warning' | 'fixable'
  const [expandedTrip, setExpandedTrip] = useState(null);
  const [fixTarget, setFixTarget] = useState(null); // { trip, issue }

  const tripsToScan = scope === 'selected' ? (selectedTrips || []) : (allTrips || []);

  const runScan = async () => {
    setScanning(true);
    setIssues(null);
    // Small delay so the spinner is visible for large scans
    await new Promise((r) => setTimeout(r, 350));
    const result = runTripDiagnostics(tripsToScan, { driverMap, vehicleMap, clientMap, companySettings });
    setIssues(result);
    setScanning(false);
  };

  // Reset when modal closes
  const handleClose = (v) => {
    if (!v) {
      setIssues(null);
      setFilter('all');
      setExpandedTrip(null);
      setScope('filtered');
    }
    onOpenChange(v);
  };

  const summary = useMemo(() => (issues ? summarizeIssues(issues) : null), [issues]);

  const filteredIssues = useMemo(() => {
    if (!issues) return [];
    if (filter === 'all') return issues;
    if (filter === 'fixable') return issues.filter((i) => i.fix);
    return issues.filter((i) => i.severity === filter);
  }, [issues, filter]);

  // Group by trip
  const grouped = useMemo(() => {
    const map = new Map();
    filteredIssues.forEach((i) => {
      if (!map.has(i.tripId)) map.set(i.tripId, { tripId: i.tripId, tripNumber: i.tripNumber, issues: [] });
      map.get(i.tripId).issues.push(i);
    });
    return Array.from(map.values());
  }, [filteredIssues]);

  const handleConfirmFix = async () => {
    if (!fixTarget) return;
    const { trip, issue } = fixTarget;
    const oldValues = {};
    Object.keys(issue.fix.apply()).forEach((k) => { oldValues[k] = trip[k]; });
    const newValues = issue.fix.apply();
    const actor = user?.full_name || user?.email || 'User';
    try {
      await base44.entities.Trip.update(trip.id, newValues);
      // Audit log
      try {
        await base44.entities.TripFixLog.create({
          trip_id: trip.id,
          trip_number: trip.trip_number || '',
          rule_id: issue.ruleId,
          rule_title: issue.title,
          field: Object.keys(newValues).join(', '),
          old_value: Object.entries(oldValues).map(([k, v]) => `${k}=${v ?? ''}`).join(' | '),
          new_value: Object.entries(newValues).map(([k, v]) => `${k}=${v ?? ''}`).join(' | '),
          fixed_by: actor,
          fixed_at: new Date().toISOString(),
          reason: `Debugger auto-fix: ${issue.title}`,
        });
      } catch {}
      toast({ title: 'Fix applied', description: `${issue.tripNumber}: ${issue.fix.label}` });
      setFixTarget(null);
      onFixed?.();
      // Re-scan to refresh the list
      setTimeout(() => runScan(), 400);
    } catch {
      toast({ title: 'Fix failed', variant: 'destructive' });
      setFixTarget(null);
    }
  };

  const hasSelected = (selectedTrips || []).length > 0;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[88vh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-5 py-4 border-b border-border/60 bg-gradient-to-r from-violet-500/10 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shrink-0">
                <Bug className="w-5 h-5 text-violet-300" />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base flex items-center gap-2">
                  Trip Data Debugger
                  {summary && (
                    <span className="text-xs font-normal text-muted-foreground">
                      · {summary.tripsAffected} trip{summary.tripsAffected !== 1 ? 's' : ''} · {summary.total} issue{summary.total !== 1 ? 's' : ''}
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Scans for logical & data-integrity errors. Safe corrections can be applied with confirmation.
                </DialogDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleClose(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Controls */}
          <div className="px-5 py-3 border-b border-border/40 flex flex-wrap items-center gap-2 bg-muted/20">
            {/* Scope toggle */}
            <div className="flex items-center rounded-lg bg-muted/40 border border-border p-0.5">
              <button
                onClick={() => setScope('filtered')}
                className={cn('px-3 py-1.5 rounded-md text-xs font-semibold transition-colors', scope === 'filtered' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                All in view ({(allTrips || []).length})
              </button>
              <button
                onClick={() => setScope('selected')}
                disabled={!hasSelected}
                className={cn('px-3 py-1.5 rounded-md text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed', scope === 'selected' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                Selected ({(selectedTrips || []).length})
              </button>
            </div>

            <Button onClick={runScan} disabled={scanning || tripsToScan.length === 0} className="h-8 gap-2 text-xs">
              {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bug className="w-3.5 h-3.5" />}
              {scanning ? 'Scanning…' : 'Run Check'}
            </Button>

            {issues && (
              <div className="flex items-center gap-1.5 ml-auto">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                {[
                  { v: 'all', label: `All (${summary.total})` },
                  { v: 'error', label: `Errors (${summary.errors})` },
                  { v: 'warning', label: `Warnings (${summary.warnings})` },
                  { v: 'fixable', label: `Fixable (${summary.fixable})` },
                ].map((f) => (
                  <button
                    key={f.v}
                    onClick={() => setFilter(f.v)}
                    className={cn('px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors', filter === f.v ? 'bg-primary/15 text-primary border border-primary/40' : 'text-muted-foreground hover:text-foreground border border-transparent')}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto premium-scroll">
            {scanning && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
                <p className="text-sm">Scanning {tripsToScan.length} trips…</p>
              </div>
            )}

            {!scanning && !issues && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                  <Bug className="w-7 h-7 text-violet-300" />
                </div>
                <p className="text-sm font-medium">Run a check to scan {tripsToScan.length} trip{tripsToScan.length !== 1 ? 's' : ''} for errors.</p>
                <p className="text-xs text-muted-foreground/70 max-w-sm text-center">Detects reversed dates, broken references, negative amounts, missing required fields, and more.</p>
              </div>
            )}

            {!scanning && issues && issues.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-emerald-400">No issues found</p>
                <p className="text-xs text-muted-foreground">All {tripsToScan.length} scanned trip{tripsToScan.length !== 1 ? 's' : ''} passed every check.</p>
              </div>
            )}

            {!scanning && issues && issues.length > 0 && (
              <div className="p-3 space-y-2">
                {grouped.map((group) => {
                  const isOpen = expandedTrip === group.tripId;
                  const trip = tripsToScan.find((t) => t.id === group.tripId);
                  const hasFixable = group.issues.some((i) => i.fix);
                  return (
                    <div key={group.tripId} className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
                      <button
                        onClick={() => setExpandedTrip(isOpen ? null : group.tripId)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
                      >
                        {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                        <span className="font-mono text-xs font-bold text-primary shrink-0">{group.tripNumber}</span>
                        <span className="text-xs text-muted-foreground truncate">{trip?.from_location || '—'} → {trip?.to_location || '—'}</span>
                        <div className="flex items-center gap-1.5 ml-auto shrink-0">
                          {hasFixable && <Wrench className="w-3.5 h-3.5 text-cyan-400" />}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">{group.issues.length}</span>
                        </div>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: EASE }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3 space-y-2">
                              {group.issues.map((issue, idx) => {
                                const meta = SEVERITY_META[issue.severity];
                                const Icon = meta.icon;
                                return (
                                  <div key={idx} className={cn('rounded-lg border p-3', meta.bg, meta.border)}>
                                    <div className="flex items-start gap-2.5">
                                      <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', meta.color)} />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground">{issue.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">{issue.detail}</p>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {issue.fix && (
                                          <Button
                                            size="sm"
                                            className="h-7 text-xs gap-1.5"
                                            onClick={() => setFixTarget({ trip, issue })}
                                          >
                                            <Wrench className="w-3 h-3" />
                                            Fix
                                          </Button>
                                        )}
                                        <button
                                          onClick={() => { handleClose(false); onOpenTrip?.(trip); }}
                                          className="h-7 px-2.5 rounded-md text-xs font-semibold border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors inline-flex items-center gap-1.5"
                                          title="Open trip"
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Fix confirmation */}
      <AlertDialog open={!!fixTarget} onOpenChange={(o) => !o && setFixTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              Apply this fix?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <span className="block font-semibold text-foreground mb-1">{fixTarget?.issue.title}</span>
              <span className="block text-xs text-muted-foreground mb-3">Trip {fixTarget?.issue.tripNumber}</span>
              <span className="block text-sm">{fixTarget?.issue.fix?.description}</span>
              <span className="block text-[11px] text-muted-foreground mt-3 italic">This change is recorded in the audit log with your name and timestamp.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFix} className="gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              Apply Fix
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}