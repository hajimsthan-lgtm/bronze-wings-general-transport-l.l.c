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
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import './perspectiveAlertBanner.css';

const ICONS = {
  FileWarning, Receipt, Truck, Wrench, IdCard, FileText, CalendarClock, CheckCircle2,
  Building2, ShieldCheck, Banknote, UserCheck, Users, ScanLine,
};

// Compliance / KYC items (always present, mixed with live fleet alerts)
const COMPLIANCE_ITEMS = [
  { id: 'comp-bank', icon: 'Building2', severity: 'info', title: 'Bank Account Verified', sub: 'Confirm company bank details on file', meta: 'KYC', to: '/settings', color: '#E8C0C0' },
  { id: 'comp-own', icon: 'ShieldCheck', severity: 'info', title: 'Vehicle Ownership', sub: 'Upload ownership docs for each vehicle', meta: 'Due', to: '/admin/vehicles', color: '#6B9BD9' },
  { id: 'comp-sof', icon: 'Banknote', severity: 'info', title: 'Source of Funds', sub: 'Verify payment origin for large invoices', meta: 'KYC', to: '/accounts/invoices', color: '#D1A687' },
  { id: 'comp-idv', icon: 'UserCheck', severity: 'info', title: 'Driver Identity', sub: 'Check driver ID & visa validity', meta: 'Due', to: '/admin/drivers', color: '#8A56E0' },
  { id: 'comp-rep', icon: 'Users', severity: 'info', title: 'Authorised Representatives', sub: 'Keep signatory list current', meta: 'KYC', to: '/admin/clients', color: '#78B1CA' },
  { id: 'comp-ubo', icon: 'Users', severity: 'info', title: 'UBO Declaration', sub: 'Confirm ultimate beneficial owner', meta: 'KYC', to: '/admin/clients', color: '#98C988' },
  { id: 'comp-aml', icon: 'ScanLine', severity: 'info', title: 'AML Screening', sub: 'Run anti-money-laundering checks', meta: 'Due', to: '/settings', color: '#E6B9B9' },
];

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2, success: 3 };

function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/.{2}/g);
  return m ? m.map((h) => parseInt(h, 16)).join(',') : '0,0,0';
}

export default function PerspectiveAlertBanner() {
  const [alerts, setAlerts] = useState([]);
  const [index, setIndex] = useState(0);
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

  // Auto-advance every 5s
  useEffect(() => {
    if (paused || alerts.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % alerts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [paused, alerts.length]);

  const go = useCallback((delta) => {
    setIndex((i) => (i + delta + alerts.length) % alerts.length);
  }, [alerts.length]);

  const handleClick = useCallback((alert) => {
    navigate(alert.to);
  }, [navigate]);

  if (alerts.length === 0) return null;

  const alert = alerts[index];
  const isCompliance = alert.id?.startsWith('comp-');
  const sev = isCompliance
    ? { color: alert.color, glow: hexToRgb(alert.color) }
    : SEVERITY[alert.severity] || SEVERITY.info;
  const Icon = ICONS[alert.icon] || AlertTriangle;
  const isCritical = alert.severity === 'critical';

  return (
    <div
      className="alert-banner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ '--sev-color': sev.color, '--sev-glow': sev.glow }}
    >
      {/* Left severity accent bar */}
      <div className={`alert-banner-accent ${isCritical ? 'is-critical' : ''}`} />

      {/* Clickable content area */}
      <button
        className="alert-banner-content"
        onClick={() => handleClick(alert)}
        title={`Open ${alert.title}`}
      >
        <span
          className="alert-banner-icon"
          style={{ background: `${sev.color}1a`, borderColor: `${sev.color}40` }}
        >
          <Icon className="w-4 h-4" style={{ color: sev.color }} />
          {isCritical && <Zap className="w-2.5 h-2.5 alert-banner-zap" style={{ color: sev.color }} />}
        </span>

        <div className="alert-banner-text">
          <p className="alert-banner-title">
            {alert.title}
            {isCritical && <span className="alert-banner-critical-tag">Critical</span>}
          </p>
          <p className="alert-banner-sub">{alert.sub}</p>
        </div>

        {alert.meta && <span className="alert-banner-meta">{alert.meta}</span>}
      </button>

      {/* Right controls */}
      <div className="alert-banner-controls">
        <span className="alert-banner-counter">
          <span className="tabular-nums">{index + 1}</span>
          <span className="alert-banner-counter-sep">/</span>
          <span className="tabular-nums">{alerts.length}</span>
        </span>
        <div className="alert-banner-nav">
          <button
            onClick={() => go(-1)}
            className="alert-banner-nav-btn"
            aria-label="Previous alert"
            disabled={alerts.length <= 1}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => go(1)}
            className="alert-banner-nav-btn"
            aria-label="Next alert"
            disabled={alerts.length <= 1}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`alert-banner-progress ${paused ? 'is-paused' : ''}`} key={index}>
        <div className="alert-banner-progress-fill" style={{ '--sev-color': sev.color }} />
      </div>
    </div>
  );
}