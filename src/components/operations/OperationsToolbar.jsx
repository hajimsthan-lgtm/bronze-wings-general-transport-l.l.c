import { Search, X, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import SegmentedToggle from '@/components/operations/SegmentedToggle';
import ExportButtons from '@/components/common/ExportButtons';

export default function OperationsToolbar({
  search, setSearch,
  dateFrom, setDateFrom, dateTo, setDateTo,
  statusOptions, statusValue, onStatusChange, statusCounts,
  mode, onModeChange,
  viewMode, setViewMode,
  exportData, exportFilename, exportTitle, exportColumns,
}) {
  const { t } = useI18n();
  const MODE_OPTIONS = [
    { value: 'all', label: t('all_operations') },
    { value: 'trip', label: t('per_trip') },
    { value: 'contract', label: t('contracts') },
  ];
  const modeSelectCls = 'h-10 w-[160px] bg-muted/50 border-border text-sm rounded-xl data-[placeholder]:text-muted-foreground';
  const statusSelectCls = 'h-10 w-[120px] bg-muted/50 border-border text-sm rounded-xl data-[placeholder]:text-muted-foreground';

  return (
    <div className="space-y-3">
      {/* Row 1 — filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t('search')}...`}
            className="w-full h-10 rounded-xl pl-9 pr-9 text-sm bg-muted/50 border border-border focus-visible:border-primary/40"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={t('clear')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
        />

        <div className="flex items-center gap-2 flex-nowrap">
          <Select value={mode} onValueChange={onModeChange}>
            <SelectTrigger className={modeSelectCls}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODE_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusValue} onValueChange={onStatusChange}>
          <SelectTrigger className={statusSelectCls}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === 'all' ? t('all') : t(s)}{s !== 'all' && statusCounts?.[s] != null ? ` · ${statusCounts[s]}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2 — view toggle (small) · exports */}
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedToggle
          compact
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'card', label: t('cards_view'), icon: LayoutGrid },
            { value: 'list', label: t('list_view'), icon: List },
          ]}
        />
        <div className="flex-1" />
        <ExportButtons data={exportData} filename={exportFilename} title={exportTitle} columns={exportColumns} />
      </div>
    </div>
  );
}