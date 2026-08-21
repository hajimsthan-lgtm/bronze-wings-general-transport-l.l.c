// Pure functions that turn raw entity rows into categorized alerts.
// Kept separate from the AlertBell UI so the logic is testable and reusable.

const ALERT_DAYS = 14;
const TRIP_COMPLETION_GRACE_DAYS = 1; // allow 1 day after delivery_date before nagging

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
}

export const CATEGORIES = {
  documents: {
    key: 'documents',
    label: 'Documents & Expiry',
    icon: 'FileWarning',
    color: '#f59e0b',
    glow: '245,158,11',
  },
  payments: {
    key: 'payments',
    label: 'Pending Payments',
    icon: 'Receipt',
    color: '#ef4444',
    glow: '239,68,68',
  },
  trips: {
    key: 'trips',
    label: 'Trips & Operations',
    icon: 'Truck',
    color: '#1ED760',
    glow: '30,215,96',
  },
  maintenance: {
    key: 'maintenance',
    label: 'Maintenance',
    icon: 'Wrench',
    color: '#a855f7',
    glow: '168,85,247',
  },
};

const SEVERITY = {
  critical: { color: '#ef4444', glow: '239,68,68' },
  warning: { color: '#f59e0b', glow: '245,158,11' },
  info: { color: '#1ED760', glow: '30,215,96' },
  success: { color: '#10b981', glow: '16,185,129' },
};

// Recompute document status from expiry_date (source of truth) so we
// catch records whose stored status field is stale.
function docStatus(expiry) {
  const days = daysUntil(expiry);
  if (days === null) return 'valid';
  if (days < 0) return 'expired';
  if (days <= 30) return 'expiring_soon';
  return 'valid';
}

/**
 * Build categorized alerts from entity rows.
 * @param {{invoices: [], vehicles: [], documents: [], drivers: [], trips: [], clientPayments: []}} data
 * @returns {{alerts: [], byCategory: {}}}
 */
