import { useState, useEffect } from 'react';
import { AlertTriangle, Sparkles, Loader2, X, GitBranch } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  smartAllocateKeepChanged,
  computeCascadeRenumber,
  applyCascadeRenumber,
} from '@/lib/invoiceSequence';
import CascadeRenumberDialog from './CascadeRenumberDialog';

export default function SequenceErrorBanner({ errors, onAllocated, currentUser, recentManualEdit }) {
  const { toast } = useToast();
  const [allocating, setAllocating] = useState(false);
  const [cascadeLoading, setCascadeLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [cascadePlan, setCascadePlan] = useState(null);

  const hasErrors = errors && errors.length > 0;
  const hasManualEdit = !!recentManualEdit;

  // Reset dismissed state when a new manual edit arrives
  useEffect(() => {
    if (recentManualEdit) setDismissed(false);
  }, [recentManualEdit]);

  if (dismissed || (!hasErrors && !hasManualEdit)) return null;

  const isCascadeMode = hasManualEdit && !hasErrors;

  const handleSmartAllocate = async () => {
    // If there's a recent manual edit, try cascade renumber first
    if (hasManualEdit) {
      setCascadeLoading(true);
      try {
        const plan = await computeCascadeRenumber(recentManualEdit.invoiceId, recentManualEdit.fromNumber);
        if (plan.anchorInfo) {
          setCascadePlan(plan);
          setCascadeLoading(false);
          return;
        }
        // No anchor found — fall through to chronological renumber
      } catch (e) {
        console.warn('Cascade computation failed, falling back to chronological:', e.message);
      }
      setCascadeLoading(false);
    }

    // Fall back to chronological renumber (existing behavior)
    setAllocating(true);
    try {
      const year = new Date().getFullYear();
      const result = await smartAllocateKeepChanged(year, []);
      const changed = result.updates.length;
      if (changed === 0) {
        toast({ title: 'Already sequential', description: 'All invoice numbers are in correct order.' });
      } else {
        base44.entities.InvoiceNumberChange.create({
          invoice_id: result.reallocated[0]?.invoice_id || '',
          invoice_number: result.reallocated[result.reallocated.length - 1]?.to_number || '',
          from_number: 'multiple',
          to_number: `smart-allocated (${changed} invoices)`,
          reason: `Smart Allocator: renumbered ${changed} invoice${changed !== 1 ? 's' : ''} chronologically`,
          changed_by: currentUser?.full_name || currentUser?.email || 'Unknown',
          changed_at: new Date().toISOString(),
          action_type: 'auto_reallocate',
          reallocated_invoices: result.reallocated,
          undo_snapshot: result.snapshot,
        }).catch(() => {});

        toast({
          title: 'Smart Allocation Complete',
          description: `${changed} invoice${changed !== 1 ? 's' : ''} renumbered to match chronological order.`,
        });
      }
      onAllocated?.();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Allocation failed', description: e.message });
    } finally {
      setAllocating(false);
    }
  };

  const handleCascadeConfirm = async () => {
    if (!cascadePlan) return;
    setAllocating(true);
    try {
      await applyCascadeRenumber(
        cascadePlan,
        currentUser?.full_name || currentUser?.email || 'Unknown'
      );
      toast({
        title: 'Cascade Renumber Complete',
        description: `${cascadePlan.reallocated.length} invoice${cascadePlan.reallocated.length !== 1 ? 's' : ''} renumbered around ${cascadePlan.anchorInfo.number}.`,
      });
      setCascadePlan(null);
      onAllocated?.();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Cascade failed', description: e.message });
    } finally {
      setAllocating(false);
    }
  };

  return (
    <>
      <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 flex items-start gap-3 animate-fade-in">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
          {isCascadeMode ? (
            <GitBranch className="w-4 h-4 text-amber-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            {isCascadeMode ? 'Manual Number Edit Detected' : 'Invoice Sequence Mismatch Detected'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isCascadeMode
              ? `Invoice ${recentManualEdit.toNumber} was manually edited. Smart Allocate will cascade-renumber all same-year invoices around it, keeping the edited number fixed.`
              : `${errors.length} invoice${errors.length !== 1 ? 's have' : ' has'} a number that doesn't match its chronological order. Smart Allocate will keep your last-edited invoice and renumber the others to fit.`}
          </p>
          {hasErrors && errors.length <= 3 && (
            <ul className="mt-1.5 space-y-0.5">
              {errors.slice(0, 3).map((e, i) => (
                <li key={i} className="text-[11px] text-muted-foreground/80 font-mono">
                  {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={handleSmartAllocate}
            disabled={allocating || cascadeLoading}
            className="h-8 gap-1.5 bg-[linear-gradient(135deg,rgb(var(--panel-accent-rgb))_0%,rgb(var(--panel-accent2-rgb))_100%)] text-primary-foreground shadow-md"
          >
            {allocating || cascadeLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {allocating ? 'Allocating…' : cascadeLoading ? 'Computing…' : 'Smart Allocate'}
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <CascadeRenumberDialog
        open={!!cascadePlan}
        onOpenChange={(open) => { if (!open) setCascadePlan(null); }}
        plan={cascadePlan}
        onConfirm={handleCascadeConfirm}
        applying={allocating}
      />
    </>
  );
}