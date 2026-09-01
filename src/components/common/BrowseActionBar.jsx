import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExportButtons from '@/components/common/ExportButtons';

/**
 * BrowseActionBar — compact inline icon group that sits inside a browse
 * page's top search sub-header. Renders only when one or more rows are
 * selected. Shows the selection count + clear, CSV/PDF export (of the
 * selected items), and a bulk-delete button. Used across Vehicles,
 * Drivers, Clients, Vendors and Service Providers browse pages.
 */
export default function BrowseActionBar({ selectedCount, onClear, onBulkDelete, exportProps, deleteLabel = 'Delete all' }) {
  if (!selectedCount) return null;
  return (
    <div className="flex items-center gap-2 flex-shrink-0 animate-fade-in-up no-jerk">
      <div className="flex items-center gap-1.5 px-2.5 h-9 rounded-lg bg-primary/10 border border-primary/30">
        <span className="text-xs font-semibold text-primary whitespace-nowrap">{selectedCount} selected</span>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear selection"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <ExportButtons {...exportProps} />
      <Button
        type="button"
        size="sm"
        onClick={onBulkDelete}
        className="h-9 gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">{deleteLabel}</span>
      </Button>
    </div>
  );
}