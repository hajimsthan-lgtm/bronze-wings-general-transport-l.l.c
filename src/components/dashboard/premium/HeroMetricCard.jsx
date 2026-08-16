import React from 'react';
import PremiumCard from './PremiumCard';
import SegmentedControl from './SegmentedControl';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function HeroMetricCard({ revenue, deltaPct, range, setRange }) {
  const up = deltaPct >= 0;
  return (
    <PremiumCard className="flex flex-col justify-between min-h-[176px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">Total Revenue</p>
          <p className="mt-3 text-[40px] leading-none font-bold text-white tabular-nums tracking-tight">
            {formatCurrency(revenue)}
          </p>
        </div>
        <SegmentedControl
          options={[{ value: '7D', label: '7D' }, { value: '30D', label: '30D' }, { value: '90D', label: '90D' }]}
          value={range}
          onChange={setRange}
        />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
          style={{
            background: up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            color: up ? '#34d399' : '#f87171'
          }}
        >
          {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {up ? '+' : ''}{deltaPct.toFixed(1)}%
        </span>
        <span className="text-xs text-white/40">vs previous {range}</span>
      </div>
    </PremiumCard>
  );
}