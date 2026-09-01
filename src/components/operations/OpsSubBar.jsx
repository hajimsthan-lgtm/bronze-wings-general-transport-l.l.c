import { Search, X, Bug } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { useOpsFilter, setOpsSearch } from '@/lib/operationsFilterStore';
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
      {/* Search */}
      <div className="relative flex-1 min-w-0 max-w-[240px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={ops.search}
          onChange={(e) => setOpsSearch(e.target.value)}
          placeholder={`${t('search')}...`}
          className="w-full h-9 rounded-xl pl-8 pr-8 text-xs bg-muted/40 border-border focus-visible:border-primary/40"
        />
        {ops.search && (
          <button
            onClick={() => setOpsSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={t('clear')}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

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

      {/* Data-integrity Debugger — opens the scanner modal */}
      {ops.debug?.onRun && (
        <button
          onClick={ops.debug.onRun}
          title="Check trips for data errors"
          className="shine-sweep flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-[0_0_0_1px_rgba(139,92,246,0.4),0_6px_18px_-6px_rgba(139,92,246,0.6)] hover:brightness-110 hover:-translate-y-0.5"
        >
          <Bug className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Check Errors</span>
        </button>
      )}

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