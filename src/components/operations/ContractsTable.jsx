import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Eye, Pencil, Trash2, MoreVertical } from 'lucide-react';
import StatusPill, { statusVariant } from '@/components/operations/StatusPill';

export default function ContractsTable({ contracts, expensesByContract, onEdit, onDelete, onDetails }) {
  const { t } = useI18n();

  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-md overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs text-muted-foreground tracking-wider font-semibold uppercase px-4 py-3 whitespace-nowrap">{t('record_id')} / {t('client')}</th>
            <th className="text-left text-xs text-muted-foreground tracking-wider font-semibold uppercase px-4 py-3 whitespace-nowrap hidden md:table-cell">{t('period')}</th>
            <th className="text-left text-xs text-muted-foreground tracking-wider font-semibold uppercase px-4 py-3 whitespace-nowrap hidden lg:table-cell">{t('driver')} / {t('vehicle')}</th>
            <th className="text-right text-xs text-muted-foreground tracking-wider font-semibold uppercase px-4 py-3 whitespace-nowrap">{t('monthly_rental')}</th>
            <th className="text-right text-xs text-muted-foreground tracking-wider font-semibold uppercase px-4 py-3 whitespace-nowrap">{t('net_profit')} / {t('profit_margin')}</th>
            <th className="text-left text-xs text-muted-foreground tracking-wider font-semibold uppercase px-4 py-3 whitespace-nowrap">{t('status')}</th>
            <th className="text-right text-xs text-muted-foreground tracking-wider font-semibold uppercase px-4 py-3 whitespace-nowrap">{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c) => {
            const expenses = expensesByContract[c.id] || [];
            const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const monthlyRate = Number(c.monthly_rate) || 0;
            const netProfit = monthlyRate - totalExpenses;
            const margin = monthlyRate > 0 ? Math.round((netProfit / monthlyRate) * 100) : 0;
            const marginTone = margin >= 30 ? 'text-emerald-400' : margin >= 15 ? 'text-amber-400' : 'text-red-400';
            return (
              <tr key={c.id} className="border-b border-border/60 hover:bg-primary/5 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="font-mono text-xs text-foreground">#{c.id?.slice(-6).toUpperCase()}</p>
                  <p className="text-foreground font-medium truncate max-w-[180px]">{c.company_name || '—'}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell whitespace-nowrap">
                  <span className="text-foreground tabular-nums">{formatDate(c.start_date)}</span>
                  <span className="text-muted-foreground mx-1">→</span>
                  <span className="text-foreground tabular-nums">{formatDate(c.end_date)}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
                  <p className="text-foreground truncate max-w-[140px]">{c.driver_name || '—'}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{c.vehicle_plate || ''}</p>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span className="font-semibold text-foreground tabular-nums">{formatCurrency(monthlyRate)}</span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <p className={`font-semibold tabular-nums ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(netProfit)}</p>
                  <p className={`text-xs tabular-nums ${marginTone}`}>{margin}%</p>
                </td>
                <td className="px-4 py-3">
                  <StatusPill variant={statusVariant(c.status)} dot>{t(c.status || 'active')}</StatusPill>
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onDetails?.(c)} className="cursor-pointer flex items-center gap-2"><Eye className="w-3.5 h-3.5" /> {t('details')}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(c)} className="cursor-pointer flex items-center gap-2"><Pencil className="w-3.5 h-3.5" /> {t('edit')}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete?.(c)} className="cursor-pointer flex items-center gap-2 text-red-400"><Trash2 className="w-3.5 h-3.5" /> {t('delete')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}