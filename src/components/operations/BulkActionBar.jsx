import { useState } from 'react';
import { Trash2, X, CheckCheck, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', dot: 'bg-blue-400' },
  { value: 'in_transit', label: 'In Transit', dot: 'bg-amber-400' },
  { value: 'completed', label: 'Completed', dot: 'bg-emerald-400' },
  { value: 'cancelled', label: 'Cancelled', dot: 'bg-red-400' },
];

/**
 * Floating bulk-action bar — appears when trips are selected.
 * Provides count, select-all, bulk status update, and bulk delete.
 */
export default function BulkActionBar({ selectedCount, totalCount, onSelectAll, onClear, onBulkStatus, onBulkDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const allSelected = selectedCount === totalCount;

  if (selectedCount === 0) return null;

  return (
    <>
      <div
        className="fixed left-1/2 -translate-x-1/2 z-50 animate-fade-in-up"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(var(--panel-accent-rgb),0.22), rgba(var(--surf-2-rgb),0.92))',
            border: '1px solid rgba(var(--panel-accent-rgb),0.40)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)',
            backdropFilter: 'blur(24px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
          }}
        >
          {/* Count badge */}
          <div className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-xl bg-white/10 border border-white/15">
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold tabular-nums">
              {selectedCount}
            </span>
            <span className="text-[11px] font-semibold text-white/90 uppercase tracking-wider hidden sm:inline">selected</span>
          </div>

          {/* Select all / clear */}
          <button
            onClick={() => (allSelected ? onClear() : onSelectAll())}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white/8 border border-white/12 text-white/80 hover:bg-white/15 hover:text-white transition-colors text-xs font-medium"
            title={allSelected ? 'Clear selection' : 'Select all'}
          >
            {allSelected ? <X className="w-3.5 h-3.5" /> : <CheckCheck className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{allSelected ? 'Clear' : 'All'}</span>
          </button>

          {/* Bulk status update */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-white transition-colors"
                style={{
                  background: 'linear-gradient(135deg, rgba(var(--panel-accent-rgb),0.30), rgba(var(--panel-accent-rgb),0.18))',
                  border: '1px solid rgba(var(--panel-accent-rgb),0.45)',
                }}
              >
                Set Status
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[160px]">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Update {selectedCount} trip{selectedCount !== 1 ? 's' : ''}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => onBulkStatus(opt.value)}
                  className="text-xs cursor-pointer flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Bulk delete */}
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-colors text-xs font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} trip{selectedCount !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedCount} selected trip{selectedCount !== 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onBulkDelete(); setConfirmDelete(false); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedCount} trip{selectedCount !== 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}