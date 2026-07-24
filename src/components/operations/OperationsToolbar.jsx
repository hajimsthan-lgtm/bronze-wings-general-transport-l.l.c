import { Search, X, Plus, ChevronDown, Truck, FileText, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
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
  onNewTrip, onNewContract,
  exportData, exportFilename, exportTitle, exportColumns,
}) {
  const { t } = useI18n();

  const MODE_OPTIONS = [
    { value: 'all', label: t('all_operations') },
    { value: 'trip', label: t('per_trip') },
    { value: 'contract', label: t('contracts') },
  ];
  const STATUS_DOT = {
    scheduled: '#60a5fa', in_transit: '#fbbf24', completed: '#34d399', cancelled: '#f87171',
    active: '#34d399', expired: '#f87171', terminated: '#f87171',
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`${t('search')}...`}
            className="w-full h-11 rounded-xl pl-9 pr-9 text-sm bg-muted/50 border border-border focus-visible:border-primary/40"
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
          onToday={() => {
            const today = new Date().toISOString().split('T')[0];
            setDateFrom(today);
            setDateTo(today);
          }}
        />

        <div className="flex-1" />

        <SegmentedToggle
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'card', label: t('cards_view'), icon: LayoutGrid },
            { value: 'list', label: t('list_view'), icon: List },
          ]}
        />

        <ExportButtons data={exportData} filename={exportFilename} title={exportTitle} columns={exportColumns} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 h-11 px-4">
              <Plus className="w-4 h-4 mr-1.5" /> {t('new_record')}
              <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onNewTrip} className="cursor-pointer flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" /> {t('new_trip')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onNewContract} className="cursor-pointer flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> {t('new_contract')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 items-center">
        {MODE_OPTIONS.map((m) => (
          <button key={m.value} onClick={() => onModeChange(m.value)} className={`filter-chip ${mode === m.value ? 'filter-chip-active' : ''}`}>{m.label}</button>
        ))}
        <span className="h-4 w-px bg-border/60 mx-1 flex-shrink-0" />
        {statusOptions.map((s) => (
          <button key={s} onClick={() => onStatusChange(s)} className={`filter-chip ${statusValue === s ? 'filter-chip-active' : ''}`}>
            {s !== 'all' && <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_DOT[s] || '#94a3b8' }} />}
            {s === 'all' ? t('all') : t(s)}
            {s !== 'all' && statusCounts?.[s] != null && <span className="ml-1 text-[10px] opacity-60 tabular-nums">{statusCounts[s]}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}