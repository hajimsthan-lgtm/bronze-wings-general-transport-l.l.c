import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { History, Undo2, CheckCircle2, FileSpreadsheet, User, Calendar, AlertCircle } from 'lucide-react';
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
 */
export default function ImportHistoryPanel({ entityName, onUndo }) {
  const [batches, setBatches] = useState(null);
  const [loading, setLoading] = useState(true);

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
          Recent CSV imports. Undo is available any time — even for older batches.
        </p>
      </div>
      <div className="overflow-x-auto thin-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-semibold px-5 py-3">Filename</th>
              <th className="text-left font-semibold px-5 py-3 w-44">Imported</th>
              <th className="text-right font-semibold px-5 py-3 w-20">Rows</th>
              <th className="text-left font-semibold px-5 py-3 w-40">Imported By</th>
              <th className="text-left font-semibold px-5 py-3 w-28">Status</th>
              <th className="px-5 py-3 w-28"></th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => {
              const isUndone = b.status === 'undone';
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
                    {isUndone ? (
                      <span className="text-[10px] text-white/30 italic">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}