import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Eye, Pencil, Trash2, MoreVertical, Building2, Repeat, ArrowRight } from 'lucide-react';
import StatusPill, { statusVariant } from '@/components/operations/StatusPill';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const CONTRACT_ACCENT = '#a855f7';

export default function ContractsList({ contracts, expensesByContract, onEdit, onDelete, onDetails, driverMap, vehicleMap }) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleLink = (e, map, name, path) => {
    e.stopPropagation();
    const id = map?.[name];
    if (id) navigate(`${path}/${id}`);
  };

  return (
    <div>
      {contracts.map((c, i) => {
        const expenses = expensesByContract[c.id] || [];
        const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const monthlyRate = Number(c.monthly_rate) || 0;
        const netProfit = monthlyRate - totalExpenses;
        const margin = monthlyRate > 0 ? Math.round((netProfit / monthlyRate) * 100) : 0;
        const marginTone = margin >= 30 ? 'text-emerald-400' : margin >= 15 ? 'text-amber-400' : 'text-red-400';
        return (
          <div
            key={c.id}
            onClick={() => onDetails?.(c)}
            className="group relative rounded-2xl mb-2 cursor-pointer row-edge-glow hover:-translate-y-px animate-fade-in-up"
            style={{
              animationDelay: `${Math.min(i * 0.03, 0.4)}s`,
              ['--row-accent']: CONTRACT_ACCENT,
              background: 'linear-gradient(180deg, rgba(28,22,40,0.50) 0%, rgba(20,16,30,0.62) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(168,85,247,0.12)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            }}
          >
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: CONTRACT_ACCENT, boxShadow: `0 0 8px ${CONTRACT_ACCENT}` }}
            />
            <div className="flex items-center gap-3 p-3 sm:p-3.5">
              {/* Icon badge */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(CONTRACT_ACCENT, 0.14), border: `1px solid ${hexToRgba(CONTRACT_ACCENT, 0.3)}` }}>
                <Building2 className="w-4 h-4" style={{ color: CONTRACT_ACCENT }} />
              </div>

              {/* Main */}
              <div className="flex-1 min-w-0">
                {/* Line 1 — company name */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.company_name || '—'}</p>
                  {c.auto_renewal && <Repeat className="w-3 h-3 text-primary flex-shrink-0" />}
                </div>
                {/* Line 2 — id + date range */}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1 min-w-0">
                  <span className="font-mono text-muted-foreground/80 whitespace-nowrap">#{c.id?.slice(-6).toUpperCase()}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="tabular-nums whitespace-nowrap">{formatDate(c.start_date)}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                  <span className="tabular-nums whitespace-nowrap">{formatDate(c.end_date)}</span>
                </div>
                {/* Line 3 — meta (desktop only) */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground mt-1 min-w-0">
                  {c.driver_name && (
                    <>
                      <button onClick={(e) => handleLink(e, driverMap, c.driver_name, '/admin/drivers')} className="hover:text-primary transition-colors truncate max-w-[120px]">{c.driver_name}</button>
                    </>
                  )}
                  {c.vehicle_plate && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <button onClick={(e) => handleLink(e, vehicleMap, c.vehicle_plate, '/admin/vehicles')} className="hover:text-primary transition-colors tabular-nums whitespace-nowrap">{c.vehicle_plate}</button>
                    </>
                  )}
                </div>
              </div>

              {/* Right — status + margin + rate + menu */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-xl bg-muted/40 border border-border/50">
                  <StatusPill as="span" variant={statusVariant(c.status)} dot>{t(c.status || 'active')}</StatusPill>
                  <span className={`text-[11px] font-semibold tabular-nums ${marginTone}`}>{margin}%</span>
                </div>

                <div className="h-6 w-px bg-border/50 hidden sm:block" />

                <div className="text-right">
                  <p className="text-sm font-bold text-foreground tabular-nums whitespace-nowrap leading-tight">{formatCurrency(monthlyRate)}</p>
                  <p className={`text-[10px] tabular-nums leading-tight ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(netProfit)}</p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button onClick={(e) => e.stopPropagation()} className="w-7 h-7 sm:w-8 sm:h-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDetails?.(c); }} className="cursor-pointer flex items-center gap-2"><Eye className="w-3.5 h-3.5" /> {t('details')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(c); }} className="cursor-pointer flex items-center gap-2"><Pencil className="w-3.5 h-3.5" /> {t('edit')}</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(c); }} className="cursor-pointer flex items-center gap-2 text-red-400"><Trash2 className="w-3.5 h-3.5" /> {t('delete')}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}