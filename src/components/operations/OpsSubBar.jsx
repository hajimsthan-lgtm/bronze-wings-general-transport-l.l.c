import { Search, X } from 'lucide-react';
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
      {/* Search — always visible; only cleared by the user via X */}
      <div className="relative flex-1 min-w-0 max-w-[260px] group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary" />
        <Input
          value={ops.search}
          onChange={(e) => setOpsSearch(e.target.value)}
          placeholder={`${t('search')} trips...`}
          className="w-full h-9 rounded-xl pl-9 pr-8 text-xs bg-muted/30 border-border/60 transition-all duration-300 focus-visible:border-primary/50 focus-visible:bg-muted/50 focus-visible:shadow-[0_0_0_3px_rgba(var(--panel-accent-rgb),0.10)]"
        />
        {ops.search ? (
          <button
            onClick={() => setOpsSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={t('clear')}
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground/40 select-none">⌘K</span>
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