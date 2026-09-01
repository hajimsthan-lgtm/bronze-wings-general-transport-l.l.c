import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExportButtons from '@/components/common/ExportButtons';

/**
 * BrowseActionBar — top sub-header that appears only when one or more rows
 * are selected in a browse view. Shows the selection count, CSV/PDF export
 * (of the selected items), and a bulk-delete button. Used across Vehicles,
 * Drivers, Clients, Vendors and Service Providers browse pages.
 */
export default function BrowseActionBar({ selectedCount, onClear, onBulkDelete, exportProps, deleteLabel = 'Delete all' }) {
  if (!selectedCount) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4 px-5 py-3 rounded-xl bg-primary/10 border border-primary/30 animate-fade-in-up no-jerk">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider whitespace-nowrap">
          {selectedCount} selected
        </span>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3 h-3" /> Clear
        </button>
      </div>
      <div className="flex items-center gap-2">
        <ExportButtons {...exportProps} />
        <Button
          type="button"
          size="sm"
          onClick={onBulkDelete}
          className="h-8 gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {deleteLabel}
        </Button>
      </div>
    </div>
  );
}