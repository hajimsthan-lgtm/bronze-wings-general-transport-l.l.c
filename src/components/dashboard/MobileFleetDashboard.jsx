import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Truck, Fuel, ClipboardList, Users, ShieldAlert, Wrench,
  Search, Sun, Moon, ArrowRight, Sparkles, MapPin, Bell, Home,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatters';
import { safeListAll } from '@/lib/safeRequest';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

const HERO_BG = 'linear-gradient(180deg, #161331 0%, #1f1740 45%, #33256a 100%)';

const scatterTooltip = {
  background: 'rgba(22,19,49,0.96)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 11,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  padding: '8px 10px',
};

const STATUS_PILL = {
  completed: { bg: '#dcfce7', fg: '#16a34a', label: 'Completed' },
  trip_started: { bg: '#dbeafe', fg: '#2563eb', label: 'In Transit' },
  scheduled: { bg: '#fef3c7', fg: '#d97706', label: 'Pending' },
  cancelled: { bg: '#fee2e2', fg: '#dc2626', label: 'Cancelled' },
  trip_ended: { bg: '#e0e7ff', fg: '#4f46e5', label: 'Ended' },
};

export default function MobileFleetDashboard() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isDark, setIsDark] = useState(true);

  const loadData = useCallback(async () => {
    const [v, dr, tr, fr, d] = await safeListAll([
      () => base44.entities.Vehicle.list().catch(() => []),
      () => base44.entities.Driver.list().catch(() => []),
      () => base44.entities.Trip.list('-trip_date', 50).catch(() => []),
      () => base44.entities.FuelRecord.list('-created_date', 50).catch(() => []),
      () => base44.entities.Document.list().catch(() => []),
    ]);
    setVehicles(v); setDrivers(dr); setTrips(tr); setFuelRecords(fr); setDocuments(d);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Metrics
  const activeVehicles = vehicles.filter((v) => v.status === 'active').length;
  const totalVehicles = vehicles.length;
  const onRoad = vehicles.filter((v) => v.status === 'on_road' || v.status === 'in_transit').length;
  const totalLiters = fuelRecords.reduce((s, f) => s + (Number(f.liters) || 0), 0);
  const pendingTrips = trips.filter((t) => t.status === 'scheduled').length;
  const activeDrivers = drivers.length;
  const alertsCount = documents.filter((doc) => doc.status === 'expiring_soon' || doc.status === 'expired').length
    + vehicles.filter((v) => v.status === 'maintenance').length;
  const maintenanceCount = vehicles.filter((v) => v.status === 'maintenance').length;

  const cards = [
    { label: 'Active Vehicles', value: activeVehicles, sub: `${totalVehicles} total fleet`, icon: Truck, from: '#6366f1', to: '#8b5cf6' },
    { label: 'Total Fuel', value: `${Math.round(totalLiters)}`, unit: 'L', sub: `${fuelRecords.length} fills`, icon: Fuel, from: '#f59e0b', to: '#f97316' },
    { label: 'Pending', value: pendingTrips, sub: 'trips scheduled', icon: ClipboardList, from: '#0ea5e9', to: '#06b6d4' },
    { label: 'Drivers', value: activeDrivers, sub: 'in your roster', icon: Users, from: '#06b6d4', to: '#14b8a6' },
    { label: 'Alerts', value: alertsCount, sub: 'need attention', icon: ShieldAlert, from: '#f43f5e', to: '#ec4899' },
    { label: 'Maintenance', value: maintenanceCount, sub: 'in workshop', icon: Wrench, from: '#8b5cf6', to: '#d946ef' },
  ];

  // Fuel efficiency scatter — liters vs cost per fill
  const scatterData = fuelRecords.slice(0, 30).map((f) => ({
    x: Number(f.liters) || 0,
    y: Number(f.price_per_liter) || 0,
    z: Number(f.total_cost) || 0,
    plate: f.vehicle_plate,
  }));

  // Recent trips
  const recentTrips = trips.slice(0, 6);

  return (
    <div className="min-h-screen" style={{ background: '#f7f7f9' }}>
      {/* ═══════ HERO ═══════ */}
      <div
        className="relative px-5 pt-5 pb-7 overflow-hidden"
        style={{ background: HERO_BG }}
      >
        {/* radial white glow top-right */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-60px', right: '-40px', width: '260px', height: '260px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 60%)',
            filter: 'blur(8px)',
          }}
        />

        {/* top bar */}
        <div className="relative flex items-center justify-between mb-7">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #d946ef)', boxShadow: '0 4px 14px -4px rgba(99,102,241,0.6)' }}
            >
              <Sparkles className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-[15px] font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Bronze Wings
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* day/night toggle */}
            <button
              onClick={() => setIsDark((d) => !d)}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)' }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center transition-transform"
                style={{
                  background: isDark ? '#ffcd50' : '#e5e7eb',
                  transform: isDark ? 'translateX(0)' : 'translateX(0)',
                  boxShadow: isDark ? '0 0 10px rgba(255,205,80,0.6)' : 'none',
                }}
              >
                {isDark ? <Sun className="w-3 h-3 text-white" /> : <Moon className="w-3 h-3 text-slate-600" />}
              </span>
            </button>

            {/* search */}
            <button
              onClick={() => navigate('/trips')}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.14)' }}
            >
              <Search className="w-4 h-4 text-white" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* headline */}
        <h1
          className="relative text-white font-bold leading-[1.08] tracking-tight"
          style={{ fontFamily: 'var(--font-display)', fontSize: '32px' }}
        >
          Fleet Command<br />Center
        </h1>

        {/* sub-description */}
        <p
          className="relative mt-3 text-white/70 leading-relaxed"
          style={{ fontSize: '13px', maxWidth: '300px' }}
        >
          A real-time view of your vehicles, drivers, and trips — monitor performance and status in one breathable workspace.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate('/trips')}
          className="relative mt-4 inline-flex items-center gap-1.5 pl-4 pr-3 py-2.5 rounded-full bg-white text-black font-semibold active:scale-95 transition-transform"
          style={{ fontSize: '13px' }}
        >
          Start exploring
          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>

        {/* stats row */}
        <div className="relative mt-4 flex items-center gap-3">
          <span className="text-white/55 text-[11px] font-medium">{totalVehicles} vehicles</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="text-white/55 text-[11px] font-medium">{onRoad} on the road</span>
        </div>
      </div>

      {/* ═══════ CARD GRID ═══════ */}
      <div className="px-4 -mt-4 pb-4">
        <div className="grid grid-cols-2 gap-4">
          {cards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white rounded-[22px] p-4 flex flex-col gap-2.5"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${card.from}, ${card.to})`, boxShadow: `0 4px 14px -4px ${card.from}66` }}
                >
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-black leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    {card.label}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    <span className="font-semibold text-slate-700">{card.value}</span>{card.unit ? ` ${card.unit}` : ''} · {card.sub}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ═══════ FUEL EFFICIENCY CHART ═══════ */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-[22px] p-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[14px] font-bold text-black" style={{ fontFamily: 'var(--font-display)' }}>Fuel Efficiency</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Liters vs price per liter</p>
            </div>
            <Fuel className="w-4 h-4 text-slate-300" />
          </div>
          <div style={{ width: '100%', height: 180 }}>
            {scatterData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-[12px] text-slate-400">No fuel data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 8, bottom: 18, left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Liters"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    label={{ value: 'Liters', position: 'bottom', offset: 4, style: { fontSize: 10, fill: '#94a3b8' } }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Price/L"
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v.toFixed(1)}`}
                  />
                  <ZAxis type="number" dataKey="z" range={[40, 220]} />
                  <Tooltip
                    contentStyle={scatterTooltip}
                    formatter={(v, n) => [n === 'x' ? `${v} L` : n === 'y' ? `₹${v}/L` : `₹${v}`, n]}
                  />
                  <Scatter data={scatterData}>
                    {scatterData.map((d, i) => (
                      <Cell key={i} fill={`url(#fuelGrad${i % 3})`} />
                    ))}
                  </Scatter>
                  <defs>
                    <linearGradient id="fuelGrad0" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                    <linearGradient id="fuelGrad1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                    <linearGradient id="fuelGrad2" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ RECENT TRIPS ═══════ */}
      <div className="px-4 pb-24">
        <div className="bg-white rounded-[22px] overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
            <h3 className="text-[14px] font-bold text-black" style={{ fontFamily: 'var(--font-display)' }}>Recent Trips</h3>
            <Link to="/trips" className="text-[11px] font-semibold text-indigo-600 flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentTrips.length === 0 ? (
            <div className="py-10 text-center">
              <Truck className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-[12px] text-slate-400">No trips yet</p>
            </div>
          ) : (
            <div>
              {recentTrips.map((trip, i) => {
                const pill = STATUS_PILL[trip.status] || STATUS_PILL.scheduled;
                return (
                  <div
                    key={trip.id}
                    className={`flex items-center gap-3 px-4 py-3 ${i < recentTrips.length - 1 ? 'border-b border-slate-50' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-black truncate">
                        {trip.from_location || '—'} → {trip.to_location || '—'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {trip.vehicle_plate || '—'} · {trip.driver_name || '—'}
                      </p>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                      style={{ background: pill.bg, color: pill.fg }}
                    >
                      {pill.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════ BOTTOM NAV ═══════ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around py-2.5 px-6"
        style={{
          background: '#ffffff',
          borderTop: '1px solid #f1f5f9',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
          paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))',
        }}
      >
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-0.5">
          <Home className="w-5 h-5 text-black fill-black" strokeWidth={2} />
          <span className="text-[9px] font-bold text-black">Home</span>
        </button>
        <button onClick={() => navigate('/trips')} className="flex flex-col items-center gap-0.5">
          <MapPin className="w-5 h-5 text-slate-400" strokeWidth={2} />
          <span className="text-[9px] font-medium text-slate-400">Live Map</span>
        </button>
        <button onClick={() => navigate('/notifications')} className="flex flex-col items-center gap-0.5 relative">
          <Bell className="w-5 h-5 text-slate-400" strokeWidth={2} />
          {alertsCount > 0 && (
            <span className="absolute top-0 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
          )}
          <span className="text-[9px] font-medium text-slate-400">Alerts</span>
        </button>
      </div>
    </div>
  );
}