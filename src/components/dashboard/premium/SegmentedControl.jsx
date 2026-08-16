import React from 'react';
import { cn } from '@/lib/utils';

export default function SegmentedControl({ options, value, onChange }) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full p-0.5"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-all duration-200',
              active ? 'text-white' : 'text-white/45 hover:text-white/80'
            )}
            style={
              active
                ? { background: 'rgb(var(--panel-accent-rgb))', boxShadow: '0 0 0 1px rgba(var(--panel-accent-rgb),0.4), 0 0 12px -4px rgba(var(--panel-accent-rgb),0.6)' }
                : undefined
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}