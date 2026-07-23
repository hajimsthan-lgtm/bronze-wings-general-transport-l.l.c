import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useI18n } from '@/lib/i18n';

export default function DateFilter({ value, onChange, showAll, onToggleAll }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value) : undefined;

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            disabled={showAll}
            className="flex items-center gap-2 h-9 px-3 rounded-xl glass-card disabled:opacity-40"
          >
            <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground font-mono tabular-nums">{value || 'Select date'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => { onChange(d ? format(d, 'yyyy-MM-dd') : ''); setOpen(false); }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <button
        onClick={() => onToggleAll(!showAll)}
        className={`text-xs px-2.5 py-1 rounded-full transition-colors whitespace-nowrap ${showAll ? 'bg-primary/15 text-primary' : 'bg-muted/50 text-muted-foreground'}`}
      >
        {showAll ? t('all_dates') : t('today')}
      </button>
    </div>
  );
}