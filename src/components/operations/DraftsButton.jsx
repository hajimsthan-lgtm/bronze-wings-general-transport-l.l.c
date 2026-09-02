import { useState, useMemo } from 'react';
import { FileEdit } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useTrips } from '@/hooks/useEntityQueries';
import { useToast } from '@/components/ui/use-toast';
import DraftsListSheet from '@/components/trips/DraftsListSheet';

/**
 * Small rounded pill button for the top header.
 * Only renders when draft trips exist.  Clicking opens a dialog
 * listing all drafts with continue / delete actions.
 */
export default function DraftsButton() {
  const { data: trips = [] } = useTrips();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const drafts = useMemo(
    () => (trips || []).filter((t) => t.is_draft && !t.deleted_at),
    [trips]
  );

  const handleDelete = async (draft) => {
    try {
      await base44.entities.Trip.delete(draft.id);
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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold
                   bg-amber-500/15 text-amber-500 border border-amber-500/30
                   hover:bg-amber-500/25 hover:border-amber-500/45
                   transition-all duration-200 animate-fade-in"
        title={`${drafts.length} draft${drafts.length !== 1 ? 's' : ''} — click to view`}
      >
        <FileEdit className="w-3.5 h-3.5" />
        <span className="tabular-nums">{drafts.length}</span>
        <span className="hidden lg:inline">Draft{drafts.length !== 1 ? 's' : ''}</span>
      </button>

      <DraftsListSheet
        open={open}
        onOpenChange={setOpen}
        drafts={drafts}
        onContinue={handleContinue}
        onDelete={handleDelete}
      />
    </>
  );
}