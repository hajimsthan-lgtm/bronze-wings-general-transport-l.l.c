import { useState } from 'react';
import { Activity, Lock, Loader2, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';
import {
  TRIP_STATUS_FLOW, STATUS_META, canTransition, overrideTripStatus,
} from '@/lib/tripStatusWorkflow';

/**
 * Automated trip-status display for the Trip form.
 * Shows the current (auto-derived) status as a read-only badge + the 5-step
 * flow. Admins may override forward (with a required reason, logged to the
 * audit trail). Regular users see status only — no manual change.
 */
export default function TripStatusDisplay({ trip, onUpdated }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('');

  const isAdmin = user?.role === 'admin';
  const current = trip?.status || 'scheduled';
  const meta = STATUS_META[current] || STATUS_META.scheduled;
  const currentIdx = TRIP_STATUS_FLOW.indexOf(current);

  // Forward-only override targets (any forward status + cancelled)
  const overrideTargets = TRIP_STATUS_FLOW
    .filter((s) => s !== current && canTransition(current, s))
    .concat(current !== 'cancelled' && current !== 'completed' ? ['cancelled'] : [])
    .filter(Boolean);

  const handleOverride = async () => {
    if (!target) { toast({ title: 'Select a target status', variant: 'destructive' }); return; }
    if (!reason.trim()) { toast({ title: 'Reason required', description: 'A reason is required to override the status.', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      await overrideTripStatus(trip, target, reason, user);
      toast({ title: 'Status overridden', description: `${trip.trip_number || 'Trip'} → ${STATUS_META[target]?.label || target}`, variant: 'default' });
      setOpen(false);
      setTarget('');
      setReason('');
      onUpdated?.();
    } catch (e) {
      toast({ title: 'Override failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="hud-icon-tile w-8 h-8">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground leading-tight">Trip Status</p>
              <p className="text-[10px] text-muted-foreground">Automatically derived — not manually settable</p>
            </div>
          </div>
          <span
            className={cn('inline-flex items-center gap-1.5 font-bold rounded-full border px-2.5 py-1 text-xs', meta.textClass, meta.borderClass, meta.bgClass)}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
            {meta.label}
          </span>
        </div>

        {/* 5-step flow */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
          {TRIP_STATUS_FLOW.map((st, i) => {
            const m = STATUS_META[st];
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={st} className="flex items-center gap-1 flex-shrink-0">
                <div className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold border transition-colors',
                  active ? cn(m.textClass, m.borderClass, m.bgClass) : done ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-muted-foreground border-border/40 bg-muted/30'
                )}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: active || done ? m.color : undefined }} />
                  {m.label}
                </div>
                {i < TRIP_STATUS_FLOW.length - 1 && (
                  <span className={cn('text-[10px]', i < currentIdx ? 'text-emerald-400/60' : 'text-muted-foreground/40')}>→</span>
                )}
              </div>
            );
          })}
        </div>

        {isAdmin && trip?.id && (
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
            <p className="text-[10px] text-amber-400/80 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Admin override available
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="h-7 text-[11px] gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
              <ShieldAlert className="w-3.5 h-3.5" /> Override
            </Button>
          </div>
        )}
      </div>

      {/* Override dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setTarget(''); setReason(''); } }}>
        <DialogContent className="bg-card/95 backdrop-blur-2xl border border-amber-500/25 max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Override Trip Status
            </DialogTitle>
            <DialogDescription className="text-xs">
              Force-advance the status of <span className="font-semibold text-foreground">{trip?.trip_number || 'this trip'}</span>. A reason is required and will be logged to the audit trail.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">New status</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="bg-input border-border"><SelectValue placeholder="Select target status" /></SelectTrigger>
                <SelectContent>
                  {overrideTargets.map((st) => {
                    const m = STATUS_META[st];
                    return (
                      <SelectItem key={st} value={st}>
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
                          {m.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Reason <span className="text-red-400">*</span></Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Explain why this status is being overridden (e.g. data correction, force-complete with missing data)…"
                className="bg-input border-border resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="ghost" type="button" disabled={saving}>Cancel</Button>
            </DialogClose>
            <Button type="button" onClick={handleOverride} disabled={saving || !target || !reason.trim()} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              Apply Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}