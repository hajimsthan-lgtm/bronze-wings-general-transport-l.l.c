import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { useOpsFilter } from '@/lib/operationsFilterStore';
import BulkActionBar from '@/components/operations/BulkActionBar';
/**
 * Operations search + status filter + bulk-action controls.
 * Rendered inside the sticky TopBar sub-header for /trips and /contracts.
 * Reads all state from the shared operationsFilterStore (search, status filter,
 * and bulk-selection published by TripsTable).
 */
export default function OpsSubBar() {
  const { t } = useI18n();
  const ops = useOpsFilter();

  if (!ops.active) return null;

  return (
    <div className="hidden md:flex items-center gap-2 ml-2 flex-1 min-w-0">
      {/* Status filter dropdown */}
      {ops.options?.length > 0 && (
        <Select value={ops.value} onValueChange={(v) => ops.onChange?.(v)}>
          <SelectTrigger className="h-9 w-[150px] bg-muted/40 border-border text-xs rounded-xl data-[placeholder]:text-muted-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ops.options.map((s) => {
              const count = s === 'all' ? null : ops.counts?.[s];
              return (
                <SelectItem key={s} value={s}>
                  {s === 'all' ? t('all') : t(s)}{count != null ? ` · ${count}` : ''}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}

      <div className="flex-1 min-w-0" />

      {/* Bulk actions — published by TripsTable into the shared store.
          Always mounted so AnimatePresence can play the exit transition. */}
      {ops.bulk && (
        <BulkActionBar
          selectedCount={ops.bulk.selectedCount}
          totalCount={ops.bulk.totalCount}
          onSelectAll={ops.bulk.onSelectAll}
          onClear={ops.bulk.onClear}
          onBulkStatus={ops.bulk.onBulkStatus}
          onBulkDelete={ops.bulk.onBulkDelete}
          onBulkExportCSV={ops.bulk.onBulkExportCSV}
          onBulkExportPDF={ops.bulk.onBulkExportPDF}
          selectedTrips={ops.bulk.selectedTrips}
        />
      )}

    </div>
  );
}