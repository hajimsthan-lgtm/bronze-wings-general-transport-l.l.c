export default function MetaChip({ icon: Icon, label, onClick, accent = 'text-primary' }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-muted transition-colors max-w-full"
    >
      {Icon && <Icon className={`w-3 h-3 flex-shrink-0 ${accent}`} />}
      <span className="truncate max-w-[140px]">{label}</span>
    </button>
  );
}