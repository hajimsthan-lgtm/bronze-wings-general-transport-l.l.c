import { useState } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Trash2, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export default function DraftsTable({ drafts, onContinue, onDelete }) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  return (
    <div className="relative">
      <div className="rounded-xl border border-border shadow-sm bg-background/40 overflow-auto max-h-[70vh] trips-scroll trips-grid">
        <Table className="trips-grid-table">
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              {[
                ['CLIENT', 'text-left'],
                ['ROUTE', 'text-left'],
                ['LAST EDITED', 'text-left'],
                ['ACTIONS', 'text-center'],
              ].map(([label, align]) => (
                <TableHead
                  key={label}
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wider text-foreground/75 trips-grid-th sticky top-0 z-10 bg-muted',
                    align
                  )}
                >
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.map((draft) => (
              <TableRow
                key={draft.id}
                className="hover:bg-primary/5 transition-all duration-150 group cursor-pointer"
                onClick={() => onContinue(draft)}
              >
                {/* CLIENT */}
                <TableCell className="align-top trips-grid-td">
                  <p className="text-xs font-medium text-foreground truncate">{draft.client_name || 'Unknown client'}</p>
                </TableCell>
                {/* ROUTE */}
                <TableCell className="align-top trips-grid-td">
                  {draft.from_location || draft.to_location ? (
                    <p className="text-xs text-foreground truncate">
                      {draft.from_location || '—'} <span className="text-muted-foreground mx-1">→</span> {draft.to_location || '—'}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">—</p>
                  )}
                </TableCell>
                {/* LAST EDITED */}
                <TableCell className="align-top trips-grid-td whitespace-nowrap">
                  <p className="text-xs text-foreground tabular-nums">{formatDate(draft.updated_date || draft.created_date)}</p>
                </TableCell>
                {/* ACTIONS */}
                <TableCell className="align-top trips-grid-td" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onContinue(draft)}
                      className="text-primary text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-primary/10 transition-colors inline-flex items-center gap-1"
                      title="Continue editing"
                    >
                      Continue <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(draft)}
                      className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 p-1.5 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this draft trip. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { onDelete(deleteTarget); setDeleteTarget(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}