import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight,
  Plus, MoreHorizontal, FileText, Truck, Fuel, Wrench, Users,
  ChevronRight, Building2, PiggyBank, Receipt
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatters';
import { safeListAll } from '@/lib/safeRequest';
import MobilePaymentsCarousel from './MobilePaymentsCarousel';
import MobileAISuggestions from './MobileAISuggestions';

/**
 * Mobile-only banking-style dashboard adapted to fleet context.
 * Maps banking concepts (balance, deposits/withdrawals, payments, AI suggestions)
 * to fleet entities (ClientPayment, Expense, Invoice, VendorTransaction, CashTransaction, BankReconciliation).
 * Uses the existing dark glassmorphism theme — no theme changes.
 */
export default function MobileBankingDashboard({
  totalRevenue, totalTrips, activeTrips, completedTrips,
  pendingInvoices, dueAmount, invoices, expenses, trips,
  overdueCount, maintenanceCount, expiringDocCount, hasAlerts,
  onNewTrip,
}) {
  const [activeTab, setActiveTab] = useState('bank');
  const [clientPayments, setClientPayments] = useState([]);
  const [cashTxns, setCashTxns] = useState([]);
  const [bankRecs, setBankRecs] = useState([]);
  const [vendorTxns, setVendorTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFinancialData = useCallback(async () => {
    const [cp, ct, br, vt] = await safeListAll([
      () => base44.entities.ClientPayment.list('-created_date', 50).catch(() => []),
      () => base44.entities.CashTransaction.list('-created_date', 50).catch(() => []),
      () => base44.entities.BankReconciliation.list('-created_date', 50).catch(() => []),
      () => base44.entities.VendorTransaction.list('-created_date', 50).catch(() => []),
    ]);
    setClientPayments(cp); setCashTxns(ct); setBankRecs(br); setVendorTxns(vt);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { await loadFinancialData(); } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [loadFinancialData]);

  // === Financial aggregates (banking concepts mapped to fleet) ===
  const depositsFromClients = clientPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const depositsFromBank = bankRecs.reduce((s, r) => s + (Number(r.deposit) || 0), 0);
  const depositsFromCash = cashTxns.filter((t) => t.type === 'inflow').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalDeposits = depositsFromClients + depositsFromBank + depositsFromCash;

  const withdrawalsExpenses = expenses.reduce((s, e) => s + (Number(e.total_with_vat) || Number(e.amount) || 0), 0);
  const withdrawalsBank = bankRecs.reduce((s, r) => s + (Number(r.withdrawal) || 0), 0);
  const withdrawalsCash = cashTxns.filter((t) => t.type === 'outflow').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const withdrawalsVendor = vendorTxns.reduce((s, v) => s + (Number(v.amount) || 0), 0);
  const totalWithdrawals = withdrawalsExpenses + withdrawalsBank + withdrawalsCash + withdrawalsVendor;

  const netBalance = totalDeposits - totalWithdrawals;

  // === Tab-specific data ===
  const tabData = {
    bank: { records: bankRecs, deposits: depositsFromBank, withdrawals: withdrawalsBank, label: 'Bank Rec', icon: Building2 },
    petty: { records: cashTxns, deposits: depositsFromCash, withdrawals: withdrawalsCash, label: 'Petty Cash', icon: PiggyBank },
    invoices: { records: invoices, deposits: depositsFromClients, withdrawals: dueAmount, label: 'Invoices', icon: Receipt },
  };
  const currentTab = tabData[activeTab];

  // === Recent transactions for active tab ===
  const recentTxns = (activeTab === 'bank'
    ? bankRecs.map((r) => ({ id: r.id, date: r.date, desc: r.description || 'Bank transaction', deposit: Number(r.deposit) || 0, withdrawal: Number(r.withdrawal) || 0, ref: r.reference }))
    : activeTab === 'petty'
    ? cashTxns.map((t) => ({ id: t.id, date: t.date, desc: t.description || t.category || 'Cash transaction', deposit: t.type === 'inflow' ? Number(t.amount) || 0 : 0, withdrawal: t.type === 'outflow' ? Number(t.amount) || 0 : 0, ref: t.receipt_number }))
    : invoices.map((i) => ({ id: i.id, date: i.issue_date, desc: i.invoice_number || 'Invoice', deposit: Number(i.paid_amount) || 0, withdrawal: (Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0), ref: i.invoice_number }))
  ).slice(0, 12);

  return (
    <div className="space-y-5 px-4 pt-4 pb-28">
      {/* === Balance Header — deep gradient using theme accent === */}
      <div
        className="rounded-3xl p-5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(var(--panel-accent-rgb),0.22) 0%, rgba(var(--surf-2-rgb),0.88) 60%, rgba(var(--surf-1-rgb),0.92) 100%)',
          border: '1px solid rgba(var(--panel-accent-rgb),0.25)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(145deg, rgba(var(--panel-accent-rgb),0.3), rgba(var(--panel-accent-rgb),0.1))', border: '1px solid rgba(var(--panel-accent-rgb),0.3)' }}
            >
              <Wallet className="w-4 h-4" style={{ color: 'rgb(var(--panel-accent2-rgb))' }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-white/50">Fleet Account</p>
              <p className="text-xs font-medium text-white/80">{currentTab.label}</p>
            </div>
          </div>
          <button className="w-9 h-9 rounded-full glass-sm flex items-center justify-center">
            <MoreHorizontal className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <p className="text-[10px] uppercase tracking-wider font-semibold text-white/45 mt-3">Net Cash Balance</p>
        <p className="text-3xl font-bold text-white tabular-nums mt-1" style={{ fontFamily: 'var(--font-display)' }}>
          {formatCurrency(netBalance)}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {formatCurrency(totalDeposits)} in
          </span>
          <span className="text-[11px] text-red-400 font-medium flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> {formatCurrency(totalWithdrawals)} out
          </span>
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-2 mt-4">
          <Link
            to="/accounts/invoices"
            className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, rgb(var(--panel-accent-rgb)), rgb(var(--panel-accent2-rgb)))', boxShadow: '0 4px 14px -4px rgba(var(--panel-accent-rgb),0.5)' }}
          >
            <ArrowDownLeft className="w-4 h-4" /> Receive
          </Link>
          <Link
            to="/expenses"
            className="flex-1 h-11 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-semibold text-white border"
            style={{ background: 'rgba(239,68,68,0.18)', borderColor: 'rgba(239,68,68,0.35)' }}
          >
            <ArrowUpRight className="w-4 h-4" /> Pay
          </Link>
          <button
            onClick={onNewTrip}
            className="h-11 px-4 rounded-2xl flex items-center justify-center gap-1.5 text-xs font-semibold text-white glass-sm"
          >
            <Plus className="w-4 h-4" /> Trip
          </button>
        </div>
      </div>

      {/* === Account Tabs === */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {Object.entries(tabData).map(([key, val]) => {
          const Icon = val.icon;
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 h-10 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                active ? 'text-white' : 'text-white/50 glass-sm'
              }`}
              style={active ? {
                background: 'linear-gradient(135deg, rgba(var(--panel-accent-rgb),0.25), rgba(var(--panel-accent-rgb),0.1))',
                border: '1px solid rgba(var(--panel-accent-rgb),0.35)',
                boxShadow: '0 0 16px -4px rgba(var(--panel-accent-rgb),0.3)',
              } : {}}
            >
              <Icon className="w-3.5 h-3.5" /> {val.label}
            </button>
          );
        })}
      </div>

      {/* === Summary Cards — 3 columns === */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-tile p-3.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[9px] uppercase tracking-wider text-white/45 font-semibold">Deposits</p>
          <p className="text-sm font-bold text-emerald-400 tabular-nums mt-0.5">{formatCurrency(currentTab.deposits)}</p>
        </div>
        <div className="stat-tile p-3.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-[9px] uppercase tracking-wider text-white/45 font-semibold">Withdrawals</p>
          <p className="text-sm font-bold text-red-400 tabular-nums mt-0.5">{formatCurrency(currentTab.withdrawals)}</p>
        </div>
        <div className="stat-tile p-3.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: 'rgba(var(--panel-accent-rgb),0.15)', border: '1px solid rgba(var(--panel-accent-rgb),0.3)' }}>
            <Wallet className="w-4 h-4" style={{ color: 'rgb(var(--panel-accent2-rgb))' }} />
          </div>
          <p className="text-[9px] uppercase tracking-wider text-white/45 font-semibold">Net</p>
          <p className="text-sm font-bold text-white tabular-nums mt-0.5">{formatCurrency(currentTab.deposits - currentTab.withdrawals)}</p>
        </div>
      </div>

      {/* === Manage Your Payments — horizontal carousel === */}
      <MobilePaymentsCarousel
        invoices={invoices}
        vendorTxns={vendorTxns}
        expenses={expenses}
      />

      {/* === Suggested Management — AI recommendations === */}
      <MobileAISuggestions
        invoices={invoices}
        expenses={expenses}
        trips={trips}
        overdueCount={overdueCount}
        maintenanceCount={maintenanceCount}
        netBalance={netBalance}
        totalWithdrawals={totalWithdrawals}
        totalRevenue={totalRevenue}
      />

      {/* === Recent Transactions for active tab === */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Recent Transactions</p>
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{currentTab.label}</span>
        </div>
        <div className="space-y-2">
          {recentTxns.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <FileText className="w-7 h-7 text-white/30 mx-auto mb-2" />
              <p className="text-xs text-white/50">No transactions yet</p>
            </div>
          ) : recentTxns.map((txn) => (
            <div key={txn.id} className="glass-card-hover p-3 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: txn.deposit > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  border: `1px solid ${txn.deposit > 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                }}
              >
                {txn.deposit > 0
                  ? <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  : <ArrowUpRight className="w-4 h-4 text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{txn.desc || '—'}</p>
                <p className="text-[10px] text-white/40 mt-0.5">
                  {txn.date || '—'}{txn.ref ? ` · ${txn.ref}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-xs font-bold tabular-nums ${txn.deposit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {txn.deposit > 0 ? '+' : '−'}{formatCurrency(txn.deposit > 0 ? txn.deposit : txn.withdrawal)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}