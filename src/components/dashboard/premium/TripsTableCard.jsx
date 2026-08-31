import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import PremiumCard from './PremiumCard';
import SegmentedControl from './SegmentedControl';
import { formatCurrency } from '@/lib/formatters';

const statusColor = (s) =>
  s === 'completed' ? '#34d399' : s === 'in_transit' ? '#1ED760' : s === 'cancelled' ? '#f87171' : '#fbbf24';

function Sparkline({ points, color }) {
  const pts = (points || []).filter((n) => typeof n === 'number');
  if (pts.length < 2) return <span className="inline-block w-20 text-[10px] text-white/30">—</span>;
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const range = max - min || 1;
  const w = 96;
  const h = 32;
  const d = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${((i / (pts.length - 1)) * w).toFixed(1)} ${(h - ((p - min) / range) * h).toFixed(1)}`)
    .join(' ');
  const areaD = `${d} L ${w} ${h} L 0 ${h} Z`;
  const gid = `spark-grad-${color.replace('#', '')}`;
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 3px ${color}80)` }} />
    </svg>
  );
}

const BREAKDOWN_ROWS = [
  { key: 'fuel_cost', label: 'Fuel', color: '#f97316' },
  { key: 'toll_cost', label: 'Toll', color: '#ec4899' },
  { key: 'other_cost', label: 'Other', color: '#6b7280' },
  { key: 'revenue', label: 'Revenue', color: '#34d399' },
];

export default function TripsTableCard({ trips, sparkData }) {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState({});
  const filtered = trips.filter((t) =>
    filter === 'all' ? true : filter === 'completed' ? t.status === 'completed' : t.status === 'in_transit' || t.status === 'scheduled'
  );

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

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
              <th className="px-6 pb-2 text-right text-[10px] font-semibold uppercase tracking-wider text-white/40">Trip Fare</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-white/40">No trips</td>
              </tr>
            )}
            {filtered.map((tr) => {
              const isOpen = !!expanded[tr.id];
              return (
                <React.Fragment key={tr.id}>
                  <tr className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.03]">
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
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => toggle(tr.id)}
                        className="inline-flex items-center gap-1.5 text-white font-semibold tabular-nums hover:text-[rgb(var(--panel-accent2-rgb))] transition-colors group"
                        title={isOpen ? 'Hide breakdown' : 'Show breakdown'}
                      >
                        {formatCurrency(tr.revenue)}
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md border border-white/10 bg-white/[0.04] group-hover:border-[rgba(var(--panel-accent-rgb),0.4)] group-hover:bg-[rgba(var(--panel-accent-rgb),0.12)] transition-all">
                          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </span>
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-t border-white/[0.03]">
                      <td colSpan={5} className="px-6 py-3 bg-white/[0.015]">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                          <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mr-1">Breakdown</span>
                          {BREAKDOWN_ROWS.map((r) => (
                            <span key={r.key} className="inline-flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color, boxShadow: `0 0 4px ${r.color}` }} />
                              <span className="text-white/50">{r.label}</span>
                              <span className="text-white font-semibold tabular-nums">{formatCurrency(Number(tr[r.key]) || 0)}</span>
                            </span>
                          ))}
                          <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-white/40">
                            Net:
                            <span className="text-white font-bold tabular-nums">
                              {formatCurrency((Number(tr.revenue) || 0) - (Number(tr.fuel_cost) || 0) - (Number(tr.toll_cost) || 0) - (Number(tr.other_cost) || 0))}
                            </span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </PremiumCard>
  );
}