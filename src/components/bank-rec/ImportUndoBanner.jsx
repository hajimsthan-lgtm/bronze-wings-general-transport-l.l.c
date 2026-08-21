import { CheckCircle2, Undo2, X } from 'lucide-react';

/**
 * Persistent post-import confirmation banner.
 * Stays visible until the user clicks Undo, dismisses, or navigates away.
 */
export default function ImportUndoBanner({ batch, onUndo, onDismiss }) {
  if (!batch) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl"
      style={{ boxShadow: '0 0 24px -8px rgba(16,185,129,0.25)' }}
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
      <span className="text-xs text-white/80 truncate max-w-[180px] hidden sm:block">{batch.filename}</span>
      <button
        onClick={onUndo}
        className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition-colors"
      >
        <Undo2 className="w-3.5 h-3.5" />
        Undo
      </button>
      <button
        onClick={onDismiss}
        className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}