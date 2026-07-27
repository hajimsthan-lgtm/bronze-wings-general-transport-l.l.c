import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { MoreVertical, Pencil, Trash2, ExternalLink, Tag, Fuel as FuelIcon, CalendarClock, ChevronDown, FileText } from 'lucide-react';
import CardChip from '@/components/admin/CardChip';
import PlateBadge from '@/components/common/PlateBadge';
import OwnershipCard from '@/components/common/OwnershipCard';

const ACCENT = '#3b82f6';
const STATUS_DOT = { active: '#34d399', maintenance: '#f59e0b', inactive: '#94a3b8' };

function yearsLeft(dateStr) {
  if (!dateStr) return null;
  const days = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (days < 0) return 'Exp';
  const y = Math.floor(days / 365);
  if (y >= 1) return `${y}y`;
  const m = Math.floor(days / 30);
  return m <= 0 ? '<1m' : `${m}m`;
}

export default function VehicleCard({ v, onOpen, onEdit, onDelete, onOwnershipChange }) {
  const { t } = useI18n();
  const [confirmDel, setConfirmDel] = useState(false);
  const [licenseOpen, setLicenseOpen] = useState(false);
  const dot = STATUS_DOT[v.status] || '#94a3b8';

  return (
    <div
      className="entity-card cursor-pointer animate-fade-in-up relative overflow-hidden group p-3.5"
      onClick={() => onOpen?.(v)}
    >
      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-15" style={{ background: ACCENT }} />

      <div className="relative flex items-start justify-between">
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60 truncate">{v.type || 'Vehicle'}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium" style={{ background: `${dot}1a`, border: `1px solid ${dot}40`, color: dot }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />
            {(v.status || '').replace(/_/g, ' ')}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button onClick={(e) => e.stopPropagation()} className="w-6 h-6 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen?.(v); }} className="cursor-pointer flex items-center gap-2"><ExternalLink className="w-3.5 h-3.5" /> Open</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(v); }} className="cursor-pointer flex items-center gap-2"><Pencil className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfirmDel(true); }} className="cursor-pointer flex items-center gap-2 text-red-400"><Trash2 className="w-3.5 h-3.5" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <PlateBadge plate={v.plate_number} compact className="relative mt-1" />
      <p className="relative text-[11px] text-muted-foreground truncate mt-1.5">{v.make} {v.model}{v.year ? ` · ${v.year}` : ''}</p>

      <div className="relative mt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <CardChip icon={Tag} label="Type" value={v.type} accent={ACCENT} />
        <CardChip icon={FuelIcon} label="Fuel" value={v.fuel_type} accent={ACCENT} />
        <CardChip icon={CalendarClock} label="Reg" value={yearsLeft(v.registration_expiry)} accent={ACCENT} />
      </div>

      {/* Collapsible vehicle license */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setLicenseOpen((o) => !o); }}
        className="relative mt-3 w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05] transition-colors"
      >
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <FileText className="w-3 h-3" style={{ color: ACCENT }} />
          Vehicle License
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 ${licenseOpen ? 'rotate-180' : ''}`} />
      </button>
      {licenseOpen && (
        <div className="relative mt-2 animate-fade-in">
          <OwnershipCard front={v.ownership_front_url} back={v.ownership_back_url} onChange={onOwnershipChange} />
        </div>
      )}

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">{t('delete')} Vehicle?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete?.(v)} className="bg-destructive">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}