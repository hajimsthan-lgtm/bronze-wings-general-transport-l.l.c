import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Bell, X, Wrench, FileWarning, FileText } from 'lucide-react';

const ALERT_DAYS = 14;

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

export default function AlertBell() {
  const [alerts, setAlerts] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    (async () => {
      const [inv, vehicles, documents, drivers] = await Promise.all([
        base44.entities.Invoice.list('-created_date', 50).catch(() => []),
        base44.entities.Vehicle.list().catch(() => []),
        base44.entities.Document.list().catch(() => []),
        base44.entities.Driver.list().catch(() => []),
      ]);

      const items = [];
      inv.filter(i => i.status === 'overdue').forEach(i =>
        items.push({ id: `inv-${i.id}`, icon: FileText, color: '#ef4444', title: 'Overdue Invoice', sub: i.client_name || '—', to: '/admin/clients' })
      );
      vehicles.filter(v => v.status === 'maintenance').forEach(v =>
        items.push({ id: `maint-${v.id}`, icon: Wrench, color: '#f59e0b', title: 'In Maintenance', sub: v.plate_number || '—', to: '/admin/vehicles' })
      );
      documents.filter(d => d.status === 'expiring_soon' || d.status === 'expired').forEach(d =>
        items.push({ id: `doc-${d.id}`, icon: FileWarning, color: '#f59e0b', title: 'Document Alert', sub: d.title || d.name || '—', to: '/admin/documents' })
      );
      vehicles.forEach(v => {
        const days = daysUntil(v.next_service_date);
        if (days !== null && days <= ALERT_DAYS)
          items.push({ id: `svc-${v.id}`, icon: Wrench, color: '#f97316', title: days < 0 ? 'Service Overdue' : 'Service Due', sub: v.plate_number || '—', to: '/admin/vehicles' });
      });
      drivers.forEach(d => {
        const licDays = daysUntil(d.license_expiry);
        if (licDays !== null && licDays <= ALERT_DAYS)
          items.push({ id: `lic-${d.id}`, icon: FileWarning, color: '#ef4444', title: 'License Expiring', sub: d.name || '—', to: '/admin/drivers' });
        const visaDays = daysUntil(d.visa_expiry);
        if (visaDays !== null && visaDays <= ALERT_DAYS)
          items.push({ id: `visa-${d.id}`, icon: FileWarning, color: '#ef4444', title: 'Visa Expiring', sub: d.name || '—', to: '/admin/drivers' });
      });

      setAlerts(items);
      if (items.length > 0) {
        setShowNotif(true);
        timer.current = setTimeout(() => setShowNotif(false), 5000);
      }
    })();
    return () => clearTimeout(timer.current);
  }, []);

  const closeNotif = () => { clearTimeout(timer.current); setShowNotif(false); };
  const reopen = () => {
    if (alerts.length === 0) return;
    clearTimeout(timer.current);
    setShowNotif(true);
    timer.current = setTimeout(() => setShowNotif(false), 5000);
  };

  const count = alerts.length;

  return (
    <>
      <button
        onClick={reopen}
        aria-label="Alerts"
        title="Alerts"
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 transition-all hover:border-blue-500/30 hover:bg-white/10 hover:text-white"
      >
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center"
            style={{ boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {showNotif && count > 0 && (
        <div
          className="fixed top-20 right-4 z-[60] w-80 max-w-[calc(100vw-2rem)] animate-slide-in-right"
          style={{
            background: 'linear-gradient(165deg, rgba(20,22,30,0.95) 0%, rgba(14,16,24,0.95) 100%)',
            backdropFilter: 'blur(20px) saturate(1.3)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '1rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="relative flex">
                <span className="absolute inline-flex h-2 w-2 rounded-full bg-red-500 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                {count} Alert{count !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={closeNotif}
              className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto thin-scroll p-2 space-y-1">
            {alerts.slice(0, 5).map(a => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.id}
                  to={a.to}
                  onClick={closeNotif}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${a.color}1a`, border: `1px solid ${a.color}33` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: a.color }} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-white truncate">{a.title}</p>
                    <p className="text-[11px] text-white/50 truncate">{a.sub}</p>
                  </div>
                </Link>
              );
            })}
            {count > 5 && (
              <p className="text-center text-[11px] text-white/40 py-1.5">+{count - 5} more</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}