import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { useOpsFilter, setOpsSearch } from '@/lib/operationsFilterStore';
import ExportButtons from '@/components/common/ExportButtons';
import CsvImportButton from '@/components/common/CsvImportButton';
import { normalizeDate } from '@/lib/formatters';
import { enrichTripsWithNumbers } from '@/lib/tripSequence';

const TRIP_IMPORT_COLUMNS = [
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
  { key: 'offload_time', label: 'Offload Time', sample: '14:00' },
];

const tripImportTransform = (r) => ({
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
  offload_time: r.offload_time || r['Offload Time'] || '',
});

/**
 * Operations search + status filter + export/import controls.
 * Rendered inside the sticky TopBar sub-header for /trips and /contracts.
 * Reads all state from the shared operationsFilterStore.
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

      {/* Export */}
      {ops.exportConfig && (
        <ExportButtons
          data={ops.exportConfig.data}
          filename={ops.exportConfig.filename}
          title={ops.exportConfig.title}
          columns={ops.exportConfig.columns}
        />
      )}

      {/* Import — only for trips mode */}
      {ops.mode !== 'contract' && (
        <CsvImportButton
          entityName="Trip"
          filename="trips"
          onImported={() => ops.onImported?.()}
          label="Import"
          className="h-9"
          enrichRows={enrichTripsWithNumbers}
          columns={TRIP_IMPORT_COLUMNS}
          transform={tripImportTransform}
        />
      )}
    </div>
  );
}