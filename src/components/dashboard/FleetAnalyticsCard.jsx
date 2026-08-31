import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wrench } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { safeListAll } from '@/lib/safeRequest';
import { formatCurrency } from '@/lib/formatters';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from 'recharts';

const NEON_BORDER = 'linear-gradient(135deg, rgba(99,102,241,0.55), rgba(6,182,212,0.45) 50%, rgba(139,92,246,0.55))';

const tooltipStyle = {
  background: 'rgba(15,23,42,0.96)',
  border: '1px solid rgba(99,102,241,0.3)',
  borderRadius: 10,
  color: '#fff',
  fontSize: 11,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  padding: '6px 9px',
};

const SERVICE_COLORS = {
  oil_change: '#6366f1', tire: '#f59e0b', brake: '#ef4444', engine: '#8b5cf6',
  electrical: '#06b6d4', body: '#ec4899', inspection: '#14b8a6', other: '#64748b',
};
const SERVICE_LABELS = {
  oil_change: 'Oil', tire: 'Tire', brake: 'Brake', engine: 'Engine',
  electrical: 'Electrical', body: 'Body', inspection: 'Inspect', other: 'Other',
};

export default function FleetAnalyticsCard() {
  const [vehicles, setVehicles] = useState([]);
  const [services, setServices] = useState([]);

  const load = useCallback(async () => {
    const [v, s] = await safeListAll([
      () => base44.entities.Vehicle.list().catch(() => []),
      () => base44.entities.ServiceRecord.list('-created_date', 50).catch(() => []),
    ]);
    setVehicles(v); setServices(s);
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = vehicles.filter((v) => v.status === 'active').length;
  const maintenance = vehicles.filter((v) => v.status === 'maintenance').length;
  const offDuty = vehicles.filter((v) => v.status !== 'active' && v.status !== 'maintenance').length;
  const total = vehicles.length || 1;
  const utilPct = Math.round((active / total) * 100);

  // Maintenance cost by service type
  const byType = {};
  services.forEach((s) => {
    const key = s.service_type || 'other';
    byType[key] = (byType[key] || 0) + (Number(s.cost) || 0);
  });
  const barData = Object.entries(byType)
    .map(([k, v]) => ({ name: SERVICE_LABELS[k] || k, cost: Math.round(v * 100) / 100, key: k }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 6);

  const totalMaintCost = barData.reduce((s, d) => s + d.cost, 0);

  // Donut segments
  const segments = [
    { label: 'Active', value: active, color: '#6366f1' },
    { label: 'Maintenance', value: maintenance, color: '#f59e0b' },
    { label: 'Off-duty', value: offDuty, color: '#94a3b8' },
  ];
  const circumference = 2 * Math.PI * 42;
  let offset = 0;
  const donutSegs = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const s = { ...seg, dash, gap: circumference - dash, offset: -offset };
    offset += dash;
    return s;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-[22px] p-4 bg-white"
      style={{
        border: '1px solid #ececf0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04), 0 0 0 1px rgba(99,102,241,0.08), 0 0 24px -8px rgba(99,102,241,0.25)',
      }}
    >
      {/* Neon edge top accent line */}
      <div
        className="absolute top-0 left-4 right-4 h-[2px] rounded-full"
        style={{ background: NEON_BORDER, boxShadow: '0 0 12px rgba(99,102,241,0.5)' }}
      />

      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
          <Activity className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />
        </div>
        <h3 className="text-[14px] font-bold text-black" style={{ fontFamily: 'var(--font-display)' }}>Fleet Analytics</h3>
      </div>

      {/* Utilization donut */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative shrink-0" style={{ width: 96, height: 96 }}>
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="9" />
            {donutSegs.map((seg, i) => (
              <circle
                key={i}
                cx="50" cy="50" r="42" fill="none" stroke={seg.color} strokeWidth="9"
                strokeDasharray={`${seg.dash} ${seg.gap}`}
                strokeDashoffset={seg.offset}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 4px ${seg.color}66)`, transition: 'stroke-dasharray 0.8s ease' }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[20px] font-bold text-black tabular-nums leading-none">{utilPct}%</span>
            <span className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">Utilized</span>
          </div>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color, boxShadow: `0 0 6px ${seg.color}88` }} />
              <span className="text-[11px] text-slate-500 flex-1">{seg.label}</span>
              <span className="text-[11px] font-bold text-black tabular-nums">{seg.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance cost breakdown */}
      <div className="flex items-center gap-2 mb-2">
        <Wrench className="w-3.5 h-3.5 text-amber-500" strokeWidth={2.2} />
        <h4 className="text-[12px] font-bold text-black">Maintenance Costs</h4>
        <span className="ml-auto text-[11px] font-bold text-indigo-600 tabular-nums">{formatCurrency(totalMaintCost)}</span>
      </div>

      <div style={{ width: '100%', height: 130 }}>
        {barData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-[11px] text-slate-400">No maintenance records</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 2, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Bar dataKey="cost" radius={[5, 5, 0, 0]} maxBarSize={28}>
                {barData.map((d, i) => <Cell key={i} fill={SERVICE_COLORS[d.key] || '#64748b'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}