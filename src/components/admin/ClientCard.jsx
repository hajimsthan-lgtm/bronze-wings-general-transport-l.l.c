import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { MoreVertical, Pencil, Trash2, ExternalLink, Building2, Phone, Hash, User } from 'lucide-react';
import { getInitials } from '@/lib/formatters';
import CardChip from '@/components/admin/CardChip';

const ACCENT = '#10b981';
const STATUS_DOT = { active: '#34d399', inactive: '#94a3b8' };

export default function ClientCard({ c, onOpen, onEdit, onDelete }) {
  const { t } = useI18n();
  const [confirmDel, setConfirmDel] = useState(false);
  const dot = STATUS_DOT[c.status] || '#94a3b8';

  return (
    <div
      className="entity-card cursor-pointer animate-fade-in-up relative overflow-hidden group"
      onClick={() => onOpen?.(c)}
    >
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20" style={{ background: ACCENT }} />

      <div className="relative flex items-start justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">Client</span>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium flex-shrink-0" style={{ background: `${dot}1a`, border: `1px solid ${dot}40`, color: dot }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />
            {(c.status || '').replace(/_/g, ' ')}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button onClick={(e) => e.stopPropagation()} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen?.(c); }} className="cursor-pointer flex items-center gap-2"><ExternalLink className="w-3.5 h-3.5" /> Open</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(c); }} className="cursor-pointer flex items-center gap-2"><Pencil className="w-3.5 h-3.5" /> Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfirmDel(true); }} className="cursor-pointer flex items-center gap-2 text-red-400"><Trash2 className="w-3.5 h-3.5" /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <p className="relative mt-1 text-xl font-bold tracking-tight text-foreground font-display truncate">{c.name}</p>

      <div className="relative mt-3 h-28 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ACCENT}33 0%, rgba(12,16,26,0.6) 70%)` }}>
        <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1.5px)', backgroundSize: '18px 18px' }} />
        <Building2 className="absolute right-3 bottom-3 w-10 h-10 opacity-25" style={{ color: ACCENT }} />
        <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: `linear-gradient(135deg, ${ACCENT}50, ${ACCENT}18)`, border: `1px solid ${ACCENT}55`, boxShadow: `0 0 24px -6px ${ACCENT}, inset 0 1px 0 rgba(255,255,255,0.15)`, color: '#fff' }}>
          {getInitials(c.name)}
        </div>
      </div>

      <div className="relative mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <CardChip icon={User} label="Contact" value={c.contact_person} accent={ACCENT} />
        <CardChip icon={Phone} label="Phone" value={c.phone} accent={ACCENT} />
        <CardChip icon={Hash} label="TRN" value={c.trn} accent={ACCENT} />
      </div>

      <AlertDialog open={confirmDel} onOpenChange={setConfirmDel}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete?.(c)} className="bg-destructive">{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}