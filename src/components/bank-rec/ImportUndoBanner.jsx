import { CheckCircle2, Undo2, X } from 'lucide-react';
import { formatBatchDateTime } from '@/lib/importBatchUtils';

/**
 * Persistent post-import confirmation banner.
 * Stays visible until the user clicks Undo, dismisses, or navigates away.
 */
export default function ImportUndoBanner({ batch, onUndo, onDismiss }) {
  if (!batch) return null;

  const label = `Imported ${batch.rowCount} row${batch.rowCount === 1 ? '' : 's'} — ${batch.filename} — ${formatBatchDateTime(batch.importedDatetime)}`;

  return (
    <div
      className="flex items-center justify-between gap-3 px-5 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl"
      style={{ boxShadow: '0 0 24px -8px rgba(16,185,129,0.25)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <span className="text-sm text-white/90 truncate">{label}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onUndo}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Undo Import
        </button>
        <button
          onClick={onDismiss}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}