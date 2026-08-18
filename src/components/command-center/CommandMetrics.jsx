import { useId } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPARK_COLORS = {
  brand: { stroke1: '#00f2c3', stroke2: '#22d3ee', fill: '#00f2c3' },
  blue: { stroke1: '#06b6d4', stroke2: '#22d3ee', fill: '#06b6d4' },
  green: { stroke1: '#22c55e', stroke2: '#4ade80', fill: '#22c55e' },
  violet: { stroke1: '#a855f7', stroke2: '#c084fc', fill: '#a855f7' },
  amber: { stroke1: '#fbbf24', stroke2: '#f59e0b', fill: '#fbbf24' },
};

function BrandSparkline({ data, width = 140, height = 40, variant = 'brand' }) {
  const gid = useId().replace(/:/g, '');
  const colors = SPARK_COLORS[variant] || SPARK_COLORS.brand;
  const arr = (data && data.length ? data : [0, 0]).map((v, i) => ({ i, v: Number(v) || 0 }));
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={arr} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={`bs-${gid}-s`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={colors.stroke1} />
              <stop offset="100%" stopColor={colors.stroke2} />
            </linearGradient>
            <linearGradient id={`bs-${gid}-f`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.fill} stopOpacity={0.22} />
              <stop offset="100%" stopColor={colors.fill} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <Area dataKey="v" stroke={`url(#bs-${gid}-s)`} fill={`url(#bs-${gid}-f)`} strokeWidth={2} dot={false} isAnimationActive animationDuration={800} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DeltaBadge({ delta }) {
  const positive = delta > 0;
  const negative = delta < 0;
  return (
    <span className={cn('inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border',
      positive && 'bg-gradient-to-r from-green-500/15 to-emerald-500/10 text-green-500 border-green-500/20',
      negative && 'bg-gradient-to-r from-red-500/15 to-rose-500/10 text-red-500 border-red-500/20',
      !positive && !negative && 'bg-foreground/5 text-muted-foreground border-border/40'
    )}>
      {positive ? <ArrowUpRight className="w-3 h-3" /> : negative ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

export default function CommandMetrics({ metrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        const chipClass = m.chip || 'chip-blue';
        return (
          <div key={m.label} className={cn('cmd-card animate-enter-up', m.isHero && 'xl:p-7')} style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', m.isHero ? chipClass : 'chip-accent')}>
                <Icon className={cn('w-4 h-4', m.isHero ? 'text-white' : '')} />
              </div>
              <DeltaBadge delta={m.delta} />
            </div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{m.label}</p>
            <p className={cn('font-bold tabular-nums mt-1', m.isHero ? 'text-3xl' : 'text-2xl')}>{m.value}</p>
            <div className="mt-3 -mx-1">
              <BrandSparkline data={m.spark} width={m.isHero ? 200 : 140} height={m.isHero ? 48 : 40} variant={m.sparkVariant || 'brand'} />
            </div>
          </div>
        );
      })}
    </div>
  );
}