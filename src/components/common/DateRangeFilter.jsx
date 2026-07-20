import { Calendar } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatDate } from '@/lib/formatters';

export default function DateRangeFilter({ fromValue, onFromChange, toValue, onToChange, onToday }) {
  const { t } = useI18n();
  return (
    <div className="flex rounded-xl border border-input bg-transparent py-1 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm w-full clay-input px-3 pl-9 h-11 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
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