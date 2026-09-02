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
import { useOpsBulk } from '@/lib/operationsFilterStore';

const STATUS_OPTIONS = [
  { value: 'scheduled',    label: 'Scheduled',    dot: 'bg-blue-400' },
  { value: 'trip_started', label: 'Started',      dot: 'bg-orange-400' },
  { value: 'trip_ended',   label: 'Ended',        dot: 'bg-purple-400' },
  { value: 'completed',    label: 'Completed',    dot: 'bg-emerald-400' },
  { value: 'cancelled',    label: 'Cancelled',    dot: 'bg-red-400' },
];

const EASE = [0.16, 1, 0.3, 1];

/**
 * Mobile-only inline bulk-action icons rendered in the TopBar sub-header.
 * Standalone icons (no panel wrapper) with framer-motion transitions.
 * Reads bulk state from the shared operationsFilterStore.
 */
export default function MobileBulkActionsInline() {
  const bulk = useOpsBulk();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!bulk) return null;

  const { selectedCount, totalCount, onSelectAll, onClear, onBulkStatus, onBulkDelete, onBulkExportCSV, onBulkExportPDF, selectedTrips = [] } = bulk;
  const hasSelection = selectedCount > 0;
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
            key="bulk-inline"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="md:hidden flex items-center gap-1.5"
          >
            {/* Count badge — standalone */}
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold tabular-nums flex-shrink-0">
              {selectedCount}
            </span>

            {/* Select all / clear — standalone icon */}
            <button
              onClick={() => (allSelected ? onClear() : onSelectAll())}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground/70 active:scale-90 transition-transform flex-shrink-0"
              aria-label={allSelected ? 'Clear selection' : 'Select all'}
            >
              {allSelected ? <X className="w-4 h-4" /> : <CheckCheck className="w-4 h-4" />}
            </button>

            {/* Bulk status update — standalone icon with dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-primary active:scale-90 transition-transform flex-shrink-0"
                  aria-label="Update status"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px]">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Update {selectedCount} trip{selectedCount !== 1 ? 's' : ''}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STATUS_OPTIONS.map((opt) => {
                  const { valid, invalid } = getTransitionCounts(opt.value);
                  const noneValid = valid === 0;
                  return (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => !noneValid && onBulkStatus(opt.value)}
                      disabled={noneValid}
                      className="text-xs cursor-pointer flex items-center gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                      <span className="flex-1">{opt.label}</span>
                      {noneValid
                        ? <Lock className="w-3 h-3 opacity-40 ml-auto" />
                        : invalid > 0
                          ? <span className="text-[10px] text-muted-foreground ml-auto">{valid}/{valid + invalid}</span>
                          : null
                      }
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export CSV — standalone icon */}
            {onBulkExportCSV && (
              <button
                onClick={onBulkExportCSV}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-emerald-400 active:scale-90 transition-transform flex-shrink-0"
                aria-label="Export CSV"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            )}

            {/* Export PDF — standalone icon */}
            {onBulkExportPDF && (
              <button
                onClick={onBulkExportPDF}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-rose-400 active:scale-90 transition-transform flex-shrink-0"
                aria-label="Export PDF"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}

            {/* Delete — standalone icon */}
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-red-400 active:scale-90 transition-transform flex-shrink-0"
              aria-label="Delete selected"
            >
              <Trash2 className="w-4 h-4" />
            </button>
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