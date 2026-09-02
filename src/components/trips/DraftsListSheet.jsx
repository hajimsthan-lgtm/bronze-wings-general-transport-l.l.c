import { useState } from 'react';
import { FileEdit, Trash2, ChevronRight, MapPin, User, Calendar, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/common/EmptyState';
import { formatDate } from '@/lib/formatters';

export default function DraftsListSheet({ open, onOpenChange, drafts, onContinue, onDelete, deleting = false }) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await onDelete(deleteTarget);
    setDeleteTarget(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card/90 backdrop-blur-2xl border border-primary/25 w-[92vw] max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col !top-[50%] !translate-y-[-50%] !left-[50%] !translate-x-[-50%]">
          <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/50 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2.5 text-foreground">
              <div className="hud-icon-tile w-9 h-9">
                <FileEdit className="w-4 h-4" />
              </div>
              <div>
                <span className="font-display text-lg">Draft Trips</span>
                <p className="text-xs text-muted-foreground mt-0.5 font-normal">
                  {drafts.length} unfinished {drafts.length === 1 ? 'trip' : 'trips'} · click a row to continue editing
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {drafts.length === 0 ? (
              <EmptyState
                icon={FileEdit}
                title="No draft trips"
                description="Save a trip as draft to continue it later — it won't appear in your main trips list until submitted."
              />
            ) : (
              <div className="space-y-2">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="row-card group flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-all"
                    onClick={() => onContinue(draft)}
                  >
                    <div className="hud-icon-tile w-10 h-10 flex-shrink-0 !rounded-xl">
                      <FileEdit className="w-4 h-4 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {draft.client_name || 'Unknown client'}
                        </span>
                        {draft.from_location && draft.to_location && (
                          <span className="text-xs text-muted-foreground truncate">
                            · {draft.from_location} → {draft.to_location}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                        {draft.client_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {draft.client_name}
                          </span>
                        )}
                        {draft.from_location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {draft.from_location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(draft.updated_date || draft.created_date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(draft); }}
                        title="Delete draft"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <div className="flex items-center gap-1 text-primary text-xs font-medium px-2 group-hover:gap-2 transition-all">
                        Continue
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation — proper dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-destructive" />
              Delete this draft?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the draft trip
              {deleteTarget?.client_name ? ` for ${deleteTarget.client_name}` : ''}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
            >
              {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}