import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

/**
 * Reusable duplicate-restriction alert.
 * Shows when a potential duplicate record is found on "Add New" submit.
 * User can cancel or continue (proceed with the save anyway).
 *
 * Props:
 *  - open: boolean
 *  - entityType: string (e.g. "vehicle", "driver", "client", "vendor")
 *  - matchLabel: string (the matching field value, e.g. plate number or name)
 *  - onContinue: () => void  (proceed with the save)
 *  - onCancel: () => void
 */
export default function DuplicateConfirmDialog({ open, entityType, matchLabel, onContinue, onCancel }) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent className="glass-card border-amber-500/30">
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <AlertDialogTitle className="text-foreground">Duplicate {entityType} detected</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                A {entityType} with <span className="font-semibold text-foreground">"{matchLabel}"</span> already exists in your records.
                <br />Do you want to continue and save this entry anyway?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onContinue}
            className="bg-amber-500 hover:bg-amber-600 text-white border-0"
          >
            Continue Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}