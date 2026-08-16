import { useId } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

function BrandSparkline({ data, width = 140, height = 40 }) {
  const gid = useId().replace(/:/g, '');
  const arr = (data && data.length ? data : [0, 0]).map((v, i) => ({ i, v: Number(v) || 0 }));
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={arr} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <defs>
            <linearGradient id={`bs-${gid}-s`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#C9873B" />
              <stop offset="100%" stopColor="#0A84FF" />
            </linearGradient>
            <linearGradient id={`bs-${gid}-f`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0A84FF" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#0A84FF" stopOpacity={0.01} />
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
    <span className={cn('inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-semibold',
      positive && 'bg-green-500/10 text-green-500',
      negative && 'bg-red-500/10 text-red-500',
      !positive && !negative && 'bg-foreground/5 text-muted-foreground'
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
        return (
          <div key={m.label} className={cn('cmd-card animate-enter-up', m.isHero && 'xl:p-7')} style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', m.isHero ? 'brand-gradient-bg' : 'bg-foreground/10')}>
                <Icon className={cn('w-4 h-4', m.isHero ? 'text-white' : 'text-muted-foreground')} />
              </div>
              <DeltaBadge delta={m.delta} />
            </div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{m.label}</p>
            <p className={cn('font-bold tabular-nums mt-1', m.isHero ? 'text-3xl' : 'text-2xl')}>{m.value}</p>
            <div className="mt-3 -mx-1">
              <BrandSparkline data={m.spark} width={m.isHero ? 200 : 140} height={m.isHero ? 48 : 40} />
            </div>
          </div>
        );
      })}
    </div>
  );
}