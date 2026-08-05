import { ChevronRight, Truck as TruckIcon } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/formatters';

export default function VehicleListRow({ v, onOpen }) {
  return (
    <>
      <div className="row-card row-edge-glow flex items-center gap-3 cursor-pointer group" onClick={() => onOpen?.(v)} style={{ ['--row-accent']: '#3b82f6' }}>
        <div className="w-10 h-10 rounded-xl entity-avatar flex items-center justify-center flex-shrink-0"><TruckIcon className="w-4 h-4" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{v.plate_number}</p>
            <StatusBadge status={v.status} />
          </div>
          <p className="text-xs text-muted-foreground truncate">{v.make} {v.model}{v.year ? ` · ${v.year}` : ''} · {v.type}</p>
        </div>
        <div className="hidden md:flex items-center gap-5 text-xs text-muted-foreground">
          <div className="text-right"><p className="text-[10px] uppercase tracking-wider">Driver</p><p className="text-foreground font-medium truncate max-w-[120px]">{v.assigned_driver || '—'}</p></div>
          <div className="text-right"><p className="text-[10px] uppercase tracking-wider">Reg Expiry</p><p className="text-foreground font-medium">{formatDate(v.registration_expiry) || '—'}</p></div>
        </div>
        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

    </>
  );
}