import { Calendar } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatDate } from '@/lib/formatters';

export default function DateRangeFilter({ fromValue, onFromChange, toValue, onToChange, onToday }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 py-2 mb-4 w-fit rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-4 shadow-lg">
      <Calendar className="w-4 h-4 text-muted-foreground pointer-events-none flex-shrink-0" />
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{t('from') || 'From'}</span>
        <input type="date" value={fromValue} onChange={(e) => onFromChange(e.target.value)} className="bg-transparent border-none text-sm text-foreground focus:outline-none date-input-clean" />
        {fromValue && <span className="text-[10px] text-muted-foreground/60 font-mono">{formatDate(fromValue)}</span>}
      </div>
      <span className="text-muted-foreground text-xs">—</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{t('to') || 'To'}</span>
        <input type="date" value={toValue} onChange={(e) => onToChange(e.target.value)} className="bg-transparent border-none text-sm text-foreground focus:outline-none date-input-clean" />
        {toValue && <span className="text-[10px] text-muted-foreground/60 font-mono">{formatDate(toValue)}</span>}
      </div>
      <button onClick={onToday} className="text-xs px-2 py-0.5 rounded-full transition-colors whitespace-nowrap bg-primary/15 text-primary">
        {t('today')}
      </button>
    </div>);

}