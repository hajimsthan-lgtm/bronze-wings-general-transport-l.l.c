import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { History, Undo2, CheckCircle2, FileSpreadsheet, User, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { formatBatchDateTime } from '@/lib/importBatchUtils';

const PANEL = {
  background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.80) 0%, rgba(var(--surf-2-rgb),0.92) 100%)',
  backdropFilter: 'blur(28px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(28px) saturate(1.3)',
  border: '1px solid rgba(var(--panel-accent-rgb),0.12)',
  borderRadius: 22,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 16px 44px -14px rgba(0,0,0,0.1)',
};

/**
 * Lists recent import batches for the given entity type.
 * Each row shows filename, date/time, row count, imported-by, status.
 * Undo is available any time — not just in the first few seconds.
 * Delete removes the batch record from history (does not affect imported rows).
 */
export default function ImportHistoryPanel({ entityName, onUndo, onDeleted }) {
  const [batches, setBatches] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.ImportBatch
        .filter({ entity_type: entityName }, '-imported_datetime', 50)
        .catch(() => []);
      setBatches(data || []);
    } finally {
      setLoading(false);
    }
  }, [entityName]);

  useEffect(() => { load(); }, [load]);

  const doDelete = async (batch) => {
    setDeletingId(batch.id);
    try {
      await base44.entities.ImportBatch.delete(batch.id);
      setBatches((arr) => (arr || []).filter((b) => b.id !== batch.id));
      if (onDeleted) onDeleted();
    } catch (err) {
      // ignore
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  if (loading) {
    return (
      <div style={PANEL} className="p-10">
        <LoadingSpinner />
      </div>
    );
  }

  if (!batches || batches.length === 0) {
    return (
      <div style={PANEL}>
        <EmptyState
          icon={History}
          title="No imports yet"
          description="CSV imports will appear here with an undo option — available any time, not just right after import."
        />
      </div>
    );
  }

  return (
    <div style={PANEL} className="overflow-hidden">
      <div className="p-5 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <History className="w-4 h-4" style={{ color: 'rgb(var(--panel-accent-rgb))' }} />
          Import History
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Recent CSV imports. Undo reverses the imported rows; Delete removes the batch record from this list.
        </p>
      </div>
      <div className="overflow-auto thin-scroll" style={{ maxHeight: 'calc(100vh - 440px)' }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground bg-background/95 backdrop-blur-sm border-b border-white/10">
              <th className="text-left font-semibold px-5 py-3">Filename</th>
              <th className="text-left font-semibold px-5 py-3 w-44 whitespace-nowrap">Imported</th>
              <th className="text-right font-semibold px-5 py-3 w-20">Rows</th>
              <th className="text-left font-semibold px-5 py-3 w-40">Imported By</th>
              <th className="text-left font-semibold px-5 py-3 w-28">Status</th>
              <th className="px-5 py-3 w-40"></th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => {
              const isUndone = b.status === 'undone';
              const isDeleting = deletingId === b.id;
              return (
                <tr key={b.id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-white/40 flex-shrink-0" />
                      <span className="text-white/90 text-xs font-mono truncate max-w-[200px]">{b.filename || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-white/70 text-xs whitespace-nowrap">
                    {formatBatchDateTime(b.imported_datetime)}
                  </td>
                  <td className="px-5 py-3 text-right text-white/80 tabular-nums text-xs">
                    {b.row_count ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-white/60 text-xs">{b.imported_by || '—'}</td>
                  <td className="px-5 py-3">
                    {isUndone ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-semibold uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Undone
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isUndone ? (
                        <span className="text-[10px] text-white/30 italic mr-2">
                          {b.rows_removed ?? b.row_count ?? 0} rows removed
                        </span>
                      ) : (
                        <button
                          onClick={() => onUndo(b.batch_id)}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-500/25 transition-colors"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                          Undo
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDelete(b)}
                        disabled={isDeleting}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors disabled:opacity-40"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setConfirmDelete(null)}>
          <div
            className="glass-card max-w-sm w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: 18 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Delete import record?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">This removes the batch entry from history.</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">{confirmDelete.filename || 'this batch'}</span> ({confirmDelete.row_count ?? 0} rows) will be removed from the import history list.
              {confirmDelete.status !== 'undone' && ' The imported rows will remain in your statement — use Undo first if you also want to remove the rows.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 h-9 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => doDelete(confirmDelete)}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 h-9 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deletingId === confirmDelete.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}