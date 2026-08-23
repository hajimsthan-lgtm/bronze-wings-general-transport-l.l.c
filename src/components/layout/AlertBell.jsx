import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { safeAll } from '@/lib/safeRequest';
import { buildAlerts, CATEGORIES, SEVERITY } from '@/lib/alertEngine';
import { getCompanySettings } from '@/lib/companySettings';
import TripsOperationsSection from './TripsOperationsSection';
import {
  Bell, X, ChevronRight, ChevronDown,
  FileWarning, Receipt, Truck, Wrench, IdCard, FileText,
  CalendarClock, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import './alertBellTheme.css';

const ICONS = { FileWarning, Receipt, Truck, Wrench, IdCard, FileText, CalendarClock, CheckCircle2 };
const AUTO_CLOSE_MS = 8000;

export default function AlertBell() {
  const [rawAlerts, setRawAlerts] = useState({ alerts: [], byCategory: {} });
  const [showNotif, setShowNotif] = useState(false);
  const [closing, setClosing] = useState(false);
  const [progress, setProgress] = useState(100);
  const [expanded, setExpanded] = useState(() => {
    // default-expand the first category that has items — set after load
    const e = {};
    Object.keys(CATEGORIES).forEach((k) => (e[k] = false));
    return e;
  });
  const [activeCategory, setActiveCategory] = useState('all');
  const scrollRef = useRef(null);
  const rafRef = useRef(null);
  const [tripsOpsCount, setTripsOpsCount] = useState(0);
  const [tripsOpsCritical, setTripsOpsCritical] = useState(0);
  const [tripsOpsExpanded, setTripsOpsExpanded] = useState(false);
  const closeRef = useRef(null);
  const leaveTimer = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
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
      setRawAlerts(buildAlerts({ invoices, vehicles, documents, drivers, trips, clientPayments, companyDocuments, companyName: settings?.company_name || 'Company' }));
    })();
  }, []);

  const { alerts, byCategory } = useMemo(() => {
    const all = rawAlerts.alerts || [];
    const byCat = {};
    Object.keys(CATEGORIES).forEach((k) => {
      byCat[k] = all.filter((a) => a.category === k);
    });
    return { alerts: all, byCategory: byCat };
  }, [rawAlerts]);

  const count = alerts.length + tripsOpsCount;
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length + tripsOpsCritical;

  const filteredAlerts = activeCategory === 'all' ? alerts : alerts.filter((a) => a.category === activeCategory);

  // Scroll-driven perspective: each item scales/fades based on distance from center
  const updatePerspective = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const center = container.scrollTop + container.clientHeight / 2;
    const items = container.querySelectorAll('[data-bell-item]');
    const ITEM_H = 60;
    const PAD = 120;
    items.forEach((item) => {
      const idx = Number(item.dataset.bellItem);
      const itemCenter = PAD + idx * ITEM_H + 28;
      const offset = (itemCenter - center) / ITEM_H;
      const absOff = Math.abs(offset);
      if (absOff > 3) {
        item.style.opacity = '0';
        item.style.pointerEvents = 'none';
        item.classList.remove('is-center');
        return;
      }
      const scale = Math.max(0.82, 1 - absOff * 0.08);
      const opacity = Math.max(0.15, 1 - absOff * 0.38);
      const isCenter = absOff < 0.5;
      item.style.transform = `scale(${scale})`;
      item.style.opacity = opacity;
      item.style.pointerEvents = isCenter ? 'auto' : 'none';
      item.classList.toggle('is-center', isCenter);
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(updatePerspective);
  }, [updatePerspective]);

  // Initialize perspective when dropdown opens or filter changes
  useEffect(() => {
    if (!showNotif) return;
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
      updatePerspective();
    });
  }, [showNotif, activeCategory, filteredAlerts.length, updatePerspective]);

  const handleTripsOpsCount = useCallback((info) => {
    setTripsOpsCount(info.count || 0);
    setTripsOpsCritical(info.critical || 0);
  }, []);

  // Auto-expand the first non-empty category on first open
  useEffect(() => {
    if (showNotif && count > 0) {
      setExpanded((prev) => {
        const anyOpen = Object.values(prev).some(Boolean);
        if (anyOpen) return prev;
        const firstKey = Object.keys(CATEGORIES).find((k) => byCategory[k]?.length);
        return firstKey ? { ...prev, [firstKey]: true } : prev;
      });
    }
  }, [showNotif, count]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleAlertClick = (to) => { handleClose(); navigate(to); };

  const badgeColor = criticalCount > 0 ? '#ef4444' : count > 0 ? '#f59e0b' : '#10b981';
  const badgeGlow = criticalCount > 0 ? 'rgba(239,68,68,0.6)' : count > 0 ? 'rgba(245,158,11,0.6)' : 'rgba(16,185,129,0.6)';
  const dotGlow = criticalCount > 0 ? 'rgba(239,68,68,0.8)' : count > 0 ? 'rgba(245,158,11,0.8)' : 'rgba(16,185,129,0.8)';

  const visibleCategories = Object.keys(CATEGORIES).filter((k) => (byCategory[k] || []).length > 0);

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
        className="alert-bell-btn relative flex items-center justify-center w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/70 transition-all hover:border-[rgb(var(--panel-accent-rgb))]/30 hover:bg-white/10 hover:text-white"
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
            style={{ background: badgeColor, boxShadow: `0 0 6px ${dotGlow}`, animation: 'live-pulse 1.6s ease-in-out infinite' }}
          />
        )}
      </button>

      {showNotif && (
        <div
          className="absolute top-full right-0 mt-2 z-[60] w-[360px] max-w-[calc(100vw-1.5rem)] overflow-hidden"
          style={{
            animation: closing ? 'notif-out 0.2s cubic-bezier(0.16,1,0.3,1) forwards' : 'notif-in 0.3s cubic-bezier(0.16,1,0.3,1) both',
          }}
          onMouseEnter={() => { pauseAutoClose(); clearTimeout(leaveTimer.current); }}
          onMouseLeave={handleMouseLeave}
        >
          <div
            className="alert-bell-panel"
            style={{
              background: 'linear-gradient(165deg, rgba(20,22,30,0.96) 0%, rgba(14,16,24,0.96) 100%)',
              backdropFilter: 'blur(24px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '1.1rem',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(var(--panel-accent-rgb),0.06)',
            }}
          >
            {/* Header */}
            <div className="relative px-4 pt-3.5 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex">
                    <span className="absolute inline-flex h-2.5 w-2.5 rounded-full opacity-75 animate-ping" style={{ background: badgeColor }} />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: badgeColor }} />
                  </span>
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-white leading-none">Notifications</p>
                    <p className="text-[10px] text-white/45 mt-1 leading-none">
                      {count > 0 ? `${count} active alert${count !== 1 ? 's' : ''}` : 'All clear'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleClose}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Category filter chips */}
              {count > 0 && (
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide transition-all"
                    style={
                      activeCategory === 'all'
                        ? { background: 'rgba(var(--panel-accent-rgb),0.2)', border: '1px solid rgba(var(--panel-accent-rgb),0.4)', color: '#fff' }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
                    }
                  >
                    All {count}
                  </button>
                  {visibleCategories.map((k) => {
                    const cat = CATEGORIES[k];
                    const n = byCategory[k].length;
                    const isActive = activeCategory === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setActiveCategory(isActive ? 'all' : k)}
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide transition-all flex items-center gap-1"
                        style={
                          isActive
                            ? { background: `${cat.color}26`, border: `1px solid ${cat.color}66`, color: '#fff' }
                            : { background: `${cat.color}14`, border: `1px solid ${cat.color}33`, color: `${cat.color}` }
                        }
                      >
                        {n}
                      </button>
                    );
                  })}
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

            {/* Categorized feed */}
            {count > 0 ? (
              <div className="bell-feed-container">
                {activeCategory === 'all' && (
                  <TripsOperationsSection
                    expanded={tripsOpsExpanded}
                    onToggle={() => setTripsOpsExpanded((p) => !p)}
                    onCountChange={handleTripsOpsCount}
                  />
                )}
                {filteredAlerts.length > 0 ? (
                  <div
                    className="bell-perspective-scroll"
                    ref={scrollRef}
                    onScroll={handleScroll}
                  >
                    <div className="bell-perspective-list">
                      {filteredAlerts.map((a, i) => {
                        const Icon = ICONS[a.icon] || AlertTriangle;
                        const sev = SEVERITY[a.severity] || SEVERITY.info;
                        return (
                          <div
                            key={a.id}
                            data-bell-item={i}
                            className={`bell-perspective-item ${a.severity === 'critical' ? 'is-critical' : ''}`}
                            style={{ '--sev-color': sev.color, '--sev-glow': sev.glow }}
                            onClick={() => handleAlertClick(a.to)}
                          >
                            <span
                              className="bell-perspective-icon"
                              style={{ background: `${sev.color}1a`, border: `1px solid ${sev.color}40` }}
                            >
                              <Icon className="w-4 h-4" style={{ color: sev.color }} />
                              {a.severity === 'critical' && (
                                <span
                                  className="bell-perspective-pulse"
                                  style={{ background: sev.color, boxShadow: `0 0 6px ${sev.color}` }}
                                />
                              )}
                            </span>
                            <div className="bell-perspective-text">
                              <p className="bell-perspective-title">{a.title}</p>
                              <p className="bell-perspective-sub">{a.sub}</p>
                              {a.meta && <p className="bell-perspective-meta">{a.meta}</p>}
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <p className="text-[11px] text-white/40">No alerts in this category</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4">
                <span className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
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