import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import PremiumCard from './PremiumCard';
import SegmentedControl from './SegmentedControl';
import { formatCurrency } from '@/lib/formatters';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{
        background: 'rgba(var(--surf-2-rgb),0.96)',
        border: '1px solid rgba(var(--panel-accent-rgb),0.25)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
      }}
    >
      <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{label}</p>
      <p className="text-sm font-bold text-white tabular-nums mt-0.5">{formatCurrency(v)}</p>
    </div>
  );
}

export default function PerformanceChart({ data, range, setRange }) {
  return (
    <PremiumCard>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Performance</h3>
          <p className="text-[11px] text-white/40 mt-0.5">Revenue over time</p>
        </div>
        <SegmentedControl
          options={[{ value: '7D', label: '7D' }, { value: '30D', label: '30D' }, { value: '90D', label: '90D' }]}
          value={range}
          onChange={setRange}
        />
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="perfLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(var(--panel-accent-rgb))" />
              <stop offset="100%" stopColor="rgb(var(--panel-accent2-rgb))" />
            </linearGradient>
            <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(var(--panel-accent-rgb),0.22)" />
              <stop offset="100%" stopColor="rgba(var(--panel-accent-rgb),0)" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            stroke="rgba(255,255,255,0.35)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            minTickGap={20}
          />
          <YAxis
            stroke="rgba(255,255,255,0.35)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : v)}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(var(--panel-accent-rgb),0.3)', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="url(#perfLine)"
            strokeWidth={2}
            fill="url(#perfFill)"
            dot={false}
            activeDot={{ r: 5, fill: '#fff', stroke: 'rgb(var(--panel-accent-rgb))', strokeWidth: 2 }}
            style={{ filter: 'drop-shadow(0 0 6px rgba(var(--panel-accent-rgb),0.35))' }}
            isAnimationActive
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </PremiumCard>
  );
}