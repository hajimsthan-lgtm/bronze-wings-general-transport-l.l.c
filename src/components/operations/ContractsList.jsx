import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Eye, Pencil, Trash2, MoreVertical, Building2, Repeat, ArrowRight } from 'lucide-react';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import { calculateContractBilling } from '@/lib/contractCalculator';

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
        const calc = calculateContractBilling(c);
        return (
          <div
            key={c.id}
            onClick={() => onDetails?.(c)}
            className="group row-card row-edge-glow cursor-pointer animate-fade-in-up mb-2"
            style={{
              animationDelay: `${Math.min(i * 0.03, 0.4)}s`,
              ['--row-accent']: CONTRACT_ACCENT,
            }}
          >
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: CONTRACT_ACCENT, boxShadow: `0 0 8px ${CONTRACT_ACCENT}` }}
            />
            <div className="flex items-center gap-3 p-3 sm:p-3.5">
              {/* Icon badge */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(CONTRACT_ACCENT, 0.12), border: `1px solid ${hexToRgba(CONTRACT_ACCENT, 0.22)}` }}>
                <Building2 className="w-4 h-4" style={{ color: CONTRACT_ACCENT }} />
              </div>

              {/* Main */}
              <div className="flex-1 min-w-0">
                {/* Line 1 — contract id + date range */}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
                  <span className="font-mono text-primary/80 whitespace-nowrap">{c.contract_number || `#${c.id?.slice(-6).toUpperCase()}`}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="tabular-nums whitespace-nowrap">{formatDate(c.start_date)}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
                  <span className="tabular-nums whitespace-nowrap">{formatDate(c.end_date)}</span>
                </div>
                {/* Line 2 — company name */}
                <div className="flex items-center gap-1.5 mt-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{c.company_name || '—'}</p>
                  {c.auto_renewal && <Repeat className="w-3 h-3 text-primary flex-shrink-0" />}
                </div>
                {/* Line 3 — meta (desktop only) */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground mt-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap">
                    Monthly Rental
                  </span>
                  {c.driver_name && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
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
                <div className="w-[112px] sm:w-[152px] flex items-center justify-end gap-1.5">
                  <span className="text-[11px] font-semibold tabular-nums text-foreground/60">{formatCurrency(calc.base)}/mo</span>
                </div>

                <div className="h-6 w-px bg-border/50 hidden sm:block" />

                <div className="w-[96px] sm:w-[112px] text-right">
                  <p className="text-sm font-bold text-emerald-400 tabular-nums whitespace-nowrap leading-tight">{formatCurrency(calc.total)}</p>
                  <p className="text-[10px] tabular-nums text-muted-foreground leading-tight">rent+overtime</p>
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