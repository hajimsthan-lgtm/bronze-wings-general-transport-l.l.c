import { useState, useMemo } from 'react';
import { FileEdit, X } from 'lucide-react';
import { useTrips, useTripDelete } from '@/hooks/useEntityQueries';
import { useToast } from '@/components/ui/use-toast';
import DraftsListSheet from '@/components/trips/DraftsListSheet';

/**
 * Refined draft pill for the top header.
 * Only renders when draft trips exist. Uses the trip delete mutation
 * so the trips cache (and the drafts list) refresh instantly after delete.
 */
export default function DraftsButton() {
  const { data: trips = [] } = useTrips();
  const deleteTrip = useTripDelete();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const drafts = useMemo(
    () => (trips || []).filter((t) => t.is_draft && !t.deleted_at),
    [trips]
  );

  const handleDelete = async (draft) => {
    try {
      await deleteTrip.mutateAsync(draft.id);
      toast({ title: 'Draft deleted' });
    } catch {
      toast({ title: 'Could not delete draft', variant: 'destructive' });
    }
  };

  const handleContinue = (draft) => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('ops:continue-draft', { detail: draft }));
  };

  if (drafts.length === 0) return null;

  const count = drafts.length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative inline-flex items-center gap-2 h-9 pl-2.5 pr-3.5 rounded-full
                   text-xs font-semibold tracking-tight
                   bg-gradient-to-r from-amber-500/12 to-orange-500/8
                   text-amber-500
                   border border-amber-500/25
                   hover:border-amber-500/50 hover:from-amber-500/20 hover:to-orange-500/12
                   transition-all duration-300
                   shadow-[0_2px_10px_-3px_rgba(245,158,11,0.3)]
                   hover:shadow-[0_4px_16px_-4px_rgba(245,158,11,0.45)]
                   animate-fade-in"
        title={`${count} draft${count !== 1 ? 's' : ''} — click to view`}
      >
        <span className="relative flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30">
          <FileEdit className="w-3 h-3" />
          <span className="absolute -top-1 -right-1 flex min-w-[14px] h-[14px] px-0.5 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white tabular-nums leading-none ring-2 ring-background">
            {count}
          </span>
        </span>
        <span className="hidden lg:inline">Drafts</span>
      </button>

      <DraftsListSheet
        open={open}
        onOpenChange={setOpen}
        drafts={drafts}
        onContinue={handleContinue}
        onDelete={handleDelete}
        deleting={deleteTrip.isPending}
      />
    </>
  );
}