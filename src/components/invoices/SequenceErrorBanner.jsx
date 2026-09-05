import { useState } from 'react';
import { AlertTriangle, Sparkles, Loader2, X, Lock, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  smartAllocateInvoiceNumbers,
  smartAllocateKeepChanged,
} from '@/lib/invoiceSequence';

export default function SequenceErrorBanner({ errors, onAllocated, currentUser }) {
  const { toast } = useToast();
  const [allocating, setAllocating] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  if (dismissed || !errors || errors.length === 0) return null;

  // The "changed" invoices are the ones flagged as out of sequence
  const changedInvoiceIds = [...new Set(errors.map((e) => e.invoice_id))];

  const runAllocation = async (mode) => {
    setAllocating(true);
    setShowDialog(false);
    try {
      const year = new Date().getFullYear();
      const result =
        mode === 'keep_changed'
          ? await smartAllocateKeepChanged(year, changedInvoiceIds)
          : await smartAllocateInvoiceNumbers(year);

      const changed = result.updates.length;
      if (changed === 0) {
        toast({
          title: 'Already sequential',
          description: 'All invoice numbers are in correct chronological order.',
        });
      } else {
        // Audit log
        try {
          const me = currentUser?.full_name || currentUser?.email || 'Unknown';
          await base44.entities.InvoiceNumberChange.create({
            invoice_id: result.reallocated[0]?.invoice_id || '',
            invoice_number:
              result.reallocated[result.reallocated.length - 1]?.to_number || '',
            from_number: 'multiple',
            to_number: `smart-allocated (${changed} invoices)`,
            reason:
              mode === 'keep_changed'
                ? `Smart Allocator (keep changed): renumbered ${changed} other invoices around the locked ones`
                : `Smart Allocator: renumbered ${changed} invoices to match chronological order`,
            changed_by: me,
            changed_at: new Date().toISOString(),
            action_type: 'auto_reallocate',
            reallocated_invoices: result.reallocated,
            undo_snapshot: result.snapshot,
          });
        } catch {
          /* non-blocking */
        }

        toast({
          title: 'Smart Allocation Complete',
          description:
            mode === 'keep_changed'
              ? `${changed} other invoice${changed !== 1 ? 's' : ''} renumbered. Changed invoice${changedInvoiceIds.length !== 1 ? 's' : ''} kept as-is.`
              : `${changed} invoice${changed !== 1 ? 's' : ''} renumbered to match chronological order.`,
        });
      }
      onAllocated?.();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Allocation failed', description: e.message });
    } finally {
      setAllocating(false);
    }
  };

  return (
    <>
      <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 flex items-start gap-3 animate-fade-in">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            Invoice Sequence Mismatch Detected
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {errors.length} invoice{errors.length !== 1 ? 's have' : ' has'} a number that doesn't
            match its chronological order. Use the Smart Allocator to fix the sequence.
          </p>
          {errors.length <= 3 && (
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
            onClick={() => setShowDialog(true)}
            disabled={allocating}
            className="h-8 gap-1.5 bg-[linear-gradient(135deg,rgb(var(--panel-accent-rgb))_0%,rgb(var(--panel-accent2-rgb))_100%)] text-primary-foreground shadow-md"
          >
            {allocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {allocating ? 'Allocating…' : 'Smart Allocate'}
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

      {/* Allocation mode chooser */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Choose Allocation Mode
            </DialogTitle>
            <DialogDescription>
              How should the Smart Allocator fix the sequence mismatch?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 pt-1">
            {/* Option 1: keep changed, renumber others */}
            <button
              onClick={() => runAllocation('keep_changed')}
              disabled={allocating}
              className="w-full text-left rounded-xl border border-border/60 bg-card/40 hover:border-primary/40 hover:bg-primary/5 p-3.5 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                  <Lock className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Keep changed invoice, renumber others
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Locks the edited invoice{changedInvoiceIds.length !== 1 ? 's' : ''} at its
                    current number and shifts every other invoice to fit chronologically around it.
                  </p>
                </div>
              </div>
            </button>

            {/* Option 2: renumber all chronologically */}
            <button
              onClick={() => runAllocation('renumber_all')}
              disabled={allocating}
              className="w-full text-left rounded-xl border border-border/60 bg-card/40 hover:border-primary/40 hover:bg-primary/5 p-3.5 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                  <RefreshCw className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Renumber changed invoice to match
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Renumbers the edited invoice{changedInvoiceIds.length !== 1 ? 's' : ''} to fit
                    the chronological order of all other invoices. Everything follows strict
                    creation-date sequence.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {allocating && (
            <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Allocating…
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}