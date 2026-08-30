import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, FileText, Truck, ChevronRight, Receipt, Building2,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { safeListAll } from '@/lib/safeRequest';
import { useMobileFinance } from '@/hooks/useMobileFinance';
import MobileGreetingStrip from '@/components/dashboard/mobile/MobileGreetingStrip';
import MobileFleetChips from '@/components/dashboard/mobile/MobileFleetChips';
import MobileBalanceCard from '@/components/dashboard/mobile/MobileBalanceCard';
import MobileStatsRow from '@/components/dashboard/mobile/MobileStatsRow';
import MobileTodaySection from '@/components/dashboard/mobile/MobileTodaySection';
import MobileActivityFeed from '@/components/dashboard/mobile/MobileActivityFeed';
import MobileAlertsCard from '@/components/dashboard/mobile/MobileAlertsCard';

/**
 * Mobile-native home screen — glassmorphism, token-driven, light+dark safe.
 */
export default function MobileHomeScreen({
  totalTrips, activeTrips, completedTrips,
  pendingInvoices, dueAmount, invoices, expenses, trips,
  overdueCount, maintenanceCount, expiringDocCount,
  serviceDueCount, driverDocAlertCount,
  vehicles, documents,
}) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [clientPayments, setClientPayments] = useState([]);
  const [cashTxns, setCashTxns] = useState([]);
  const [bankRecs, setBankRecs] = useState([]);
  const [vendorTxns, setVendorTxns] = useState([]);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

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

  const finance = useMobileFinance({ clientPayments, cashTxns, bankRecs, vendorTxns, expenses });

  // Quick action tiles
  const quickTiles = [
    { label: 'New Trip', icon: Truck, color: '#fb923c', path: '/trips?new=1' },
    { label: 'Invoice', icon: FileText, color: '#22c55e', path: '/accounts/invoices?new=1' },
    { label: 'Expense', icon: Receipt, color: '#f97316', path: '/expenses?new=1' },
    { label: 'Quotation', icon: FileText, color: '#06b6d4', path: '/accounts/quotations?new=1' },
  ];

  const fade = (delay) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <div className="px-3.5 pt-3 pb-2 space-y-3.5">
      <motion.div {...fade(0)}>
        <MobileGreetingStrip user={user} />
      </motion.div>

      <motion.div {...fade(0.04)}>
        <MobileBalanceCard finance={finance} />
      </motion.div>

      <motion.div {...fade(0.08)}>
        <MobileFleetChips activeTrips={activeTrips} vehicles={vehicles} />
      </motion.div>

      {/* Quick action tiles */}
      <motion.div {...fade(0.1)} className="grid grid-cols-4 gap-2.5">
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

      <motion.div {...fade(0.14)}>
        <MobileStatsRow
          totalTrips={totalTrips}
          pendingInvoices={pendingInvoices}
          completedTrips={completedTrips}
          dueAmount={dueAmount}
        />
      </motion.div>

      <motion.div {...fade(0.18)}>
        <MobileTodaySection trips={trips} invoices={invoices} documents={documents} />
      </motion.div>

      <motion.div {...fade(0.22)}>
        <MobileActivityFeed
          trips={trips}
          invoices={invoices}
          expenses={expenses}
          clientPayments={clientPayments}
        />
      </motion.div>

      <motion.div {...fade(0.26)}>
        <MobileAlertsCard
          overdueCount={overdueCount}
          maintenanceCount={maintenanceCount}
          expiringDocCount={expiringDocCount}
          serviceDueCount={serviceDueCount}
          driverDocAlertCount={driverDocAlertCount}
        />
      </motion.div>
    </div>
  );
}