import { motion } from 'framer-motion';
import { CheckCircle2, BarChart3, Gauge } from 'lucide-react';
import CountUp from '@/components/common/CountUp';

const METRICS = [
  { label: 'On-Time Delivery', value: 100, suffix: '%', decimals: 0, sub: 'All trips on schedule', icon: CheckCircle2, color: '#22c55e' },
  { label: 'Avg. Trip Value', value: 624.2, prefix: 'AED ', decimals: 2, sub: 'Per trip average', icon: BarChart3, color: '#3b82f6' },
  { label: 'Fleet Utilization', value: 0, suffix: '%', decimals: 0, sub: 'Vehicle usage rate', icon: Gauge, color: '#f59e0b' },
];

export default function PerformanceMetrics() {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
      {METRICS.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.25 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -3 }}
          className="group relative rounded-2xl p-4 overflow-hidden transition-shadow duration-300"
          style={{
            background: `linear-gradient(165deg, ${m.color}1a 0%, rgba(12,16,26,0.50) 100%)`,
            border: '1px solid rgba(255,255,255,0.05)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.30)',
          }}
        >
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ boxShadow: `0 12px 36px -8px ${m.color}40, inset 0 0 0 1px ${m.color}33` }}
          />
          <div className="relative flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `${m.color}1a`, border: `1px solid ${m.color}40`, boxShadow: `0 0 14px -4px ${m.color}80` }}
            >
              <m.icon className="w-5 h-5" style={{ color: m.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-white leading-none">
                <CountUp value={m.value} decimals={m.decimals} prefix={m.prefix || ''} suffix={m.suffix || ''} duration={1500} />
              </p>
              <p className="text-[10px] uppercase tracking-wider text-white/60 mt-1.5">{m.label}</p>
            </div>
          </div>
          <p className="relative text-xs text-white/55 mt-2.5">{m.sub}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}