import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { safeAll } from '@/lib/safeRequest';
import { buildAlerts, SEVERITY } from '@/lib/alertEngine';
import { getCompanySettings } from '@/lib/companySettings';
import {
  FileWarning, Receipt, Truck, Wrench, IdCard, FileText,
  CalendarClock, CheckCircle2, AlertTriangle,
  Building2, ShieldCheck, Banknote, UserCheck, Users, ScanLine, Zap,
} from 'lucide-react';
import './perspectiveAlertBanner.css';

const ICONS = {
  FileWarning, Receipt, Truck, Wrench, IdCard, FileText, CalendarClock, CheckCircle2,
  Building2, ShieldCheck, Banknote, UserCheck, Users, ScanLine,
};

// Compliance / KYC items (always present, mixed with live fleet alerts)
const COMPLIANCE_ITEMS = [
  { id: 'comp-bank', icon: 'Building2', severity: 'info', title: 'Bank Account', sub: 'Verify bank details', meta: 'KYC', to: '/settings', color: '#E8C0C0' },
  { id: 'comp-own', icon: 'ShieldCheck', severity: 'info', title: 'Ownership', sub: 'Vehicle ownership docs', meta: 'Due', to: '/admin/vehicles', color: '#6B9BD9' },
  { id: 'comp-sof', icon: 'Banknote', severity: 'info', title: 'Source of Funds', sub: 'Payment verification', meta: 'KYC', to: '/accounts/invoices', color: '#D1A687' },
  { id: 'comp-idv', icon: 'UserCheck', severity: 'info', title: 'Identity Verification', sub: 'Driver ID & visa check', meta: 'Due', to: '/admin/drivers', color: '#8A56E0' },
  { id: 'comp-rep', icon: 'Users', severity: 'info', title: 'Representatives', sub: 'Authorized signatories', meta: 'KYC', to: '/admin/clients', color: '#78B1CA' },
  { id: 'comp-ubo', icon: 'Users', severity: 'info', title: 'UBO', sub: 'Ultimate beneficial owner', meta: 'KYC', to: '/admin/clients', color: '#98C988' },
  { id: 'comp-aml', icon: 'ScanLine', severity: 'info', title: 'AML Screening', sub: 'Anti-money laundering check', meta: 'Due', to: '/settings', color: '#E6B9B9' },
];

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2, success: 3 };

function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/.{2}/g);
  return m ? m.map((h) => parseInt(h, 16)).join(',') : '0,0,0';
}

export default function PerspectiveAlertBanner() {
  const [alerts, setAlerts] = useState([]);
  const [centerIndex, setCenterIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let fleetAlerts = [];
      try {
        const [invoices, vehicles, documents, drivers, trips, clientPayments, companyDocuments, settings] = await safeAll([
          () => base44.entities.Invoice.list('-created_date', 80).catch(() => []),
          () => base44.entities.Vehicle.list().catch(() => []),
          () => base44.entities.Document.list().catch(() => []),
          () => base44.entities.Driver.list().catch(() => []),
          () => base44.entities.Trip.list('-trip_date', 50).catch(() => []),
          () => base44.entities.ClientPayment.list('-created_date', 50).catch(() => []),
          () => base44.entities.CompanyDocument.list().catch(() => []),
          () => getCompanySettings().catch(() => ({})),
        ], 1);
        const { alerts: fa } = buildAlerts({
          invoices, vehicles, documents, drivers, trips, clientPayments,
          companyDocuments, companyName: settings?.company_name || 'Company',
        });
        fleetAlerts = fa || [];
      } catch (e) {
        // API failures fall back to compliance-only items
      }
      if (cancelled) return;
      const all = [...fleetAlerts, ...COMPLIANCE_ITEMS]
        .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2))
        .slice(0, 15);
      setAlerts(all);
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-advance every 4s
  useEffect(() => {
    if (paused || alerts.length <= 1) return;
    const timer = setInterval(() => {
      setCenterIndex((i) => (i + 1) % alerts.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [paused, alerts.length]);

  const handleClick = useCallback((alert) => {
    navigate(alert.to);
  }, [navigate]);

  if (alerts.length === 0) return null;

  const N = alerts.length;

  return (
    <div
      className="perspective-banner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="perspective-banner-glow" />
      <div className="perspective-banner-track">
        {alerts.map((alert, i) => {
          let offset = i - centerIndex;
          if (offset > N / 2) offset -= N;
          if (offset < -N / 2) offset += N;
          const absOffset = Math.abs(offset);
          if (absOffset > 2) return null;

          const isCompliance = alert.id?.startsWith('comp-');
          const sev = isCompliance
            ? { color: alert.color, glow: hexToRgb(alert.color) }
            : SEVERITY[alert.severity] || SEVERITY.info;
          const Icon = ICONS[alert.icon] || AlertTriangle;
          const isCenter = offset === 0;
          const scale = Math.max(0.72, 1 - absOffset * 0.13);
          const opacity = Math.max(0.12, 1 - absOffset * 0.38);

          return (
            <div
              key={alert.id}
              className={`perspective-banner-item ${isCenter ? 'is-center' : ''} ${alert.severity === 'critical' ? 'is-critical' : ''}`}
              style={{
                transform: `translateX(calc(${offset} * min(260px, 22vw))) translateY(-50%) scale(${scale})`,
                opacity,
                zIndex: 10 - absOffset,
                pointerEvents: isCenter ? 'auto' : 'none',
                '--sev-color': sev.color,
                '--sev-glow': sev.glow,
              }}
              onClick={() => isCenter && handleClick(alert)}
            >
              <div className="perspective-banner-card">
                <span
                  className="perspective-banner-icon-wrap"
                  style={{ background: `${sev.color}1a`, borderColor: `${sev.color}40` }}
                >
                  <Icon className="w-4 h-4" style={{ color: sev.color }} />
                </span>
                <div className="perspective-banner-text">
                  <p className="perspective-banner-title">{alert.title}</p>
                  <p className="perspective-banner-sub">{alert.sub}</p>
                </div>
                {alert.meta && <span className="perspective-banner-meta">{alert.meta}</span>}
                {isCenter && alert.severity === 'critical' && (
                  <Zap className="w-3 h-3 perspective-banner-zap" style={{ color: sev.color }} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation dots */}
      <div className="perspective-banner-dots">
        {alerts.map((_, i) => (
          <button
            key={i}
            onClick={() => setCenterIndex(i)}
            className={`perspective-banner-dot ${i === centerIndex ? 'active' : ''}`}
            aria-label={`Alert ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}