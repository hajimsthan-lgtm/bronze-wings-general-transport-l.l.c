import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { Pencil, Trash2, ChevronRight, Truck as TruckIcon, Check } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate } from '@/lib/formatters';

export default function VehicleListRow({ v, onOpen, onEdit, onDelete, selected = false, onSelect }) {
  const { t } = useI18n();
  const [confirmDel, setConfirmDel] = useState(false);

  return (
    <>
      <div
        className={`row-card row-edge-glow flex items-center gap-3 cursor-pointer group ${selected ? 'ring-1 ring-primary/50' : ''}`}
        onClick={() => onOpen?.(v)}
        style={{ ['--row-accent']: '#1ED760' }}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect?.(!selected); }}
          className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-primary border-primary' : 'border-border hover:border-primary/60'}`}
          aria-label={selected ? 'Deselect' : 'Select'}
        >
          {selected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
        </button>
        <div className="w-10 h-10 rounded-xl entity-avatar flex items-center justify-center flex-shrink-0"><TruckIcon className="w-4 h-4" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{v.plate_number}</p>
            <StatusBadge status={v.status} />
          </div>
          <p className="text-xs text-muted-foreground truncate">{v.make} {v.model}{v.year ? ` · ${v.year}` : ''} · {v.type}</p>
        </div>
        <div className="hidden md:flex items-center gap-5 text-xs text-muted-foreground">
          <div className="text-right"><p className="text-[10px] uppercase tracking-wider">Driver</p><p className="text-foreground font-medium truncate max-w-[120px]">{v.assigned_driver || '—'}</p></div>
          <div className="text-right"><p className="text-[10px] uppercase tracking-wider">Reg Expiry</p><p className="text-foreground font-medium">{formatDate(v.registration_expiry) || '—'}</p></div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => onEdit?.(v)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"><Pencil className="w-3.5 h-3.5" /></button>
          <button type="button" onClick={() => setConfirmDel(true)} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

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
    </>
  );
}