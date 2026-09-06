import { Plus, Trash2, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import DatePicker from '@/components/common/DatePicker';
import { useI18n } from '@/lib/i18n';

/**
 * Per-day usage log with inline overage badges and "Fill Remaining Days" automation.
 */
export default function DailyUsageLog({ dailyUsage = [], onChange, inputCls, startDate, endDate, allowanceHoursPerDay }) {
  const { t } = useI18n();
  const allowance = Number(allowanceHoursPerDay) || 0;

  const addRow = () => onChange([...dailyUsage, { date: '', hours_used: '' }]);
  const removeRow = (idx) => onChange(dailyUsage.filter((_, i) => i !== idx));
  const updateRow = (idx, field, value) =>
    onChange(dailyUsage.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));

  const fillRemainingDays = () => {
    if (!startDate || !endDate) return;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    const existingDates = new Set(dailyUsage.map((r) => r.date).filter(Boolean));
    const newRows = [...dailyUsage];
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      if (!existingDates.has(dateStr)) {
        newRows.push({ date: dateStr, hours_used: allowance || '' });
      }
      current.setDate(current.getDate() + 1);
    }
    onChange(newRows);
  };

  const hasMissingDays = (() => {
    if (!startDate || !endDate) return false;
    const existingDates = new Set(dailyUsage.map((r) => r.date).filter(Boolean));
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    const current = new Date(start);
    while (current <= end) {
      if (!existingDates.has(current.toISOString().split('T')[0])) return true;
      current.setDate(current.getDate() + 1);
    }
    return false;
  })();

  return (
    <div className="space-y-2">
      {dailyUsage.length === 0 && (
        <p className="text-[11px] text-muted-foreground italic">
          {t('no_days_logged') || 'No days logged yet. Use "Fill Remaining Days" or add manually.'}
        </p>
      )}
      {dailyUsage.map((row, idx) => {
        const hours = Number(row.hours_used) || 0;
        const isOver = allowance > 0 && hours > allowance;
        const overBy = isOver ? hours - allowance : 0;
        return (
          <div key={idx} className="flex items-center gap-2">
            <DatePicker
              value={row.date || ''}
              onChange={(v) => updateRow(idx, 'date', v)}
              className={`${inputCls} date-input-clean flex-1`}
            />
            <div className="relative flex-1 max-w-[120px]">
              <Input
                type="number"
                value={row.hours_used || ''}
                onChange={(e) => updateRow(idx, 'hours_used', e.target.value)}
                className={`${inputCls} ${isOver ? 'border-amber-500/50' : ''}`}
                placeholder="hrs"
              />
              {isOver && (
                <span className="absolute -right-2 -top-2 px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-bold whitespace-nowrap">
                  +{overBy}h
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0"
              title={t('remove_day') || 'Remove'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> {t('add_day') || 'Add Day'}
        </button>
        {startDate && endDate && hasMissingDays && (
          <button
            type="button"
            onClick={fillRemainingDays}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:underline"
          >
            <Zap className="w-3.5 h-3.5" /> {t('fill_remaining_days') || 'Fill Remaining Days'}
          </button>
        )}
      </div>
    </div>
  );
}