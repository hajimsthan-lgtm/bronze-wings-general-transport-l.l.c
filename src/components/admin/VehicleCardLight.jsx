import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Truck, MoreVertical, Pencil, Trash2, ExternalLink, FileText, ChevronDown } from 'lucide-react';
import OwnershipCard from '@/components/common/OwnershipCard';

const TYPE_THEMES = {
  truck:   { bg: '#F0FDF4', icon: '#1ED760', glow: 'rgba(30,215,96,0.18)' },
  tanker:  { bg: '#FFFBEB', icon: '#F59E0B', glow: 'rgba(245,158,11,0.18)' },
  pickup:  { bg: '#F0FDFA', icon: '#14b8a6', glow: 'rgba(20,184,166,0.18)' },
  trailer: { bg: '#F0FDF4', icon: '#22C55E', glow: 'rgba(34,197,94,0.18)' },
  other:   { bg: '#F0FDF4', icon: '#1ED760', glow: 'rgba(30,215,96,0.18)' },
};

const STATUS_LABEL = { active: 'Active', maintenance: 'Maintenance', inactive: 'Inactive' };
const STATUS_COLOR = { active: '#22C55E', maintenance: '#F59E0B', inactive: '#94A3B8' };
const PRICE_COLOR = '#0D9488';

export default function VehicleCardLight({ v, onOpen, onEdit, onDelete, onOwnershipChange }) {
  const { t } = useI18n();
  const [confirmDel, setConfirmDel] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const cfg = TYPE_THEMES[v.type] || TYPE_THEMES.other;
  const statusColor = STATUS_COLOR[v.status] || '#94A3B8';

  return (
    <>
      <div
        className="bg-white rounded-2xl overflow-hidden border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        onClick={() => onOpen?.(v)}
      >
        {/* Top section — tinted background with icon */}
        <div className="relative px-5 pt-5 pb-4 flex flex-col items-center" style={{ background: cfg.bg }}>
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/70 backdrop-blur-sm" style={{ color: statusColor }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
              {STATUS_LABEL[v.status] || v.status}
            </span>
          </div>
          {/* Dropdown menu */}
          <div className="absolute top-2.5 right-2.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button onClick={(e) => e.stopPropagation()} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/60 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen?.(v); }} className="cursor-pointer flex items-center gap-2"><ExternalLink className="w-3.5 h-3.5" /> Open</DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(v); }} className="cursor-pointer flex items-center gap-2"><Pencil className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfirmDel(true); }} className="cursor-pointer flex items-center gap-2 text-red-600"><Trash2 className="w-3.5 h-3.5" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Icon container */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mt-3" style={{ background: '#fff', boxShadow: `0 4px 24px ${cfg.glow}` }}>
            <Truck className="w-8 h-8" style={{ color: cfg.icon }} />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500 mt-2">{v.type || 'Vehicle'}</p>
        </div>

        {/* Bottom section — white with title, subtitle, plate */}
        <div className="px-4 pt-3 pb-4 bg-white">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">{[v.make, v.model].filter(Boolean).join(' ') || 'Unknown'}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{v.year || '—'}</p>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-xl font-bold tracking-tight" style={{ color: PRICE_COLOR }}>{v.plate_number || '—'}</span>
          </div>

          {/* Collapsible ownership */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLicenseOpen((o) => !o); }}
            className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 hover:bg-gray-100/60 transition-colors"
          >
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <FileText className="w-3 h-3" style={{ color: cfg.icon }} />
              Vehicle License
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${licenseOpen ? 'rotate-180' : ''}`} />
          </button>
          {licenseOpen && (
            <div className="mt-2 animate-fade-in">
              <OwnershipCard front={v.ownership_front_url} back={v.ownership_back_url} onChange={onOwnershipChange} />
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">{t('delete')} Vehicle?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-200 text-gray-700">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete?.(v)} className="bg-red-500 hover:bg-red-600 text-white">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}