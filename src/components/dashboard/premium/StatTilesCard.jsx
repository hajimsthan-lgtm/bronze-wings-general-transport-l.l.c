import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PremiumCard from './PremiumCard';

export default function StatTilesCard({ tiles }) {
  return (
    <PremiumCard className="flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-white">Overview</h3>
        <Link
          to="/reports/pnl"
          className="inline-flex items-center gap-1 text-xs font-medium text-white/50 hover:text-white transition-colors"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-5 gap-y-5 flex-1">
        {tiles.map((t, i) => (
          <div key={i} className="flex items-start gap-3">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(var(--panel-accent-rgb),0.10)',
                border: '1px solid rgba(var(--panel-accent-rgb),0.18)'
              }}
            >
              <t.icon className="w-4 h-4" style={{ color: 'rgb(var(--panel-accent-rgb))' }} />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold text-white tabular-nums leading-tight truncate">{t.value}</p>
              <p className="text-[11px] text-white/50 mt-0.5">{t.label}</p>
              {t.sub && <p className="text-[10px] text-white/30 mt-0.5 truncate">{t.sub}</p>}
            </div>
          </div>
        ))}
      </div>
    </PremiumCard>
  );
}