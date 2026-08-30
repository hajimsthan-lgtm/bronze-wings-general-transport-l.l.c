import { Link } from 'react-router-dom';
import { AlertTriangle, FileWarning, Wrench, ChevronRight } from 'lucide-react';

export default function MobileAlertsCard({ overdueCount, maintenanceCount, expiringDocCount, serviceDueCount, driverDocAlertCount }) {
  const items = [];
  if (overdueCount > 0) items.push({ icon: FileWarning, label: `${overdueCount} overdue invoice${overdueCount !== 1 ? 's' : ''}`, color: '#ef4444', to: '/accounts/invoices' });
  if (driverDocAlertCount > 0) items.push({ icon: FileWarning, label: `${driverDocAlertCount} driver document${driverDocAlertCount !== 1 ? 's' : ''} pending`, color: '#f59e0b', to: '/admin/drivers' });
  if (maintenanceCount > 0) items.push({ icon: Wrench, label: `${maintenanceCount} vehicle${maintenanceCount !== 1 ? 's' : ''} in maintenance`, color: '#f59e0b', to: '/admin/vehicles' });
  if (serviceDueCount > 0) items.push({ icon: Wrench, label: `${serviceDueCount} vehicle${serviceDueCount !== 1 ? 's' : ''} due for service`, color: '#f97316', to: '/admin/vehicles' });
  if (expiringDocCount > 0) items.push({ icon: FileWarning, label: `${expiringDocCount} expiring document${expiringDocCount !== 1 ? 's' : ''}`, color: '#f59e0b', to: '/admin/documents' });

  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <p className="text-[14px] font-bold text-foreground">Needs Attention</p>
        <span className="ml-auto text-[10px] font-semibold text-muted-foreground tabular-nums">{items.length} active</span>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <Link
              key={i}
              to={it.to}
              className="flex items-center gap-3 p-3 rounded-2xl active:scale-[0.98] transition-transform"
              style={{
                background: `linear-gradient(90deg, ${it.color}1c, ${it.color}08)`,
                border: `1px solid ${it.color}30`,
                borderLeft: `3px solid ${it.color}`,
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${it.color}26` }}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-[12px] font-medium text-foreground/90 flex-1">{it.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}