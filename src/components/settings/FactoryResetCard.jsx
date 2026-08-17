import { useState } from 'react';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import SettingsCard from './SettingsCard';
import PinGuardModal from './PinGuardModal';
import { base44 } from '@/api/base44Client';

const ENTITIES = [
  'Trip', 'Invoice', 'ClientPayment', 'Vehicle', 'Driver', 'Client', 'Vendor',
  'MonthlyContract', 'ContractExpense', 'SalaryRecord', 'DriverDeduction',
  'BankTransaction', 'CashTransaction', 'FuelRecord', 'ServiceRecord',
  'Expense', 'Document', 'FixedCharge', 'Transaction', 'PaymentBreakdown',
  'Customer', 'AdvancePayment', 'VendorExpense', 'BankReconciliation',
  'Service', 'GeneratedPrompt', 'Staff', 'CompanySettings',
];

export default function FactoryResetCard({ user }) {
  const [confirm, setConfirm] = useState('');
  const [resetting, setResetting] = useState(false);
  const [progress, setProgress] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const ready = confirm === 'RESET ALL DATA';

  const handleReset = async () => {
    if (!ready || resetting) return;
    setResetting(true);
    let cleared = 0;
    let failed = 0;
    for (let i = 0; i < ENTITIES.length; i++) {
      const name = ENTITIES[i];
      try {
        const entity = base44.entities[name];
        if (!entity || typeof entity.deleteMany !== 'function') continue;
        await entity.deleteMany({});
        cleared++;
      } catch {
        failed++;
      }
      setProgress(`${i + 1}/${ENTITIES.length}`);
    }
    setResetting(false);
    setConfirm('');
    setProgress('');
    setDialogOpen(false);
    toast({
      title: failed > 0 ? `Factory reset partial — ${cleared} cleared, ${failed} failed` : `Factory reset complete — ${cleared} entities cleared`,
      description: 'All business data has been wiped. The system is now fresh.',
    });
  };

  return (
    <SettingsCard icon={RefreshCw} title="Factory Data Reset" description="Wipe ALL business data and start fresh" accent="danger">
      <div className="rounded-xl border border-destructive/15 bg-destructive/[0.04] p-4 space-y-4 transition-colors hover:border-destructive/35">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-white/90">Erase Everything</p>
            <p className="text-xs text-white/40 mt-1 leading-relaxed">
              This permanently deletes <span className="text-rose-300 font-semibold">all</span> trips, invoices, payments, clients, drivers, vehicles, vendors, expenses, salaries, contracts, bank/cash transactions, fuel records, documents, and settings. Users and auth are preserved. This action <span className="text-rose-300 font-semibold">cannot be undone</span>.
            </p>
          </div>
        </div>

        <Button variant="destructive" size="sm" className="w-full active:scale-[0.98]" onClick={() => setPinOpen(true)}>
          <Trash2 className="w-4 h-4" /> Factory Reset
        </Button>
      </div>

      <PinGuardModal
        open={pinOpen}
        onOpenChange={setPinOpen}
        onSuccess={() => setDialogOpen(true)}
        user={user}
        actionLabel="Factory Reset"
      />

      <AlertDialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setConfirm(''); setProgress(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">⚠ Factory Data Reset</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete <span className="font-semibold text-destructive">ALL</span> business data across {ENTITIES.length} entities — trips, invoices, payments, clients, drivers, vehicles, vendors, expenses, salaries, contracts, bank/cash transactions, fuel records, documents, and company settings. Users and authentication are preserved. This is irreversible.
              <br /><br />
              Type <span className="font-mono font-semibold text-destructive">RESET ALL DATA</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Type RESET ALL DATA"
            className="bg-white/[0.03] border-white/10"
            autoFocus
          />
          {resetting && progress && (
            <p className="text-xs text-amber-400 font-medium animate-pulse">Clearing entities… {progress}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setConfirm(''); setDialogOpen(false); }} disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={!ready || resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? 'Resetting…' : 'Yes, erase everything'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsCard>
  );
}