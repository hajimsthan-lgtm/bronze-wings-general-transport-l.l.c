import { useState, useEffect, useRef } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';

const STATUS_HEX = {
  active: '#34d399',
  expired: '#fbbf24',
  terminated: '#f87171',
};

const STATUS_LABELS = {
  active: 'Active',
  expired: 'Expired',
  terminated: 'Terminated',
};

export default function ContractsTable({ contracts, expensesByContract, onEdit, onDelete, onDetails }) {
  const { t } = useI18n();

  // Progressive rendering — keep DOM small as contract count grows.
  const PAGE = 50;
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);
  useEffect(() => { setVisibleCount(PAGE); }, [contracts]);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setVisibleCount((c) => c + PAGE);
    }, { root: scrollRef.current, rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [contracts]);
  const visibleContracts = contracts.slice(0, visibleCount);

  return (
    <div
      ref={scrollRef}
      className="rounded-xl border border-border shadow-sm bg-background/40 overflow-auto max-h-[70vh] trips-scroll trips-grid">
      <Table className="trips-grid-table">
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            {[
              ['RECORD ID / CLIENT', 'text-left'],
              ['PERIOD', 'text-left'],
              ['DRIVER / VEHICLE', 'text-left'],
              ['MONTHLY RENTAL', 'text-right'],
              ['NET PROFIT / MARGIN', 'text-right'],
              ['STATUS', 'text-left'],
              ['ACTIONS', 'text-center'],
            ].map(([label, align]) => (
              <TableHead
                key={label}
                className={cn(
                  'text-xs font-semibold uppercase tracking-wider text-foreground/75 trips-grid-th sticky top-0 z-10 bg-muted',
                  align
                )}
              >
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleContracts.map((c) => {
            const expenses = expensesByContract[c.id] || [];
            const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const monthlyRate = Number(c.contract_rate) || Number(c.monthly_rate) || 0;
            const netProfit = monthlyRate - totalExpenses;
            const margin = monthlyRate > 0 ? Math.round((netProfit / monthlyRate) * 100) : 0;
            const marginTone = margin >= 30 ? 'text-emerald-400' : margin >= 15 ? 'text-amber-400' : 'text-red-400';
            return (
              <TableRow key={c.id} className="hover:bg-primary/5 transition-all duration-150 group">
                {/* RECORD ID / CLIENT */}
                <TableCell className="align-top trips-grid-td">
                  <p className="font-mono text-xs text-foreground">#{c.id?.slice(-6).toUpperCase()}</p>
                  <p className="text-foreground font-medium truncate max-w-[180px]">{c.company_name || '—'}</p>
                </TableCell>
                {/* PERIOD */}
                <TableCell className="align-top trips-grid-td whitespace-nowrap">
                  <span className="text-foreground tabular-nums text-xs">{formatDate(c.start_date)}</span>
                  <span className="text-muted-foreground mx-1 text-xs">→</span>
                  <span className="text-foreground tabular-nums text-xs">{formatDate(c.end_date)}</span>
                </TableCell>
                {/* DRIVER / VEHICLE */}
                <TableCell className="align-top trips-grid-td">
                  <p className="text-foreground truncate max-w-[140px] text-xs">{c.driver_name || '—'}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{c.vehicle_plate || ''}</p>
                </TableCell>
                {/* MONTHLY RENTAL */}
                <TableCell className="text-right align-top trips-grid-td whitespace-nowrap">
                  <span className="font-semibold text-foreground tabular-nums text-xs">{formatCurrency(monthlyRate)}</span>
                </TableCell>
                {/* NET PROFIT / MARGIN */}
                <TableCell className="text-right align-top trips-grid-td whitespace-nowrap">
                  <p className={cn('font-semibold tabular-nums text-xs', netProfit >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {formatCurrency(netProfit)}
                  </p>
                  <p className={cn('text-xs tabular-nums', marginTone)}>{margin}%</p>
                </TableCell>
                {/* STATUS */}
                <TableCell className="align-top trips-grid-td">
                  <span
                    className={cn(
                      'text-[10px] font-bold px-2 py-1 rounded-full border inline-flex items-center gap-1',
                      c.status === 'active' && 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
                      c.status === 'expired' && 'text-amber-400 border-amber-500/30 bg-amber-500/10',
                      c.status === 'terminated' && 'text-red-400 border-red-500/30 bg-red-500/10'
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_HEX[c.status] || '#a1a1aa' }} />
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                </TableCell>
                {/* ACTIONS */}
                <TableCell className="align-top trips-grid-td">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onDetails?.(c)}
                      className="rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 p-1.5 transition-colors"
                      title="View"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit?.(c)}
                      className="rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 p-1.5 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete?.(c)}
                      className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 p-1.5 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
            })}
            {visibleCount < contracts.length && (
            <TableRow ref={sentinelRef} className="hover:bg-transparent">
             <TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-3">
               Loading more… ({visibleCount}/{contracts.length})
             </TableCell>
            </TableRow>
            )}
            </TableBody>
      </Table>
    </div>
  );
}