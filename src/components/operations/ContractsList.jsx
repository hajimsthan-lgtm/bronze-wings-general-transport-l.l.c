import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Eye, Pencil, Trash2, MoreVertical, Building2, Repeat, ArrowRight } from 'lucide-react';

const STATUS_META = {
  active:    { dot: '#4ECDC4', text: '#4ECDC4', label: 'Active' },
  expired:   { dot: '#FF6B6B', text: '#FF6B6B', label: 'Expired' },
  terminated:{ dot: '#FF6B6B', text: '#FF6B6B', label: 'Terminated' },
};

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
        const sm = STATUS_META[c.status] || STATUS_META.active;
        const marginColor = margin >= 30 ? '#4ECDC4' : margin >= 15 ? '#FFB347' : '#FF6B6B';

        return (
          <div
            key={c.id}
            onClick={() => onDetails?.(c)}
            className="contract-row group animate-fade-in-up"
            style={{ animationDelay: `${Math.min(i * 0.03, 0.4)}s` }}
          >
            <div className="flex items-center" style={{ gap: '14px' }}>
              {/* Icon — 40×40, dark navy bg, white icon */}
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: 40, height: 40, borderRadius: 12, background: '#0F1B33', border: '1px solid #2A3B5C' }}
              >
                <Building2 className="w-5 h-5" style={{ color: '#FFFFFF' }} />
              </div>

              {/* Left content group */}
              <div className="flex-1 min-w-0">
                {/* Line 1 — contract id + date range (11px muted) */}
                <div className="flex items-center gap-1.5 min-w-0" style={{ color: '#8B9DBF', fontSize: 11 }}>
                  <span className="font-mono whitespace-nowrap" style={{ opacity: 0.8 }}>#{c.id?.slice(-6).toUpperCase()}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span className="tabular-nums whitespace-nowrap">{formatDate(c.start_date)}</span>
                  <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ opacity: 0.4 }} />
                  <span className="tabular-nums whitespace-nowrap">{formatDate(c.end_date)}</span>
                </div>
                {/* Line 2 — company name (16px bold white) */}
                <div className="flex items-center gap-1.5 mt-1 min-w-0">
                  <p className="font-bold truncate" style={{ color: '#FFFFFF', fontSize: 16, lineHeight: '1.2' }}>{c.company_name || '—'}</p>
                  {c.auto_renewal && <Repeat className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4ECDC4' }} />}
                </div>
                {/* Line 3 — meta (desktop only, 13px muted) */}
                <div className="hidden sm:flex items-center gap-1.5 mt-1 min-w-0" style={{ color: '#8B9DBF', fontSize: 13 }}>
                  <span className="uppercase tracking-wider whitespace-nowrap" style={{ opacity: 0.7, fontSize: 10 }}>
                    {t('monthly_contract')}
                  </span>
                  {c.driver_name && (
                    <>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <button
                        onClick={(e) => handleLink(e, driverMap, c.driver_name, '/admin/drivers')}
                        className="hover:text-white transition-colors truncate max-w-[120px]"
                      >{c.driver_name}</button>
                    </>
                  )}
                  {c.vehicle_plate && (
                    <>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <button
                        onClick={(e) => handleLink(e, vehicleMap, c.vehicle_plate, '/admin/vehicles')}
                        className="hover:text-white transition-colors tabular-nums whitespace-nowrap"
                      >{c.vehicle_plate}</button>
                    </>
                  )}
                </div>
              </div>

              {/* Right group — status + price + menu */}
              <div className="flex items-center flex-shrink-0" style={{ gap: '16px' }}>
                {/* Status pill + margin */}
                <div className="flex items-center" style={{ gap: 12 }}>
                  {/* Status pill */}
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 rounded-full whitespace-nowrap"
                    style={{ height: 26, background: '#1A2B4A', border: '1px solid #2A3B5C', color: '#E0E6F0', fontSize: 11, fontWeight: 500 }}
                  >
                    <span className="rounded-full" style={{ width: 6, height: 6, background: sm.dot }} />
                    {sm.label}
                  </span>
                  {/* Margin badge */}
                  <span
                    className="tabular-nums font-semibold whitespace-nowrap"
                    style={{ fontSize: 12, color: margin > 0 ? marginColor : '#8B9DBF' }}
                  >{margin}%</span>
                </div>

                {/* Divider */}
                <div className="hidden sm:block" style={{ width: 1, height: 24, background: '#2A3B5C' }} />

                {/* Price block */}
                <div className="text-right" style={{ minWidth: 84 }}>
                  <p className="font-bold tabular-nums whitespace-nowrap" style={{ color: '#FFFFFF', fontSize: 18, lineHeight: '1.15' }}>
                    {formatCurrency(monthlyRate)}
                  </p>
                  <p className="tabular-nums whitespace-nowrap" style={{ color: '#8B9DBF', fontSize: 12, lineHeight: '1.2', marginTop: 2 }}>
                    {formatCurrency(netProfit)}
                  </p>
                </div>

                {/* Three-dot menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center rounded-lg transition-colors"
                      style={{ width: 32, height: 32, color: '#8B9DBF' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = '#1A2B4A'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#8B9DBF'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <MoreVertical className="w-5 h-5" />
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