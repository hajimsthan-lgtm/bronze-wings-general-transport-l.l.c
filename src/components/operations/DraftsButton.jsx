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
      










      

      <DraftsListSheet
        open={open}
        onOpenChange={setOpen}
        drafts={drafts}
        onContinue={handleContinue}
        onDelete={handleDelete} />
      
    </>);

}