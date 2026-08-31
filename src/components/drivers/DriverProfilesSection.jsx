import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, Truck, Wallet, ChevronRight, UsersRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatters';

export default function DriverProfilesSection() {
  const [drivers, setDrivers] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [drv, sal] = await Promise.all([
          base44.entities.Driver.list().catch(() => []),
          base44.entities.SalaryRecord.list('-created_date', 200).catch(() => []),
        ]);
        setDrivers(drv);
        setSalaries(sal);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Sum monthly salary records per driver (current year)
  const currentYear = new Date().getFullYear();
  const salaryByDriver = {};
  salaries.forEach((s) => {
    if (Number(s.year) === currentYear) {
      const key = s.driver_name || '';
      salaryByDriver[key] = (salaryByDriver[key] || 0) + (Number(s.net_salary) || 0);
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (drivers.length === 0) {
    return (
      <div className="edge-panel rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full empty-orb flex items-center justify-center mx-auto mb-3">
          <UsersRound className="w-7 h-7 text-primary" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">No drivers yet</p>
        <p className="text-xs text-muted-foreground">Add drivers to see their profiles here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {drivers.map((d) => {
        const totalSalary = salaryByDriver[d.name] || 0;
        return (
          <Link
            key={d.id}
            to={`/admin/drivers/${d.id}`}
            className="edge-panel rounded-2xl p-4 flex items-center gap-4 group hover:-translate-y-0.5 transition-transform min-w-0"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 entity-avatar text-sm font-bold">
              {d.image_url ? (
                <img src={d.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
              ) : (
                (d.name || '?').charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground text-sm truncate">{d.name}</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                {d.phone && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Phone className="w-3 h-3" /> {d.phone}
                  </span>
                )}
                {d.email && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                    <Mail className="w-3 h-3" /> <span className="truncate">{d.email}</span>
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                {d.assigned_vehicle && (
                  <span className="flex items-center gap-1 text-[11px] text-primary">
                    <Truck className="w-3 h-3" /> {d.assigned_vehicle}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500">
                  <Wallet className="w-3 h-3" /> {formatCurrency(totalSalary)} / {currentYear}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground flex-shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}