import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PremiumCard from './PremiumCard';
import SegmentedControl from './SegmentedControl';
import { formatCurrency } from '@/lib/formatters';

const statusColor = (s) =>
  s === 'completed' ? '#34d399' : s === 'in_transit' ? '#1ED760' : s === 'cancelled' ? '#f87171' : '#fbbf24';

function Sparkline({ points, color }) {
  const pts = (points || []).filter((n) => typeof n === 'number');
  if (pts.length < 2) return <span className="inline-block w-16 text-[10px] text-white/30">—</span>;
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const range = max - min || 1;
  const w = 64;
  const h = 20;
  const d = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${((i / (pts.length - 1)) * w).toFixed(1)} ${(h - ((p - min) / range) * h).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function TripsTableCard({ trips, sparkData }) {
  const [filter, setFilter] = useState('all');
  const filtered = trips.filter((t) =>
    filter === 'all' ? true : filter === 'completed' ? t.status === 'completed' : t.status === 'in_transit' || t.status === 'scheduled'
  );

  return (
    <PremiumCard padding="p-0" hover={false}>
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-sm font-semibold text-white">Recent Trips</h3>
        <div className="flex items-center gap-3">
          <SegmentedControl
            options={[{ value: 'all', label: 'All' }, { value: 'completed', label: 'Done' }, { value: 'active', label: 'Active' }]}
            value={filter}
            onChange={setFilter}
          />
          <Link to="/trips" className="inline-flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white transition-colors">
            View all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-6 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">Trip</th>
              <th className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">Driver</th>
              <th className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">Status</th>
              <th className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">Trend</th>
              <th className="px-6 pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-white/40">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-white/40">No trips</td>
              </tr>
            )}
            {filtered.map((tr) => (
              <tr key={tr.id} className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]">
                <td className="px-6 py-3">
                  <p className="text-white font-medium truncate max-w-[220px]">
                    {tr.from_location || '—'} → {tr.to_location || '—'}
                  </p>
                  <p className="text-[11px] text-white/40 mt-0.5">{tr.trip_number || '—'}</p>
                </td>
                <td className="px-3 py-3 text-white/60 truncate max-w-[120px]">{tr.driver_name || '—'}</td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: statusColor(tr.status) }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor(tr.status) }} />
                    {(tr.status || '').replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <Sparkline points={sparkData?.[tr.id]} color={statusColor(tr.status)} />
                </td>
                <td className="px-6 py-3 text-right text-white font-semibold tabular-nums">{formatCurrency(tr.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PremiumCard>
  );
}