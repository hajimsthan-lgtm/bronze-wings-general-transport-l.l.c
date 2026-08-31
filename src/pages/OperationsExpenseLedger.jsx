import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Receipt, Filter, TrendingDown, Fuel, Wrench, Truck, ArrowLeft, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { safeListAll } from '@/lib/safeRequest';
import { formatCurrency } from '@/lib/formatters';

const NEON_BORDER = 'linear-gradient(135deg, rgba(99,102,241,0.55), rgba(6,182,212,0.45) 50%, rgba(139,92,246,0.55))';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: Receipt, color: '#6366f1' },
  { key: 'fuel', label: 'Fuel', icon: Fuel, color: '#f59e0b' },
  { key: 'maintenance', label: 'Maintenance', icon: Wrench, color: '#8b5cf6' },
  { key: 'toll', label: 'Toll', icon: Truck, color: '#06b6d4' },
  { key: 'salary', label: 'Salary', icon: Receipt, color: '#14b8a6' },
  { key: 'other', label: 'Other', icon: Receipt, color: '#64748b' },
];

const CAT_STYLE = {
  fuel: { bg: '#fffbeb', border: '#fde68a', icon: '#f59e0b' },
  maintenance: { bg: '#f5f3ff', border: '#ddd6fe', icon: '#8b5cf6' },
  toll: { bg: '#ecfeff', border: '#cffafe', icon: '#06b6d4' },
  salary: { bg: '#f0fdf4', border: '#bbf7d0', icon: '#14b8a6' },
  insurance: { bg: '#fff1f2', border: '#fecdd3', icon: '#f43f5e' },
  registration: { bg: '#f0f9ff', border: '#bae6fd', icon: '#0ea5e9' },
  office: { bg: '#f8fafc', border: '#e2e8f0', icon: '#64748b' },
  other: { bg: '#f8fafc', border: '#e2e8f0', icon: '#64748b' },
};