export function buildAlerts(data) {
  const { invoices = [], vehicles = [], documents = [], drivers = [], trips = [], clientPayments = [], companyDocuments = [], companyName = 'Company' } = data;
  const items = [];

  // ── Documents & Expiry ──────────────────────────────────────
  // Company-level compliance documents (60-day alert window, escalating severity)
  companyDocuments.forEach((d) => {
    const days = daysUntil(d.expiry_date);
    if (days === null) return;
    const alertWindow = d.alert_days || 60;
    if (days <= alertWindow) {
      items.push({
        id: `cdoc-${d.id}`,
        category: 'documents',
        icon: 'FileWarning',
        severity: (days < 0 || days <= 7) ? 'critical' : 'warning',
        title: days < 0 ? 'Document Expired' : 'Document Expiring',
        sub: `${d.document_type || 'Document'} — ${companyName}`,
        meta: days < 0 ? `${Math.abs(days)}d ago` : `${days}d left`,
        to: `/admin/company-documents?focus=${d.id}`,
      });
    }
  });

  // Standalone documents (entity-attached)
  documents.forEach((d) => {
    const st = d.status || docStatus(d.expiry_date);
    if (st === 'expired' || st === 'expiring_soon') {
      const days = daysUntil(d.expiry_date);
      items.push({
        id: `doc-${d.id}`,
        category: 'documents',
        icon: 'FileWarning',
        severity: st === 'expired' ? 'critical' : 'warning',
        title: st === 'expired' ? 'Document Expired' : 'Document Expiring',
        sub: d.title || d.name || '—',
        meta: days !== null ? (days < 0 ? `${Math.abs(days)}d ago` : `${days}d left`) : '',
        to: '/admin/documents',
      });
    }
  });

  // Vehicle registration / insurance
  vehicles.forEach((v) => {
    const regDays = daysUntil(v.registration_expiry);
    if (regDays !== null && regDays <= ALERT_DAYS) {
      items.push({
        id: `reg-${v.id}`,
        category: 'documents',
        icon: 'FileWarning',
        severity: regDays < 0 ? 'critical' : 'warning',
        title: regDays < 0 ? 'Document Expired' : 'Document Expiring',
        sub: `Vehicle Registration — ${v.plate_number || '—'}`,
        meta: regDays < 0 ? `${Math.abs(regDays)}d ago` : `${regDays}d left`,
        to: `/admin/vehicles/${v.id}`,
      });
    }
    const insDays = daysUntil(v.insurance_expiry);
    if (insDays !== null && insDays <= ALERT_DAYS) {
      items.push({
        id: `ins-${v.id}`,
        category: 'documents',
        icon: 'FileWarning',
        severity: insDays < 0 ? 'critical' : 'warning',
        title: insDays < 0 ? 'Document Expired' : 'Document Expiring',
        sub: `Vehicle Insurance — ${v.plate_number || '—'}`,
        meta: insDays < 0 ? `${Math.abs(insDays)}d ago` : `${insDays}d left`,
        to: `/admin/vehicles/${v.id}`,
      });
    }
  });

  // Driver license & visa
  drivers.forEach((d) => {
    const licDays = daysUntil(d.license_expiry);
    if (licDays !== null && licDays <= ALERT_DAYS) {
      items.push({
        id: `lic-${d.id}`,
        category: 'documents',
        icon: 'IdCard',
        severity: licDays < 0 ? 'critical' : 'warning',
        title: licDays < 0 ? 'Document Expired' : 'Document Expiring',
        sub: `Driving License — ${d.name || '—'}`,
        meta: licDays < 0 ? `${Math.abs(licDays)}d ago` : `${licDays}d left`,
        to: `/admin/drivers/${d.id}`,
      });
    }
    const visaDays = daysUntil(d.visa_expiry);
    if (visaDays !== null && visaDays <= ALERT_DAYS) {
      items.push({
        id: `visa-${d.id}`,
        category: 'documents',
        icon: 'IdCard',
        severity: visaDays < 0 ? 'critical' : 'warning',
        title: visaDays < 0 ? 'Document Expired' : 'Document Expiring',
        sub: `Visa — ${d.name || '—'}`,
        meta: visaDays < 0 ? `${Math.abs(visaDays)}d ago` : `${visaDays}d left`,
        to: `/admin/drivers/${d.id}`,
      });
    }
  });

  // ── Pending Payments ────────────────────────────────────────
  // Overdue invoices
  invoices
    .filter((i) => i.status === 'overdue')
    .forEach((i) =>
      items.push({
        id: `inv-ovd-${i.id}`,
        category: 'payments',
        icon: 'FileText',
        severity: 'critical',
        title: 'Overdue Invoice',
        sub: i.client_name || '—',
        meta: i.invoice_number || '',
        to: '/admin/clients',
      })
    );

  // Partially paid invoices (still has balance)
  invoices
    .filter((i) => i.status === 'partially_paid')
    .forEach((i) => {
      const balance = (i.total_amount || 0) - (i.paid_amount || 0);
      items.push({
        id: `inv-part-${i.id}`,
        category: 'payments',
        icon: 'FileText',
        severity: 'warning',
        title: 'Partial Payment',
        sub: i.client_name || '—',
        meta: `${i.invoice_number || ''} · ${balance.toFixed(0)} due`,
        to: '/admin/clients',
      });
    });

  // Sent invoices past due_date but not yet marked overdue/paid
  invoices
    .filter((i) => i.status === 'sent' && i.due_date)
    .forEach((i) => {
      const days = daysUntil(i.due_date);
      if (days !== null && days <= 3) {
        items.push({
          id: `inv-due-${i.id}`,
          category: 'payments',
          icon: 'CalendarClock',
          severity: days < 0 ? 'critical' : 'warning',
          title: days < 0 ? 'Invoice Past Due' : 'Invoice Due Soon',
          sub: i.client_name || '—',
          meta: `${i.invoice_number || ''} · ${days < 0 ? `${Math.abs(days)}d ago` : `${days}d left`}`,
          to: '/admin/clients',
        });
      }
    });

  // Pending client payments (received but not completed/reconciled)
  clientPayments
    .filter((p) => p.status === 'pending')
    .forEach((p) =>
      items.push({
        id: `cpay-${p.id}`,
        category: 'payments',
        icon: 'Receipt',
        severity: 'warning',
        title: 'Payment Pending',
        sub: p.client_name || '—',
        meta: p.reference_number || '',
        to: '/admin/clients',
      })
    );

  // ── Trips & Operations ──────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Trip completion reminders — delivery_date passed but not completed/cancelled
  trips
    .filter((t) => t.status === 'scheduled' || t.status === 'in_transit')
    .forEach((t) => {
      const dd = t.delivery_date ? new Date(t.delivery_date) : null;
      const td = t.trip_date ? new Date(t.trip_date) : null;
      const ref = dd || td;
      if (!ref) return;
      ref.setHours(0, 0, 0, 0);
      const daysPast = Math.floor((today - ref) / (1000 * 60 * 60 * 24));
      if (daysPast >= TRIP_COMPLETION_GRACE_DAYS) {
        items.push({
          id: `trip-done-${t.id}`,
          category: 'trips',
          icon: 'CheckCircle2',
          severity: daysPast >= 3 ? 'critical' : 'warning',
          title: 'Mark Trip Completed',
          sub: `${t.from_location || '—'} → ${t.to_location || '—'}`,
          meta: `${t.vehicle_plate || ''} · ${daysPast}d overdue`,
          to: '/trips',
        });
      }
    });

  // Scheduled today
  trips
    .filter((t) => t.status === 'scheduled')
    .forEach((t) => {
      const tDate = t.trip_date ? new Date(t.trip_date) : null;
      const isToday = tDate && tDate.toDateString() === today.toDateString();
      if (isToday) {
        items.push({
          id: `trip-sched-${t.id}`,
          category: 'trips',
          icon: 'CalendarClock',
          severity: 'info',
          title: 'Trip Scheduled Today',
          sub: `${t.from_location || '—'} → ${t.to_location || '—'}`,
          meta: t.vehicle_plate || '',
          to: '/trips',
        });
      }
    });

  // In transit
  trips
    .filter((t) => t.status === 'in_transit')
    .forEach((t) =>
      items.push({
        id: `trip-transit-${t.id}`,
        category: 'trips',
        icon: 'Truck',
        severity: 'info',
        title: 'Trip In Transit',
        sub: `${t.from_location || '—'} → ${t.to_location || '—'}`,
        meta: t.driver_name || '',
        to: '/trips',
      })
    );

  // ── Maintenance ──────────────────────────────────────────────
  vehicles
    .filter((v) => v.status === 'maintenance')
    .forEach((v) =>
      items.push({
        id: `maint-${v.id}`,
        category: 'maintenance',
        icon: 'Wrench',
        severity: 'warning',
        title: 'Vehicle In Maintenance',
        sub: v.plate_number || '—',
        meta: `${v.make || ''} ${v.model || ''}`.trim(),
        to: `/admin/vehicles/${v.id}`,
      })
    );

  vehicles.forEach((v) => {
    const days = daysUntil(v.next_service_date);
    if (days !== null && days <= ALERT_DAYS) {
      items.push({
        id: `svc-${v.id}`,
        category: 'maintenance',
        icon: 'Wrench',
        severity: days < 0 ? 'critical' : 'warning',
        title: days < 0 ? 'Service Overdue' : 'Service Due Soon',
        sub: v.plate_number || '—',
        meta: days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`,
        to: `/admin/vehicles/${v.id}`,
      });
    }
  });

  // Group by category, preserving CATEGORIES order
  const byCategory = {};
  Object.keys(CATEGORIES).forEach((k) => {
    byCategory[k] = items.filter((a) => a.category === k);
  });

  return { alerts: items, byCategory };
}

export { SEVERITY };