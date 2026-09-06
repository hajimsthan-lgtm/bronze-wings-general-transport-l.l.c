import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { GitBranch, AlertCircle, Loader2 } from 'lucide-react';

export default function CascadeRenumberDialog({ open, onOpenChange, plan, onConfirm, applying }) {
  if (!plan) return null;

  const { anchorInfo, reallocated, collisions, hasNegativeSeq } = plan;
  const hasCollisions = collisions.length > 0;
  const hasIssues = hasCollisions || hasNegativeSeq;
  const hasChanges = reallocated.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            Cascade Renumber Preview
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              Anchor invoice{' '}
              <span className="font-mono font-semibold text-foreground">{anchorInfo.number}</span>
              {' '}({anchorInfo.client_name || 'Unknown client'}) at position{' '}
              <span className="font-semibold text-foreground">{anchorInfo.position}</span>
              {' '}of <span className="font-semibold text-foreground">{anchorInfo.total}</span>
              {' '}in the {anchorInfo.year} sequence. The anchor keeps its exact number; all
              other same-year invoices renumber around it.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasIssues && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/8 p-3 space-y-2">
            {hasNegativeSeq && (
              <p className="text-xs text-red-500 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Cannot renumber: counting backward from {anchorInfo.number} would produce
                invalid (zero or negative) sequence numbers. Choose a higher anchor number.
              </p>
            )}
            {hasCollisions && (
              <div>
                <p className="text-xs text-red-500 flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {collisions.length} collision(s) detected — the new range overlaps with
                  existing invoice numbers outside the cascade:
                </p>
                <ul className="space-y-0.5 ml-6">
                  {collisions.map((c, i) => (
                    <li key={i} className="text-[11px] text-red-400 font-mono">
                      {c.invoice_number} — {c.client_name || 'Unknown'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {!hasIssues && hasChanges && (
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {reallocated.length} invoice{reallocated.length !== 1 ? 's' : ''} will be renumbered:
            </p>
            <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
              {reallocated.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs font-mono py-1 px-2 rounded border-b border-border/20 last:border-0"
                >
                  <span className="text-muted-foreground line-through flex-1">{r.from_number}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-primary font-semibold flex-1 text-right">{r.to_number}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasIssues && !hasChanges && (
          <p className="text-sm text-muted-foreground py-2">
            All invoices are already in the correct position. No changes needed.
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={applying}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={hasIssues || applying || !hasChanges}
            className="bg-[linear-gradient(135deg,rgb(var(--panel-accent-rgb))_0%,rgb(var(--panel-accent2-rgb))_100%)] text-primary-foreground disabled:opacity-40"
          >
            {applying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Applying…
              </>
            ) : (
              `Apply Cascade (${reallocated.length} change${reallocated.length !== 1 ? 's' : ''})`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}