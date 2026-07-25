import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Pencil, Trash2, Mail, Phone, Hash, Building2 } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { getInitials } from '@/lib/formatters';

const STATUS_ACCENT = { active: '#34d399', inactive: '#94a3b8' };

export default function ClientCard({ c, onOpen, onEdit, onDelete }) {
  const { t } = useI18n();
  const accent = STATUS_ACCENT[c.status] || '#94a3b8';

  return (
    <div className="entity-card cursor-pointer group relative" onClick={onOpen}>
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-[20px]" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-2xl entity-avatar flex items-center justify-center text-sm font-semibold relative">
            {getInitials(c.name)}
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-[#1a1d29]" style={{ background: accent, boxShadow: `0 0 10px ${accent}` }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate"><Building2 className="w-3 h-3" />{c.contact_person || '—'}</p>
          </div>
        </div>
        <StatusBadge status={c.status} />
      </div>

      <div className="space-y-1.5 mb-3">
        {c.email && <p className="flex items-center gap-1.5 text-xs text-muted-foreground truncate"><Mail className="w-3 h-3" />{c.email}</p>}
        {c.phone && <p className="flex items-center gap-1.5 text-xs text-muted-foreground truncate"><Phone className="w-3 h-3" />{c.phone}</p>}
        {c.trn && <p className="flex items-center gap-1.5 text-xs text-muted-foreground truncate"><Hash className="w-3 h-3" />TRN: {c.trn}</p>}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" onClick={onEdit} className="text-muted-foreground hover:text-foreground h-8 px-2"><Pencil className="w-3.5 h-3.5" /></Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-400 h-8 px-2"><Trash2 className="w-3.5 h-3.5" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">{t('delete')}?</AlertDialogTitle>
              <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-destructive">{t('delete')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}