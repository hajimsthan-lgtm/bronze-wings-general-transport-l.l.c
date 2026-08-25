import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight,
  Plus, FileText, Truck, ChevronRight, Receipt, Building2,
  AlertTriangle, Wrench, FileWarning, Route, Users, Gauge,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatters';
import { safeListAll } from '@/lib/safeRequest';

/**
 * New mobile-native home screen — full-bleed, screen-optimized cards.
 * Dark glassmorphism theme preserved. No web-app grid patterns.
 */
export default function MobileHomeScreen({
  totalRevenue, totalTrips, activeTrips, completedTrips,
  pendingInvoices, dueAmount, invoices, expenses, trips,
  overdueCount, maintenanceCount, expiringDocCount, hasAlerts,
  onNewTrip,
}) {
  const navigate = useNavigate();
  const [clientPayments, setClientPayments] = useState([]);
  const [cashTxns, setCashTxns] = useState([]);
  const [bankRecs, setBankRecs] = useState([]);
  const [vendorTxns, setVendorTxns] = useState([]);

  const loadData = useCallback(async () => {
    const [cp, ct, br, vt] = await safeListAll([
      () => base44.entities.ClientPayment.list('-created_date', 20).catch(() => []),
      () => base44.entities.CashTransaction.list('-created_date', 20).catch(() => []),
      () => base44.entities.BankReconciliation.list('-created_date', 20).catch(() => []),
      () => base44.entities.VendorTransaction.list('-created_date', 20).catch(() => []),
    ]);
    setClientPayments(cp); setCashTxns(ct); setBankRecs(br); setVendorTxns(vt);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Financial aggregates
  const deposits = clientPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
    + bankRecs.reduce((s, r) => s + (Number(r.deposit) || 0), 0)
    + cashTxns.filter((t) => t.type === 'inflow').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const withdrawals = expenses.reduce((s, e) => s + (Number(e.total_with_vat) || Number(e.amount) || 0), 0)
    + bankRecs.reduce((s, r) => s + (Number(r.withdrawal) || 0), 0)
    + cashTxns.filter((t) => t.type === 'outflow').reduce((s, t) => s + (Number(t.amount) || 0), 0)
    + vendorTxns.reduce((s, v) => s + (Number(v.amount) || 0), 0);
  const netBalance = deposits - withdrawals;

  // Merge all recent transactions for the feed
  const allTxns = [
    ...bankRecs.map((r) => ({ id: 'b' + r.id, date: r.date, desc: r.description || 'Bank', amt: (Number(r.deposit) || 0) - (Number(r.withdrawal) || 0), ref: r.reference })),
    ...cashTxns.map((t) => ({ id: 'c' + t.id, date: t.date, desc: t.description || t.category || 'Cash', amt: t.type === 'inflow' ? Number(t.amount) || 0 : -(Number(t.amount) || 0), ref: t.receipt_number })),
    ...clientPayments.map((p) => ({ id: 'p' + p.id, date: p.date, desc: p.description || 'Client Payment', amt: Number(p.amount) || 0, ref: '' })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 8);

  // Quick action tiles
  const quickTiles = [
    { label: 'New Trip', icon: Truck, color: '#fb923c', path: '/trips?new=1' },
    { label: 'Invoice', icon: FileText, color: '#22c55e', path: '/accounts/invoices?new=1' },
    { label: 'Expense', icon: Receipt, color: '#f97316', path: '/expenses?new=1' },
    { label: 'Quotation', icon: FileText, color: '#06b6d4', path: '/accounts/quotations?new=1' },
  ];

  // Alert items
  const alerts = [];
  if (overdueCount > 0) alerts.push({ icon: FileWarning, label: `${overdueCount} overdue invoice${overdueCount !== 1 ? 's' : ''}`, color: '#ef4444', path: '/accounts/invoices' });
  if (maintenanceCount > 0) alerts.push({ icon: Wrench, label: `${maintenanceCount} vehicle${maintenanceCount !== 1 ? 's' : ''} in maintenance`, color: '#f59e0b', path: '/admin/vehicles' });
  if (expiringDocCount > 0) alerts.push({ icon: FileWarning, label: `${expiringDocCount} expiring document${expiringDocCount !== 1 ? 's' : ''}`, color: '#f59e0b', path: '/admin/documents' });

  return (
    <div className="px-3.5 pt-3 pb-2 space-y-3.5">
      {/* ═══ Hero balance — full-bleed gradient card ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[20px] p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(140deg, rgba(var(--panel-accent-rgb),0.28) 0%, rgba(var(--surf-2-rgb),0.92) 55%)',
          border: '1px solid rgba(var(--panel-accent-rgb),0.30)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 12px 36px rgba(0,0,0,0.30)',
        }}
      >
        {/* Ambient glow */}
        <div className="absolute -top-12 -right-8 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(var(--panel-accent-rgb),0.20), transparent 70%)' }} />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(145deg, rgba(var(--panel-accent-rgb),0.35), rgba(var(--panel-accent-rgb),0.12))', border: '1px solid rgba(var(--panel-accent-rgb),0.35)' }}>
              <Wallet className="w-4 h-4" style={{ color: 'rgb(var(--panel-accent2-rgb))' }} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-[0.14em] font-bold text-white/45">Fleet Account</p>
              <p className="text-[11px] font-medium text-white/75">Net Cash Balance</p>
            </div>
          </div>
        </div>

        <p className="relative text-[32px] font-bold text-white tabular-nums mt-3 leading-none"
          style={{ fontFamily: 'var(--font-display)' }}>
          {formatCurrency(netBalance)}
        </p>

        <div className="relative flex items-center gap-4 mt-2.5">
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {formatCurrency(deposits)}
          </span>
          <span className="text-[11px] text-red-400 font-semibold flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> {formatCurrency(withdrawals)}
          </span>
        </div>

        {/* Action row */}
        <div className="relative flex gap-2 mt-4">
          <button
            onClick={() => navigate('/accounts/invoices')}
            className="flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-bold text-white active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, rgb(var(--panel-accent-rgb)), rgb(var(--panel-accent2-rgb)))', boxShadow: '0 4px 14px -4px rgba(var(--panel-accent-rgb),0.5)' }}
          >
            <ArrowDownLeft className="w-4 h-4" /> Receive
          </button>
          <button
            onClick={() => navigate('/expenses')}
            className="flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 text-[12px] font-bold text-white active:scale-95 transition-transform border"
            style={{ background: 'rgba(239,68,68,0.18)', borderColor: 'rgba(239,68,68,0.35)' }}
          >
            <ArrowUpRight className="w-4 h-4" /> Pay
          </button>
        </div>
      </motion.div>

      {/* ═══ Quick action tiles — 4-up row, full width ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-4 gap-2.5"
      >
        {quickTiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <button
              key={tile.label}
              onClick={() => navigate(tile.path)}
              className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
            >
              <div
                className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(145deg, ${tile.color}, ${tile.color}bb)`,
                  boxShadow: `0 6px 16px -4px ${tile.color}66, inset 0 1px 0 rgba(255,255,255,0.20)`,
                }}
              >
                <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <span className="text-[10px] font-semibold text-foreground/70 text-center leading-tight">{tile.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* ═══ Stats strip — 3 columns edge-to-edge ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-3 gap-2.5"
      >
        <StatBlock icon={Route} value={totalTrips} label="Trips" color="#fb923c" />
        <StatBlock icon={FileText} value={pendingInvoices} label="Pending" color="#fbbf24" />
        <StatBlock icon={Gauge} value={completedTrips} label="Done" color="#22c55e" />
      </motion.div>

      {/* ═══ Alerts — compact strip ═══ */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-2"
        >
          {alerts.map((alert, i) => {
            const Icon = alert.icon;
            return (
              <Link
                key={i}
                to={alert.path}
                className="flex items-center gap-3 p-3 rounded-2xl active:scale-[0.98] transition-transform"
                style={{
                  background: `linear-gradient(90deg, ${alert.color}18, ${alert.color}08)`,
                  border: `1px solid ${alert.color}30`,
                  borderLeft: `3px solid ${alert.color}`,
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${alert.color}25` }}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-[12px] font-medium text-foreground/90 flex-1">{alert.label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>
            );
          })}
        </motion.div>
      )}

      {/* ═══ Recent transactions — full-width list ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center justify-between mb-2.5 px-1">
          <p className="text-[14px] font-bold text-foreground">Recent Transactions</p>
          <Link to="/reports/bank-reconciliation" className="text-[11px] font-semibold text-primary flex items-center gap-0.5">
            View all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{
          background: 'linear-gradient(180deg, rgba(var(--surf-1-rgb),0.60) 0%, rgba(var(--surf-2-rgb),0.70) 100%)',
          border: '1px solid rgba(var(--panel-accent-rgb),0.10)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}>
          {allTxns.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-7 h-7 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-[12px] text-muted-foreground">No transactions yet</p>
            </div>
          ) : allTxns.map((txn, i) => (
            <div
              key={txn.id}
              className={`flex items-center gap-3 px-3.5 py-3 ${i < allTxns.length - 1 ? 'border-b border-border/40' : ''}`}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: txn.amt >= 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  border: `1px solid ${txn.amt >= 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                }}
              >
                {txn.amt >= 0
                  ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  : <ArrowUpRight className="w-4 h-4 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground truncate">{txn.desc || '—'}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {txn.date || '—'}{txn.ref ? ` · ${txn.ref}` : ''}
                </p>
              </div>
              <p className={`text-[13px] font-bold tabular-nums shrink-0 ${txn.amt >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {txn.amt >= 0 ? '+' : '−'}{formatCurrency(Math.abs(txn.amt))}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function StatBlock({ icon: Icon, value, label, color }) {
  return (
    <div
      className="rounded-2xl p-3 flex flex-col items-center justify-center gap-1"
      style={{
        background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.60) 0%, rgba(var(--surf-2-rgb),0.75) 100%)',
        border: '1px solid rgba(var(--panel-accent-rgb),0.10)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <p className="text-[18px] font-bold text-foreground tabular-nums leading-none">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
    </div>
  );
}