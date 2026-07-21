import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { useTripUpdate } from '@/hooks/useEntityQueries';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { User, Truck as TruckIcon, Building2, FileText, ChevronDown, Check, Copy } from 'lucide-react';

const TRIP_TYPE_COLORS = {
  one_way: 'text-sky-500 dark:text-sky-400',
  hourly: 'text-amber-500 dark:text-amber-400',
  contract: 'text-blue-500 dark:text-blue-400',
  return: 'text-emerald-500 dark:text-emerald-400'
};

const STATUS_COLORS = {
  scheduled: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/25',
  in_transit: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/25',
  completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/25',
  cancelled: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/25'
};

const STATUS_DOT = {
  scheduled: 'bg-slate-400',
  in_transit: 'bg-amber-400',
  completed: 'bg-emerald-400',
  cancelled: 'bg-rose-400'
};

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Canceled' }
];

export default function TripCard({ trip, onClick, driverMap, vehicleMap, clientMap }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const updateTrip = useTripUpdate();
  const { toast } = useToast();

  const handleLink = (e, map, name, path) => {
    e.stopPropagation();
    const id = map?.[name];
    if (id) navigate(`${path}/${id}`);
  };

  const handleStatusChange = (e, newStatus) => {
    e.stopPropagation();
    updateTrip.mutate({ id: trip.id, data: { status: newStatus } });
  };

  const copyTripNumber = (e) => {
    e.stopPropagation();
    if (trip.trip_number) {
      navigator.clipboard.writeText(trip.trip_number);
      toast({ title: 'Trip Number Copied!', description: trip.trip_number });
    }
  };

  const statusLabel = STATUS_OPTIONS.find((s) => s.value === trip.status)?.label || trip.status;

  return (
    <div
      onClick={() => onClick?.(trip)}
      className="clay clay-hover group p-4 cursor-pointer"
    >
      {/* Header: trip number, status, revenue */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <button
            onClick={copyTripNumber}
            className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            title="Click to copy trip number"
          >
            {trip.trip_number || `#${trip.id?.slice(-6)}`}
            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${STATUS_COLORS[trip.status] || STATUS_COLORS.scheduled}`}
              >
                {statusLabel}
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={(e) => handleStatusChange(e, opt.value)}
                  className="text-xs cursor-pointer flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[opt.value]}`} />
                  {opt.label}
                  {trip.status === opt.value && <Check className="w-3 h-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {trip.is_draft && (
            <span className="text-[9px] text-amber-500 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
              Draft
            </span>
          )}
          <span className={`text-[10px] font-medium uppercase ${TRIP_TYPE_COLORS[trip.trip_type] || 'text-muted-foreground'}`}>
            {t(trip.trip_type || 'one_way')}
          </span>
        </div>
        {trip.revenue > 0 && (
          <div className="text-right flex-shrink-0">
            <span className="text-sm font-semibold text-foreground">{formatCurrency(trip.revenue)}</span>
            {trip.trip_type === 'hourly' && trip.hours > 0 && (
              <p className="text-[10px] text-muted-foreground">{trip.hours}h</p>
            )}
          </div>
        )}
      </div>

      {/* Route */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex flex-col items-center gap-0.5 pt-0.5">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-px h-5 bg-border" />
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground truncate">{trip.from_location}</p>
          <p className="text-sm font-medium text-foreground truncate">{trip.to_location}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-2 border-t border-border/40">
        {trip.driver_name && (
          <button
            onClick={(e) => handleLink(e, driverMap, trip.driver_name, '/admin/drivers')}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <User className="w-3 h-3" /> {trip.driver_name}
          </button>
        )}
        {trip.vehicle_plate && (
          <button
            onClick={(e) => handleLink(e, vehicleMap, trip.vehicle_plate, '/admin/vehicles')}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <TruckIcon className="w-3 h-3" /> {trip.vehicle_plate}
          </button>
        )}
        {trip.client_name && (
          <button
            onClick={(e) => handleLink(e, clientMap, trip.client_name, '/admin/clients')}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <Building2 className="w-3 h-3" /> {trip.client_name}
          </button>
        )}
        {trip.delivery_note_number && (
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" /> {trip.delivery_note_number}
          </span>
        )}
        <span className="ml-auto">{formatDate(trip.trip_date)}</span>
      </div>
    </div>
  );
}