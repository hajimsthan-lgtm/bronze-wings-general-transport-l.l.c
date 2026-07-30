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

  return (
    <div className="glass-sm rounded-2xl p-2.5 flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[160px] max-w-[260px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`${t('search')}...`}
          className="w-full h-9 rounded-xl pl-8 pr-8 text-xs bg-background/40 border-border focus-visible:border-primary/40"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={t('clear')}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <DateRangeFilter
        fromValue={dateFrom}
        onFromChange={setDateFrom}
        toValue={dateTo}
        onToChange={setDateTo}
      />

      <Select value={mode} onValueChange={onModeChange}>
        <SelectTrigger className="h-9 w-[130px] bg-background/40 border-border text-xs rounded-xl data-[placeholder]:text-muted-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MODE_OPTIONS.map((m) => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusValue} onValueChange={onStatusChange}>
        <SelectTrigger className="h-9 w-[110px] bg-background/40 border-border text-xs rounded-xl data-[placeholder]:text-muted-foreground">
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

      <div className="flex-1 min-w-0" />

      <SegmentedToggle
        compact
        value={viewMode}
        onChange={setViewMode}
        options={[
          { value: 'card', label: t('cards_view'), icon: LayoutGrid },
          { value: 'list', label: t('list_view'), icon: List },
        ]}
      />
      <ExportButtons data={exportData} filename={exportFilename} title={exportTitle} columns={exportColumns} />
    </div>
  );
}