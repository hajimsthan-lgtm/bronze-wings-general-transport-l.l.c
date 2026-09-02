import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, CheckCheck, ChevronDown, Lock, FileSpreadsheet, FileText } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { canTransition } from '@/lib/tripStatusWorkflow';

const STATUS_OPTIONS = [
  { value: 'scheduled',    label: 'Scheduled',    dot: 'bg-blue-400' },
  { value: 'trip_started', label: 'Started',      dot: 'bg-orange-400' },
  { value: 'trip_ended',   label: 'Ended',        dot: 'bg-purple-400' },
  { value: 'completed',    label: 'Completed',    dot: 'bg-emerald-400' },
  { value: 'cancelled',    label: 'Cancelled',    dot: 'bg-red-400' },
];

const EASE = [0.16, 1, 0.3, 1];

/**
 * Mobile-only floating bulk-action bar.
 * Appears above the bottom navigation when trips are selected.
 * Reads bulk state from the shared operationsFilterStore.
 */
export default function MobileBulkActionBar({ bulk }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hasSelection = bulk && bulk.selectedCount > 0;
  if (!bulk) return null;

  const { selectedCount, totalCount, onSelectAll, onClear, onBulkStatus, onBulkDelete, onBulkExportCSV, onBulkExportPDF, selectedTrips = [] } = bulk;
  const allSelected = selectedCount === totalCount && selectedCount > 0;

  const getTransitionCounts = (targetStatus) => {
    let valid = 0, invalid = 0;
    selectedTrips.forEach((t) => {
      if (canTransition(t.status, targetStatus)) valid++;
      else invalid++;
    });
    return { valid, invalid };
  };

  return (
    <>
      <AnimatePresence>
        {hasSelection && (
        <motion.div
          key="bulk-bar"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="md:hidden fixed bottom-[64px] left-2 right-2 z-[60]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div
            className="rounded-2xl px-2.5 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar"
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,32,0.95) 0%, rgba(12,12,22,0.98) 100%)',
              backdropFilter: 'blur(28px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
              border: '1px solid rgba(var(--panel-accent-rgb),0.30)',
              boxShadow: '0 -4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* Count badge */}
            <div className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl bg-white/10 border border-white/15 flex-shrink-0">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold tabular-nums">
                {selectedCount}
              </span>
              <span className="text-[10px] font-semibold text-white/90 uppercase tracking-wider">sel</span>
            </div>

            {/* Select all / clear */}
            <button
              onClick={() => (allSelected ? onClear() : onSelectAll())}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/8 border border-white/12 text-white/80 active:scale-90 transition-transform flex-shrink-0"
              aria-label={allSelected ? 'Clear selection' : 'Select all'}
            >
              {allSelected ? <X className="w-4 h-4" /> : <CheckCheck className="w-4 h-4" />}
            </button>

            {/* Export CSV */}
            {onBulkExportCSV && (
              <button
                onClick={onBulkExportCSV}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 active:scale-90 transition-transform flex-shrink-0"
                aria-label="Export CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            )}

            {/* Export PDF */}
            {onBulkExportPDF && (
              <button
                onClick={onBulkExportPDF}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 active:scale-90 transition-transform flex-shrink-0"
                aria-label="Export PDF"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}

            {/* Delete */}
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 active:scale-90 transition-transform flex-shrink-0"
              aria-label="Delete selected"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
        )}
      </AnimatePresence>

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