export default function OperationsExpenseLedger() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    const [e, fr, sr] = await safeListAll([
      () => base44.entities.Expense.list('-created_date', 100).catch(() => []),
      () => base44.entities.FuelRecord.list('-created_date', 50).catch(() => []),
      () => base44.entities.ServiceRecord.list('-created_date', 50).catch(() => []),
    ]);
    // Merge fuel + service records into a unified expense view
    const fuelExp = fr.map((f) => ({
      id: 'f' + f.id, date: f.date, category: 'fuel',
      description: `Fuel · ${f.vehicle_plate || ''} · ${f.liters || 0}L`,
      amount: Number(f.total_cost) || 0, vehicle_plate: f.vehicle_plate, vendor_name: f.station_name,
    }));
    const svcExp = sr.map((s) => ({
      id: 's' + s.id, date: s.date, category: 'maintenance',
      description: `Service · ${s.service_type || ''} · ${s.vehicle_plate || ''}`,
      amount: Number(s.cost) || 0, vehicle_plate: s.vehicle_plate, vendor_name: s.vendor_name,
    }));
    const allExp = [...e, ...fuelExp, ...svcExp].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    setExpenses(allExp);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const vehicles = useMemo(() => {
    const set = new Set();
    expenses.forEach((e) => { if (e.vehicle_plate) set.add(e.vehicle_plate); });
    return Array.from(set).sort();
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (activeCat !== 'all' && e.category !== activeCat) return false;
      if (vehicleFilter !== 'all' && e.vehicle_plate !== vehicleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const match = (e.description || '').toLowerCase().includes(q) ||
          (e.vendor_name || '').toLowerCase().includes(q) ||
          (e.vehicle_plate || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [expenses, activeCat, vehicleFilter, search]);

  const totalAmount = filtered.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const byCat = CATEGORIES.filter((c) => c.key !== 'all').map((c) => ({
    ...c,
    total: expenses.filter((e) => e.category === c.key).reduce((s, e) => s + (Number(e.amount) || 0), 0),
    count: expenses.filter((e) => e.category === c.key).length,
  }));

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{ background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
        <div className="flex items-center gap-3 mb-3">
          <Link to="/" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#f4f4f5', border: '1px solid #ececf0' }}>
            <ArrowLeft className="w-4 h-4 text-black" strokeWidth={2.2} />
          </Link>
          <div className="flex-1">
            <h1 className="text-[18px] font-bold text-black leading-tight" style={{ fontFamily: 'var(--font-display)' }}>Operations Ledger</h1>
            <p className="text-[11px] text-slate-400">Expense tracking by category</p>
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
            <Receipt className="w-4 h-4 text-white" strokeWidth={2.2} />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses, vehicles, vendors..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-[12px] text-black bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 outline-none"
            style={{ border: '1px solid #ececf0' }}
          />
        </div>
      </div>

      <div className="px-4 pt-4 pb-28 space-y-4">
        {/* Summary card with neon edge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-[22px] p-4 bg-white"
          style={{ border: '1px solid #ececf0', boxShadow: '0 2px 10px rgba(0,0,0,0.04), 0 0 0 1px rgba(99,102,241,0.08), 0 0 24px -8px rgba(99,102,241,0.25)' }}
        >
          <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full" style={{ background: NEON_BORDER, boxShadow: '0 0 12px rgba(99,102,241,0.5)' }} />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
              <TrendingDown className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />
            </div>
            <h3 className="text-[14px] font-bold text-black" style={{ fontFamily: 'var(--font-display)' }}>Total Expenses</h3>
          </div>
          <p className="text-[28px] font-bold text-black tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>{formatCurrency(totalAmount)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{filtered.length} transactions{activeCat !== 'all' ? ` · ${CATEGORIES.find((c) => c.key === activeCat)?.label}` : ''}</p>

          {/* Category breakdown chips */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {byCat.filter((c) => c.total > 0).map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.key} className="rounded-xl p-2" style={{ background: c.color + '0a', border: `1px solid ${c.color}22` }}>
                  <Icon className="w-3.5 h-3.5 mb-1" style={{ color: c.color }} strokeWidth={2.2} />
                  <p className="text-[10px] text-slate-500 truncate">{c.label}</p>
                  <p className="text-[11px] font-bold text-black tabular-nums">{formatCurrency(c.total)}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Category filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2} />
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCat === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCat(cat.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all"
                style={active
                  ? { background: cat.color, color: '#fff', boxShadow: `0 2px 8px ${cat.color}44` }
                  : { background: '#f8fafc', color: '#64748b', border: '1px solid #ececf0' }}
              >
                <Icon className="w-3 h-3" strokeWidth={2.2} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Vehicle filter */}
        {vehicles.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={2} />
            <button
              onClick={() => setVehicleFilter('all')}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0"
              style={vehicleFilter === 'all'
                ? { background: '#1e293b', color: '#fff' }
                : { background: '#f8fafc', color: '#64748b', border: '1px solid #ececf0' }}
            >
              All Vehicles
            </button>
            {vehicles.map((v) => (
              <button
                key={v}
                onClick={() => setVehicleFilter(v)}
                className="px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0"
                style={vehicleFilter === v
                  ? { background: '#1e293b', color: '#fff' }
                  : { background: '#f8fafc', color: '#64748b', border: '1px solid #ececf0' }}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        {/* Expense cards */}
        {loading ? (
          <div className="py-10 text-center">
            <div className="w-7 h-7 border-[3px] border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-[12px] text-slate-400">No expenses match your filters</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((exp, i) => {
              const cat = exp.category || 'other';
              const style = CAT_STYLE[cat] || CAT_STYLE.other;
              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3), ease: [0.22, 1, 0.36, 1] }}
                  className="relative rounded-[18px] p-3.5 bg-white"
                  style={{ border: `1px solid ${style.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                      <Receipt className="w-4 h-4" style={{ color: style.icon }} strokeWidth={2.2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-black truncate">{exp.description || '—'}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: style.bg, color: style.icon }}>
                          {cat}
                        </span>
                        {exp.vehicle_plate && <span className="text-[10px] text-slate-400">{exp.vehicle_plate}</span>}
                        {exp.vendor_name && <span className="text-[10px] text-slate-400">· {exp.vendor_name}</span>}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{exp.date || '—'}</p>
                    </div>
                    <p className="text-[13px] font-bold text-black tabular-nums shrink-0">{formatCurrency(Number(exp.amount) || 0)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}