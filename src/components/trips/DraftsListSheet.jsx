import { useState } from 'react';
import { FileEdit, Trash2, ChevronRight, MapPin, User, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/common/EmptyState';
import { formatDate } from '@/lib/formatters';

export default function DraftsListSheet({ open, onOpenChange, drafts, onContinue, onDelete }) {
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = async (draft) => {
    await onDelete(draft);
    setDeleteId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/90 backdrop-blur-2xl border border-primary/25 w-[92vw] max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col !top-[50%] !translate-y-[-50%] !left-[50%] !translate-x-[-50%]">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/50 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="hud-icon-tile w-9 h-9">
              <FileEdit className="w-4 h-4" />
            </div>
            <div>
              <span className="font-display text-lg">Draft Trips</span>
              <p className="text-xs text-muted-foreground mt-0.5 font-normal">
                {drafts.length} unfinished {drafts.length === 1 ? 'trip' : 'trips'} · click to continue editing
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
                      onClick={(e) => { e.stopPropagation(); setDeleteId(draft.id); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex items-center gap-1 text-primary text-xs font-medium px-2 group-hover:gap-2 transition-all">
                      Continue
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {deleteId === draft.id && (
                    <div
                      className="absolute inset-0 bg-card/95 backdrop-blur-sm flex items-center justify-center gap-2 rounded-2xl z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs text-muted-foreground mr-2">Delete this draft?</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setDeleteId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-destructive hover:bg-destructive/90 text-white"
                        onClick={() => handleDelete(draft)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}