import { Calendar } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function DateRangeFilter({ fromValue, onFromChange, toValue, onToChange, onToday }) {
  const { t } = useI18n();
  return (
    <div
      className="rounded-2xl p-2.5 flex items-stretch gap-2 w-full backdrop-blur-xl"
      style={{ background:'#232636', border:'1px solid rgba(255,255,255,0.06)', boxShadow:'-6px -6px 12px rgba(255,255,255,0.04), 6px 6px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)' }}
    >
      {/* From box */}
      <div
        className="rounded-xl px-3 py-2 flex-1 flex flex-col gap-1.5 min-w-0 transition-all duration-300"
        style={{ background:'#1e2130', border:'1px solid rgba(255,255,255,0.06)', boxShadow:'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-400/70" />
          <span className="text-[10px] uppercase tracking-[0.08em] text-[#6b7280] font-medium">{t('from')}</span>
        </div>
        <input
          type="date"
          value={fromValue}
          onChange={(e) => onFromChange(e.target.value)}
          className="bg-transparent border-none text-sm text-white font-mono focus:outline-none date-input-clean w-full"
        />
      </div>

      <span className="self-center text-[#6b7280] text-sm">→</span>

      {/* To box */}
      <div
        className="rounded-xl px-3 py-2 flex-1 flex flex-col gap-1.5 min-w-0 transition-all duration-300"
        style={{ background:'#1e2130', border:'1px solid rgba(255,255,255,0.06)', boxShadow:'inset 2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-400/70" />
          <span className="text-[10px] uppercase tracking-[0.08em] text-[#6b7280] font-medium">{t('to')}</span>
        </div>
        <input
          type="date"
          value={toValue}
          onChange={(e) => onToChange(e.target.value)}
          className="bg-transparent border-none text-sm text-white font-mono focus:outline-none date-input-clean w-full"
        />
      </div>

      <button
        onClick={onToday}
        className="rounded-full px-5 py-2 text-xs font-semibold whitespace-nowrap self-center text-white transition-all duration-300 hover:brightness-110 hover:scale-[1.02]"
        style={{ background:'linear-gradient(135deg,#3b82f6,#60a5fa)', boxShadow:'0 4px 16px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.2)' }}
      >
        {t('today')}
      </button>
    </div>
  );
}