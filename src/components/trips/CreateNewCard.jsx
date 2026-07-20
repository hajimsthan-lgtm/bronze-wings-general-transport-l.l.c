import { Plus, Check, Loader2 } from 'lucide-react';

export default function CreateNewCard({ label, value, created, loading, onCreate }) {
  if (created) {
    return (
      <div className="flex items-center gap-2 glass-card p-2.5 mt-1.5 border-green-500/20">
        <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
        <span className="text-xs text-green-400 truncate">"{value}" created as new {label}</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onCreate}
      disabled={loading}
      className="flex items-center gap-2 glass-card p-2.5 mt-1.5 hover:border-primary/40 hover:bg-primary/[0.04] transition-all text-left w-full"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 text-primary flex-shrink-0 animate-spin" />
      ) : (
        <Plus className="w-4 h-4 text-primary flex-shrink-0" />
      )}
      <span className="text-xs text-muted-foreground truncate">
        Create <span className="text-primary font-medium">"{value}"</span> as new {label}
      </span>
    </button>
  );
}