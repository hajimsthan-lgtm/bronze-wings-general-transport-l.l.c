import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { useOpsFilter } from '@/lib/operationsFilterStore';
import ExportButtons from '@/components/common/ExportButtons';
import CsvImportButton from '@/components/common/CsvImportButton';
import { normalizeDate } from '@/lib/formatters';
import { enrichTripsWithNumbers } from '@/lib/tripSequence';

export default function OperationsToolbar({
  search, setSearch,
  dateFrom, setDateFrom, dateTo, setDateTo,
  mode, onModeChange,
  viewMode, setViewMode,
  exportData, exportFilename, exportTitle, exportColumns,
  onImported
}) {
  const { t } = useI18n();
  const opsFilter = useOpsFilter();
  const MODE_OPTIONS = [
  { value: 'all', label: t('all_operations') },
  { value: 'trip', label: t('per_trip') },
  { value: 'contract', label: t('contracts') }];


  return (
    <div className="glass-sm rounded-2xl p-2.5 flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[140px] sm:max-w-[260px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`${t('search')}...`}
          className="w-full h-9 rounded-xl pl-8 pr-8 text-xs bg-background/40 border-border focus-visible:border-primary/40" />
        
        {search &&
        <button
          onClick={() => setSearch('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={t('clear')}>
          
            <X className="w-3 h-3" />
          </button>
        }
      </div>

      {/* Status filter pills */}
      {opsFilter.active && opsFilter.options?.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {opsFilter.options.map((s) => {
            const active = opsFilter.value === s;
            const count = s === 'all' ? null : opsFilter.counts?.[s];
            return (
              <button
                key={s}
                onClick={() => opsFilter.onChange?.(s)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors whitespace-nowrap ${
                  active
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                }`}
              >
                {s === 'all' ? t('all') : t(s)}{count != null ? ` · ${count}` : ''}
              </button>
            );
          })}
        </div>
      )}

      <Select value={mode} onValueChange={onModeChange}>
        <SelectTrigger className="h-9 w-full sm:w-[130px] bg-background/40 border-border text-xs rounded-xl data-[placeholder]:text-muted-foreground hidden">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MODE_OPTIONS.map((m) =>
          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          )}
        </SelectContent>
      </Select>

      <div className="flex-1 min-w-0" />

      <ExportButtons data={exportData} filename={exportFilename} title={exportTitle} columns={exportColumns} />
      {mode !== 'contract' &&
      <CsvImportButton entityName="Trip" filename="trips" onImported={onImported} label="Import" className="h-9" enrichRows={enrichTripsWithNumbers} columns={[
      { key: 'from_location', label: 'From', sample: 'Dubai' },
      { key: 'to_location', label: 'To', sample: 'Abu Dhabi' },
      { key: 'vehicle_plate', label: 'Vehicle Plate', sample: 'AD-1-12345' },
      { key: 'driver_name', label: 'Driver', sample: 'Ahmed Ali' },
      { key: 'trip_date', label: 'Trip Date', sample: '2026-08-05' },
      { key: 'client_name', label: 'Client', sample: 'ABC Transport' },
      { key: 'contact_person', label: 'Contact Person', sample: 'John Doe' },
      { key: 'trip_type', label: 'Trip Type', sample: 'one_way' },
      { key: 'revenue', label: 'Revenue', sample: '500' },
      { key: 'status', label: 'Status', sample: 'completed' },
      { key: 'payment_status', label: 'Payment', sample: 'corporate_credit' },
      { key: 'delivery_note_number', label: 'Delivery Note', sample: 'DN-001' },
      { key: 'load_time', label: 'Load Time', sample: '08:00' },
      { key: 'offload_time', label: 'Offload Time', sample: '14:00' }]
      } transform={(r) => ({
        from_location: r.from_location || r.From || '',
        to_location: r.to_location || r.To || '',
        vehicle_plate: r.vehicle_plate || r['Vehicle Plate'] || '',
        driver_name: r.driver_name || r.Driver || '',
        trip_date: normalizeDate(r.trip_date || r['Trip Date'] || ''),
        client_name: r.client_name || r.Client || '',
        contact_person: r.contact_person || r['Contact Person'] || '',
        trip_type: r.trip_type || r['Trip Type'] || 'one_way',
        revenue: Number(r.revenue || r.Revenue) || 0,
        status: r.status || r.Status || 'scheduled',
        payment_status: r.payment_status || r.Payment || 'corporate_credit',
        delivery_note_number: r.delivery_note_number || r['Delivery Note'] || '',
        load_time: r.load_time || r['Load Time'] || '',
        offload_time: r.offload_time || r['Offload Time'] || ''
      })} />
      }
    </div>);

}