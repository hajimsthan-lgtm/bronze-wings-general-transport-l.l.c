import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Truck, FileText, Receipt, ChevronRight,
  FileWarning, Wrench, Route, Gauge, Cloud, Plus,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatters';
import { safeListAll } from '@/lib/safeRequest';
import BuildFutureCard from '@/components/common/BuildFutureCard';
import FloatingActionButton from '@/components/common/FloatingActionButton';

/**
 * Mobile-native home — clean vertical stack, full-screen, aligned.
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

  const loadData = useCallback(async () => {
    const [cp, ct, br] = await safeListAll([
      () => base44.entities.ClientPayment.list('-created_date', 20).catch(() => []),
      () => base44.entities.CashTransaction.list('-created_date', 20).catch(() => []),
      () => base44.entities.BankReconciliation.list('-created_date', 20).catch(() => []),
    ]);
    setClientPayments(cp); setCashTxns(ct); setBankRecs(br);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Recent transactions feed
  const allTxns = [
    ...bankRecs.map((r) => ({ id: 'b' + r.id, date: r.date, desc: r.description || 'Bank', amt: (Number(r.deposit) || 0) - (Number(r.withdrawal) || 0), ref: r.reference })),
    ...cashTxns.map((t) => ({ id: 'c' + t.id, date: t.date, desc: t.description || t.category || 'Cash', amt: t.type === 'inflow' ? Number(t.amount) || 0 : -(Number(t.amount) || 0), ref: t.receipt_number })),
    ...clientPayments.map((p) => ({ id: 'p' + p.id, date: p.date, desc: p.description || 'Client Payment', amt: Number(p.amount) || 0, ref: '' })),
  ].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6);

  // Quick action tiles
  const quickTiles = [
    { label: 'New Trip', icon: Truck, color: '#fb923c', path: '/trips?new=1' },
    { label: 'Invoice', icon: FileText, color: '#22c55e', path: '/accounts/invoices?new=1' },
    { label: 'Expense', icon: Receipt, color: '#f97316', path: '/expenses?new=1' },
    { label: 'Quotation', icon: FileText, color: '#06b6d4', path: '/accounts/quotations?new=1' },
  ];

  // Alerts
  const alerts = [];
  if (overdueCount > 0) alerts.push({ icon: FileWarning, label: `${overdueCount} overdue invoice${overdueCount !== 1 ? 's' : ''}`, color: '#ef4444', path: '/accounts/invoices' });
  if (maintenanceCount > 0) alerts.push({ icon: Wrench, label: `${maintenanceCount} vehicle${maintenanceCount !== 1 ? 's' : ''} in maintenance`, color: '#f59e0b', path: '/admin/vehicles' });
  if (expiringDocCount > 0) alerts.push({ icon: FileWarning, label: `${expiringDocCount} expiring document${expiringDocCount !== 1 ? 's' : ''}`, color: '#f59e0b', path: '/admin/documents' });

  const today = new Date().toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="px-4 pt-2 pb-4 space-y-4">
      {/* ═══ Greeting + date ═══ */}
      <div className="pt-1">
        <h1 className="text-[24px] font-bold leading-tight text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          Fleet Command
        </h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">{today}</p>
      </div>

      {/* ═══ Hero — Build the future ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <BuildFutureCard onGetStarted={() => navigate('/trips?new=1')} />
      </motion.div>

      {/* ═══ Weather strip — full width, slim ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(96,165,250,0.12) 0%, rgba(167,139,250,0.10) 100%)',
          border: '1px solid rgba(96,165,250,0.18)',
        }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(145deg, rgba(96,165,250,0.25), rgba(167,139,250,0.20))' }}>
          <Cloud className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground">Partly cloudy</p>
          <p className="text-[11px] text-muted-foreground">Dubai · Updated now</p>
        </div>
        <p className="text-[22px] font-bold text-foreground tabular-nums">21°</p>
      </motion.div>

      {/* ═══ Quick actions — 4-up ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
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
                className="w-[50px] h-[50px] rounded-2xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(145deg, ${tile.color}, ${tile.color}bb)`,
                  boxShadow: `0 4px 14px -3px ${tile.color}55, inset 0 1px 0 rgba(255,255,255,0.20)`,
                }}
              >
                <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <span className="text-[10px] font-semibold text-foreground/70 text-center leading-tight">{tile.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* ═══ Stats — 3 columns ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-3 gap-2.5"
      >
        <StatBlock icon={Route} value={totalTrips} label="Trips" color="#fb923c" />
        <StatBlock icon={FileText} value={pendingInvoices} label="Pending" color="#fbbf24" />
        <StatBlock icon={Gauge} value={completedTrips} label="Done" color="#22c55e" />
      </motion.div>

      {/* ═══ Alerts ═══ */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
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

      {/* ═══ Recent transactions ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
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
                <span className="text-[14px] font-bold" style={{ color: txn.amt >= 0 ? '#22c55e' : '#ef4444' }}>
                  {txn.amt >= 0 ? '↓' : '↑'}
                </span>
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

      {/* ═══ FAB ═══ */}
      <FloatingActionButton
        onNewTrip={() => navigate('/trips?new=1')}
        onInvoice={() => navigate('/accounts/invoices?new=1')}
        onExpense={() => navigate('/expenses?new=1')}
      />
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