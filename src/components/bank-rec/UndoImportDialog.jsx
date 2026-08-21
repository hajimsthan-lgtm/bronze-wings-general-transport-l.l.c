import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Trash2, FileSpreadsheet, CalendarRange, CheckCircle2 } from 'lucide-react';
import { fetchBatchRows, fetchBatchRecord, executeBatchUndo, formatBatchDateTime } from '@/lib/importBatchUtils';

/**
 * Confirmation dialog for undoing a CSV import batch.
 * Shows exactly what will be removed (row count, date range, reconciled items)
 * before executing the destructive undo.
 */
export default function UndoImportDialog({ batchId, entityName, onClose, onUndone }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [batchRecord, rows] = await Promise.all([
          fetchBatchRecord(batchId),
          fetchBatchRows(entityName, batchId),
        ]);
        const reconciledCount = rows.filter((r) => r.reconciled).length;
        const dates = rows.map((r) => r.date).filter(Boolean).sort();
        setDetails({
          batchRecord,
          rowCount: rows.length,
          reconciledCount,
          dateRange: dates.length
            ? { from: dates[0], to: dates[dates.length - 1] }
            : null,
        });
      } catch (err) {
        setError(err.message || 'Failed to load batch details');
      } finally {
        setLoading(false);
      }
    })();
  }, [batchId, entityName]);

  const handleConfirm = async () => {
    setExecuting(true);
    setError(null);
    try {
      await executeBatchUndo(entityName, batchId, details.batchRecord);
      onUndone?.();
    } catch (err) {
      setError(err.message || 'Undo failed');
    } finally {
      setExecuting(false);
    }
  };

  const open = !!batchId;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-foreground">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            Undo Import
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="py-4 text-center">
            <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={onClose} variant="outline" className="mt-4 border-border">Close</Button>
          </div>
        ) : details ? (
          <>
            <div className="space-y-4 py-2">
              {/* Batch info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="font-mono text-foreground">
                  {details.batchRecord?.filename || 'Unknown file'}
                </span>
              </div>

              {/* Removal summary */}
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-semibold text-rose-300">
                    {details.rowCount} transaction{details.rowCount === 1 ? '' : 's'} will be permanently deleted
                  </span>
                </div>

                {details.dateRange && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                    <CalendarRange className="w-3.5 h-3.5" />
                    Date range: <span className="text-white/80 font-mono">{details.dateRange.from}</span>
                    {' → '}
                    <span className="text-white/80 font-mono">{details.dateRange.to}</span>
                  </div>
                )}

                <p className="text-xs text-muted-foreground pl-6">
                  Only rows from this import batch will be removed. Manually entered
                  and previously-existing transactions are never touched.
                </p>
              </div>

              {/* Reconciled warning */}
              {details.reconciledCount > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-amber-300">
                      {details.reconciledCount} matched/reconciled transaction{details.reconciledCount === 1 ? '' : 's'} affected
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Undoing will also remove those matches. This cannot be undone.
                  </p>
                </div>
              )}

              {/* Irreversible warning */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
                <span>
                  Running balances and reconciliation totals will be recalculated
                  automatically after removal. This action is irreversible.
                </span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <DialogFooter>
              <Button onClick={onClose} variant="outline" className="border-border" disabled={executing}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={executing || details.rowCount === 0}
                className="bg-rose-500 hover:bg-rose-600 text-white"
              >
                {executing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Undoing…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Confirm Undo
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}