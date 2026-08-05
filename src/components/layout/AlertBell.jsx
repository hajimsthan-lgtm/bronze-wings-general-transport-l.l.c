import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { safeAll } from '@/lib/safeRequest';
import {
  Bell, X, Wrench, FileWarning, FileText, Truck,
  CalendarClock, IdCard, AlertTriangle, ChevronRight,
} from 'lucide-react';

const ALERT_DAYS = 14;
const AUTO_CLOSE_MS = 6000;

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

const SEVERITY = {
  critical: { color: '#ef4444', glow: '239,68,68' },
  warning: { color: '#f59e0b', glow: '245,158,11' },
  info: { color: '#3b82f6', glow: '59,130,246' },
  success: { color: '#10b981', glow: '16,185,129' },
};

export default function AlertBell() {
  const [alerts, setAlerts] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [closing, setClosing] = useState(false);
  const [progress, setProgress] = useState(100);
  const closeRef = useRef(null);
  const leaveTimer = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const [inv, vehicles, documents, drivers, trips] = await safeAll([
        () => base44.entities.Invoice.list('-created_date', 50).catch(() => []),
        () => base44.entities.Vehicle.list().catch(() => []),
        () => base44.entities.Document.list().catch(() => []),
        () => base44.entities.Driver.list().catch(() => []),
        () => base44.entities.Trip.list('-trip_date', 30).catch(() => []),
      ], 1);

      const items = [];

      // Overdue invoices
      inv.filter(i => i.status === 'overdue').forEach(i =>
        items.push({
          id: `inv-${i.id}`, icon: FileText, severity: 'critical',
          title: 'Overdue Invoice', sub: i.client_name || '—',
          meta: i.invoice_number || '', to: '/admin/clients',
        })
      );

      // Vehicle maintenance
      vehicles.filter(v => v.status === 'maintenance').forEach(v =>
        items.push({
          id: `maint-${v.id}`, icon: Wrench, severity: 'warning',
          title: 'Vehicle In Maintenance', sub: v.plate_number || '—',
          meta: `${v.make || ''} ${v.model || ''}`.trim(), to: '/admin/vehicles',
        })
      );

      // Documents
      documents.filter(d => d.status === 'expiring_soon' || d.status === 'expired').forEach(d =>
        items.push({
          id: `doc-${d.id}`, icon: FileWarning, severity: d.status === 'expired' ? 'critical' : 'warning',
          title: d.status === 'expired' ? 'Document Expired' : 'Document Expiring',
          sub: d.title || d.name || '—', to: '/admin/documents',
        })
      );

      // Vehicle service due
      vehicles.forEach(v => {
        const days = daysUntil(v.next_service_date);
        if (days !== null && days <= ALERT_DAYS)
          items.push({
            id: `svc-${v.id}`, icon: Wrench, severity: days < 0 ? 'critical' : 'warning',
            title: days < 0 ? 'Service Overdue' : 'Service Due Soon',
            sub: v.plate_number || '—',
            meta: days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`,
            to: '/admin/vehicles',
          });
      });

      // Vehicle registration / insurance expiry
      vehicles.forEach(v => {
        const regDays = daysUntil(v.registration_expiry);
        if (regDays !== null && regDays <= ALERT_DAYS)
          items.push({
            id: `reg-${v.id}`, icon: FileWarning, severity: regDays < 0 ? 'critical' : 'warning',
            title: regDays < 0 ? 'Registration Expired' : 'Registration Expiring',
            sub: v.plate_number || '—', meta: regDays < 0 ? `${Math.abs(regDays)}d ago` : `${regDays}d left`,
            to: '/admin/vehicles',
          });
        const insDays = daysUntil(v.insurance_expiry);
        if (insDays !== null && insDays <= ALERT_DAYS)
          items.push({
            id: `ins-${v.id}`, icon: FileWarning, severity: insDays < 0 ? 'critical' : 'warning',
            title: insDays < 0 ? 'Insurance Expired' : 'Insurance Expiring',
            sub: v.plate_number || '—', meta: insDays < 0 ? `${Math.abs(insDays)}d ago` : `${insDays}d left`,
            to: '/admin/vehicles',
          });
      });

      // Driver license & visa
      drivers.forEach(d => {
        const licDays = daysUntil(d.license_expiry);
        if (licDays !== null && licDays <= ALERT_DAYS)
          items.push({
            id: `lic-${d.id}`, icon: IdCard, severity: licDays < 0 ? 'critical' : 'warning',
            title: licDays < 0 ? 'License Expired' : 'License Expiring',
            sub: d.name || '—', meta: licDays < 0 ? `${Math.abs(licDays)}d ago` : `${licDays}d left`,
            to: '/admin/drivers',
          });
        const visaDays = daysUntil(d.visa_expiry);
        if (visaDays !== null && visaDays <= ALERT_DAYS)
          items.push({
            id: `visa-${d.id}`, icon: IdCard, severity: visaDays < 0 ? 'critical' : 'warning',
            title: visaDays < 0 ? 'Visa Expired' : 'Visa Expiring',
            sub: d.name || '—', meta: visaDays < 0 ? `${Math.abs(visaDays)}d ago` : `${visaDays}d left`,
            to: '/admin/drivers',
          });
      });

      // Trip alerts — scheduled (today) & in-transit
      const today = new Date(); today.setHours(0, 0, 0, 0);
      trips.filter(t => t.status === 'scheduled').forEach(t => {
        const tDate = t.trip_date ? new Date(t.trip_date) : null;
        const isToday = tDate && tDate.toDateString() === today.toDateString();
        if (isToday)
          items.push({
            id: `trip-sched-${t.id}`, icon: CalendarClock, severity: 'info',
            title: 'Trip Scheduled Today', sub: `${t.from_location || '—'} → ${t.to_location || '—'}`,
            meta: t.vehicle_plate || '', to: '/trips',
          });
      });
      trips.filter(t => t.status === 'in_transit').forEach(t =>
        items.push({
          id: `trip-transit-${t.id}`, icon: Truck, severity: 'info',
          title: 'Trip In Transit', sub: `${t.from_location || '—'} → ${t.to_location || '—'}`,
          meta: t.driver_name || '', to: '/trips',
        })
      );

      setAlerts(items);
    })();
  }, []);

  const count = alerts.length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;

  // Auto-close with countdown progress
  useEffect(() => {
    if (!showNotif) { setProgress(100); return; }
    setClosing(false);
    setProgress(100);
    const start = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_CLOSE_MS) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(tick);
        setClosing(true);
        setTimeout(() => setShowNotif(false), 200);
      }
    }, 40);
    closeRef.current = tick;
    return () => clearInterval(tick);
  }, [showNotif]);

  const pauseAutoClose = () => {
    if (closeRef.current) clearInterval(closeRef.current);
    setProgress(100);
  };

  const handleOpen = () => { if (!showNotif) setShowNotif(true); };
  const handleClose = () => {
    if (closeRef.current) clearInterval(closeRef.current);
    clearTimeout(leaveTimer.current);
    setClosing(true);
    setTimeout(() => { setShowNotif(false); setClosing(false); }, 200);
  };

  // 3-second hold before closing on mouse leave; outside click closes instantly
  const handleMouseEnter = () => {
    clearTimeout(leaveTimer.current);
    if (!showNotif) setShowNotif(true);
  };
  const handleMouseLeave = () => {
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => handleClose(), 3000);
  };

  useEffect(() => {
    if (!showNotif) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        clearTimeout(leaveTimer.current);
        handleClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotif]);

  const handleAlertClick = (to) => {
    handleClose();
    navigate(to);
  };

  const badgeColor = criticalCount > 0 ? '#ef4444' : '#f59e0b';
  const badgeGlow = criticalCount > 0 ? 'rgba(239,68,68,0.6)' : 'rgba(245,158,11,0.6)';
  const dotGlow = criticalCount > 0 ? 'rgba(239,68,68,0.8)' : 'rgba(245,158,11,0.8)';

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        aria-label="Alerts"
        title="Alerts"
        onClick={() => (showNotif ? handleClose() : handleOpen())}
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 transition-all hover:border-[rgb(var(--panel-accent-rgb))]/30 hover:bg-white/10 hover:text-white"
      >
        <Bell className="w-4 h-4 bell-gold-swing" style={{ color: '#f5c542', filter: 'drop-shadow(0 0 4px rgba(245,197,66,0.5))' }} />
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
            style={{ background: badgeColor, boxShadow: `0 0 8px ${badgeGlow}` }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{
              background: badgeColor,
              boxShadow: `0 0 6px ${dotGlow}`,
              animation: 'live-pulse 1.6s ease-in-out infinite',
            }}
          />
        )}
      </button>

      {showNotif && (
        <div
          className="absolute top-full right-0 mt-2 z-[60] w-[340px] max-w-[calc(100vw-1.5rem)] overflow-hidden"
          style={{
            animation: closing
              ? 'notif-out 0.2s cubic-bezier(0.16,1,0.3,1) forwards'
              : 'notif-in 0.3s cubic-bezier(0.16,1,0.3,1) both',
          }}
          onMouseEnter={() => { pauseAutoClose(); clearTimeout(leaveTimer.current); }}
          onMouseLeave={handleMouseLeave}
        >
          <div
            style={{
              background: 'linear-gradient(165deg, rgba(20,22,30,0.96) 0%, rgba(14,16,24,0.96) 100%)',
              backdropFilter: 'blur(24px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '1.1rem',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(var(--panel-accent-rgb),0.06)',
            }}
          >
            {/* Header — mobile notification center style */}
            <div className="relative px-4 pt-3.5 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex">
                    <span
                      className="absolute inline-flex h-2.5 w-2.5 rounded-full opacity-75 animate-ping"
                      style={{ background: badgeColor }}
                    />
                    <span
                      className="relative inline-flex h-2.5 w-2.5 rounded-full"
                      style={{ background: badgeColor }}
                    />
                  </span>
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-white leading-none">
                      Notifications
                    </p>
                    <p className="text-[10px] text-white/45 mt-1 leading-none">
                      {count > 0 ? `${count} active alert${count !== 1 ? 's' : ''}` : 'All clear'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Severity summary chips */}
              {count > 0 && (
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  {criticalCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide flex items-center gap-1"
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                      <AlertTriangle className="w-2.5 h-2.5" /> {criticalCount} Critical
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide flex items-center gap-1"
                      style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fcd34d' }}>
                      <AlertTriangle className="w-2.5 h-2.5" /> {warningCount} Warning
                    </span>
                  )}
                  {infoCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide flex items-center gap-1"
                      style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
                      <Truck className="w-2.5 h-2.5" /> {infoCount} Info
                    </span>
                  )}
                </div>
              )}

              {/* Auto-close countdown bar */}
              {count > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/[0.04]">
                  <div
                    className="h-full"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, rgb(var(--panel-accent-rgb)), rgb(var(--panel-accent2-rgb)))',
                      boxShadow: '0 0 6px rgba(var(--panel-accent-rgb),0.5)',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Notification feed — mobile-style cards */}
            {count > 0 ? (
              <div className="max-h-[320px] overflow-y-auto thin-scroll p-2 space-y-1.5">
                {alerts.slice(0, 8).map((a, idx) => {
                  const Icon = a.icon;
                  const sev = SEVERITY[a.severity] || SEVERITY.info;
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleAlertClick(a.to)}
                      className="group w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left hover:bg-white/[0.04]"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        animation: 'notif-item-in 0.3s cubic-bezier(0.16,1,0.3,1) both',
                        animationDelay: `${idx * 40}ms`,
                      }}
                    >
                      {/* Icon with severity glow */}
                      <span
                        className="relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: `${sev.color}1a`,
                          border: `1px solid ${sev.color}40`,
                          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 12px -4px rgba(${sev.glow},0.4)`,
                        }}
                      >
                        <Icon className="w-4 h-4" style={{ color: sev.color }} />
                        {a.severity === 'critical' && (
                          <span
                            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                            style={{ background: sev.color, boxShadow: `0 0 6px ${sev.color}`, animation: 'live-pulse 1.6s ease-in-out infinite' }}
                          />
                        )}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-white truncate leading-tight">{a.title}</p>
                        <p className="text-[11px] text-white/55 truncate mt-0.5 leading-tight">{a.sub}</p>
                        {a.meta && (
                          <p className="text-[9.5px] text-white/35 truncate mt-0.5 leading-tight uppercase tracking-wide font-mono">{a.meta}</p>
                        )}
                      </div>

                      {/* Chevron */}
                      <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/60 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </button>
                  );
                })}
                {count > 8 && (
                  <p className="text-center text-[10px] text-white/35 py-2 font-mono uppercase tracking-wider">
                    +{count - 8} more alerts
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <span
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
                >
                  <Bell className="w-5 h-5 text-emerald-400" />
                </span>
                <p className="text-[12px] font-semibold text-white/70">All caught up</p>
                <p className="text-[10px] text-white/40 mt-1">No active alerts right now</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}