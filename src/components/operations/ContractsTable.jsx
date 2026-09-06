import { useState, useEffect, useRef } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { calculateContractBilling } from '@/lib/contractCalculator';

const INV_STATUS_TONE = {
  draft: 'text-muted-foreground bg-muted/40 border-border',
  unsigned: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  signed: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  sent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  partially_paid: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
  paid: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  cancelled: 'text-red-400 bg-red-500/10 border-red-500/30',
  overdue: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function ContractsTable({ contracts, expensesByContract, invoiceMap, onEdit, onDelete, onDetails }) {
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
              ['RENTAL #', 'text-left'],
              ['CLIENT', 'text-left'],
              ['PERIOD', 'text-left'],
              ['DRIVER / VEHICLE', 'text-left'],
              ['MONTHLY RENTAL', 'text-right'],
              ['OVER DATE', 'text-right'],
              ['OVER TIME', 'text-right'],
              ['TOTAL RENT+OVERTIME', 'text-right'],
              ['INV STATUS', 'text-center'],
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
            const calc = calculateContractBilling(c);
            const inv = invoiceMap?.[c.id];
            const invStatus = inv?.status || '—';
            return (
              <TableRow key={c.id} className="hover:bg-primary/5 transition-all duration-150 group">
                {/* RENTAL # */}
                <TableCell className="align-top trips-grid-td">
                  <p className="font-mono text-xs text-primary font-semibold">{c.contract_number || `#${c.id?.slice(-6).toUpperCase()}`}</p>
                </TableCell>
                {/* CLIENT */}
                <TableCell className="align-top trips-grid-td">
                  <p className="text-foreground font-medium truncate max-w-[160px]">{c.company_name || '—'}</p>
                </TableCell>
                {/* PERIOD */}
                <TableCell className="align-top trips-grid-td whitespace-nowrap">
                  <span className="text-foreground tabular-nums text-xs">{formatDate(c.start_date)}</span>
                  <span className="text-muted-foreground mx-1 text-xs">→</span>
                  <span className="text-foreground tabular-nums text-xs">{formatDate(c.end_date)}</span>
                </TableCell>
                {/* DRIVER / VEHICLE */}
                <TableCell className="align-top trips-grid-td">
                  <p className="text-foreground truncate max-w-[120px] text-xs">{c.driver_name || '—'}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{c.vehicle_plate || ''}</p>
                </TableCell>
                {/* MONTHLY RENTAL */}
                <TableCell className="text-right align-top trips-grid-td whitespace-nowrap">
                  <span className="font-semibold text-foreground tabular-nums text-xs">{formatCurrency(calc.base)}</span>
                </TableCell>
                {/* OVER DATE */}
                <TableCell className="text-right align-top trips-grid-td whitespace-nowrap">
                  <p className="text-xs tabular-nums text-foreground">{calc.overDateUsed} day{calc.overDateUsed === 1 ? '' : 's'}</p>
                  {calc.overageDaysCharge > 0 && <p className="text-[10px] tabular-nums text-amber-400">+{formatCurrency(calc.overageDaysCharge)}</p>}
                </TableCell>
                {/* OVER TIME */}
                <TableCell className="text-right align-top trips-grid-td whitespace-nowrap">
                  <p className="text-xs tabular-nums text-foreground">{calc.overtimeHours} hr{calc.overtimeHours === 1 ? '' : 's'}</p>
                  {calc.hourOverageCharge > 0 && <p className="text-[10px] tabular-nums text-amber-400">+{formatCurrency(calc.hourOverageCharge)}</p>}
                </TableCell>
                {/* TOTAL RENT+OVERTIME */}
                <TableCell className="text-right align-top trips-grid-td whitespace-nowrap">
                  <span className="font-bold text-emerald-400 tabular-nums text-xs">{formatCurrency(calc.total)}</span>
                </TableCell>
                {/* INV STATUS */}
                <TableCell className="text-center align-top trips-grid-td">
                  {inv ? (
                    <span className={cn('inline-flex items-center px-2 h-5 rounded-full text-[10px] font-semibold border', INV_STATUS_TONE[invStatus] || INV_STATUS_TONE.draft)}>
                      {invStatus.replace(/_/g, ' ')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
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
             <TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-3">
               Loading more… ({visibleCount}/{contracts.length})
             </TableCell>
            </TableRow>
            )}
            </TableBody>
      </Table>
    </div>
  );
}