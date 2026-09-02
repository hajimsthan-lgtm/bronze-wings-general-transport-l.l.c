import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, X, CheckCheck, ChevronDown, Lock } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { ExcelIcon, PdfIcon } from '@/components/common/BrandIcons';
import { canTransition } from '@/lib/tripStatusWorkflow';

const STATUS_OPTIONS = [
  { value: 'scheduled',    label: 'Scheduled',    dot: 'bg-blue-400' },
  { value: 'trip_started', label: 'Trip Started',  dot: 'bg-orange-400' },
  { value: 'trip_ended',   label: 'Trip Ended',    dot: 'bg-purple-400' },
  { value: 'completed',    label: 'Completed',     dot: 'bg-emerald-400' },
  { value: 'cancelled',    label: 'Cancelled',     dot: 'bg-red-400' },
];

const EASE = [0.16, 1, 0.3, 1];

/**
 * Inline bulk-action controls, rendered inside the OpsSubBar sub-header.
 * Icons are shown standalone (no panel wrapper) with enter/exit transitions.
 * Status transitions are enforced using the same canTransition() rules as the individual dropdown.
 * selectedTrips is the array of full trip objects for validation.
 */
export default function BulkActionBar({
  selectedCount, totalCount, onSelectAll, onClear,
  onBulkStatus, onBulkDelete, onBulkExportCSV, onBulkExportPDF,
  selectedTrips = []
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const allSelected = selectedCount === totalCount;

  // For a given target status, count how many selected trips can and cannot transition
  const getTransitionCounts = (targetStatus) => {
    let valid = 0, invalid = 0;
    selectedTrips.forEach((t) => {
      if (canTransition(t.status, targetStatus)) valid++;
      else invalid++;
    });
    return { valid, invalid };
  };

  const handleStatusClick = (targetStatus) => {
    onBulkStatus(targetStatus);
  };

  return (
    <>
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            key="bulk-bar"
            initial={{ opacity: 0, x: 16, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="flex items-center gap-1.5"
          >
            {/* Count badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-xl bg-white/10 border border-white/15"
            >
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold tabular-nums">
                {selectedCount}
              </span>
              <span className="text-[11px] font-semibold text-white/90 uppercase tracking-wider hidden sm:inline">selected</span>
            </motion.div>

            {/* Select all / clear */}
            <motion.button
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2, ease: EASE, delay: 0.03 }}
              onClick={() => (allSelected ? onClear() : onSelectAll())}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-white/8 border border-white/12 text-white/80 hover:bg-white/15 hover:text-white transition-colors text-xs font-medium"
            >
              {allSelected ? <X className="w-3.5 h-3.5" /> : <CheckCheck className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{allSelected ? 'Clear' : 'All'}</span>
            </motion.button>

            {/* Export selected — CSV */}
            {onBulkExportCSV && (
              <motion.button
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2, ease: EASE, delay: 0.09 }}
                onClick={onBulkExportCSV}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200 transition-colors text-xs font-semibold"
              >
                <ExcelIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </motion.button>
            )}

            {/* Export selected — PDF */}
            {onBulkExportPDF && (
              <motion.button
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.2, ease: EASE, delay: 0.12 }}
                onClick={onBulkExportPDF}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 hover:text-rose-200 transition-colors text-xs font-semibold"
              >
                <PdfIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </motion.button>
            )}

            {/* Bulk delete */}
            <motion.button
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2, ease: EASE, delay: 0.15 }}
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 hover:text-red-200 transition-colors text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </motion.button>
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