import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, AlertTriangle } from 'lucide-react';

/**
 * Reusable delete confirmation dialog.
 * @param {boolean} open
 * @param {function} onOpenChange
 * @param {function} onConfirm - called when user confirms
 * @param {string} title
 * @param {string} description
 * @param {string} confirmLabel
 * @param {number} count - number of items being deleted (for bulk)
 */
export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Confirm Delete',
  description = 'Are you sure you want to delete this item?',
  confirmLabel = 'Delete',
  count = 1,
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/15 border border-red-500/30">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left pl-13">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white border-red-500"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            {confirmLabel} {count > 1 ? `(${count})` : ''}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}