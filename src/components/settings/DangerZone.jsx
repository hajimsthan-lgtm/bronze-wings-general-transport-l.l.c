import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import SettingsCard from './SettingsCard';

/**
 * Danger Zone with multi-step verification: the confirm button stays
 * disabled until the user types "DELETE". Muted destructive palette that
 * turns vivid on hover.
 */
export default function DangerZone({ deleting, onDelete }) {
  const [confirm, setConfirm] = useState('');
  const ready = confirm === 'DELETE';

  return (
    <SettingsCard icon={AlertTriangle} title="Danger Zone" description="Irreversible and destructive actions" accent="danger">
      <div className="rounded-xl border border-destructive/15 bg-destructive/[0.04] p-4 space-y-4 transition-colors hover:border-destructive/35">
        <div className="flex items-start gap-3">
          <Trash2 className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-white/90">Delete Account</p>
            <p className="text-xs text-white/40 mt-1">
              This will sign you out and remove access to your workspace. This action cannot be undone.
            </p>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="w-full active:scale-[0.98]">
              <Trash2 className="w-4 h-4" /> Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Type <span className="font-mono font-semibold text-destructive">DELETE</span> to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type DELETE"
              className="bg-white/[0.03] border-white/10"
              autoFocus
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirm('')}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { if (ready) onDelete(); }}
                disabled={!ready || deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Deleting...' : 'Yes, delete account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SettingsCard>
  );
}