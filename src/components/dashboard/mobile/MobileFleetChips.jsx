import { Link } from 'react-router-dom';
import { Route, Wrench, ParkingCircle } from 'lucide-react';

export default function MobileFleetChips({ activeTrips, vehicles }) {
  const inMaintenance = vehicles.filter((v) => v.status === 'maintenance').length;
  const idle = vehicles.filter((v) => v.status !== 'maintenance' && !v.assigned_driver).length;

  const chips = [
    { icon: Route, label: 'Active Trips', value: activeTrips, color: '#fb923c', to: '/trips' },
    { icon: ParkingCircle, label: 'Idle Vehicles', value: idle, color: '#64748b', to: '/admin/vehicles' },
    { icon: Wrench, label: 'In Maintenance', value: inMaintenance, color: '#f59e0b', to: '/admin/vehicles' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {chips.map((c) => {
        const Icon = c.icon;
        return (
          <Link
            key={c.label}
            to={c.to}
            className="flex items-center gap-2 px-2.5 py-2 rounded-xl active:scale-[0.97] transition-transform"
            style={{
              background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.55) 0%, rgba(var(--surf-2-rgb),0.72) 100%)',
              border: '1px solid rgba(var(--panel-accent-rgb),0.10)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${c.color}1f`, border: `1px solid ${c.color}3a` }}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: c.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-foreground tabular-nums leading-none">{c.value}</p>
              <p className="text-[8.5px] uppercase tracking-wider text-muted-foreground font-semibold truncate mt-0.5">{c.label}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}