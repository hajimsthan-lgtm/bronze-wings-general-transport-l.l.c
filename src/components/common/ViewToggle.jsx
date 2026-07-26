import { LayoutGrid, List } from 'lucide-react';

export default function ViewToggle({ view, onChange }) {
  const base = 'w-8 h-8 inline-flex items-center justify-center rounded-md border transition-colors';
  const active = 'bg-primary/15 text-primary border-primary/40';
  const idle = 'text-muted-foreground hover:text-foreground border-transparent';
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
      <button type="button" onClick={() => onChange('grid')} className={`${base} ${view === 'grid' ? active : idle}`} aria-label="Grid view"><LayoutGrid className="w-4 h-4" /></button>
      <button type="button" onClick={() => onChange('list')} className={`${base} ${view === 'list' ? active : idle}`} aria-label="List view"><List className="w-4 h-4" /></button>
    </div>
  );
}