import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, Plus, Pencil, Trash2, FileText } from 'lucide-react';
import RecordSectionCard from '@/components/common/RecordSectionCard';
import EntityFormDialog from '@/components/common/EntityFormDialog';
import VehicleLicenseForm from './VehicleLicenseForm';
import { formatDate } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function VehicleLicensesSection({ vehicle, defaultOpen = false }) {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    if (!vehicle?.plate_number) return;
    setLoading(true);
    try {
      const recs = await base44.entities.VehicleLicense.filter({ trafficPlateNo: vehicle.plate_number });
      setLicenses(recs || []);
    } catch { setLicenses([]); }
    finally { setLoading(false); }
  }, [vehicle?.plate_number]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (data) => {
    const payload = { ...data, trafficPlateNo: vehicle.plate_number };
    if (editItem) {
      await base44.entities.VehicleLicense.update(editItem.id, payload);
      toast({ title: 'License updated' });
    } else {
      await base44.entities.VehicleLicense.create(payload);
      toast({ title: 'License added' });
    }
    setFormOpen(false);
    setEditItem(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await base44.entities.VehicleLicense.delete(deleteItem.id);
      toast({ title: 'License deleted' });
      setDeleteItem(null);
      load();
    } catch { toast({ title: 'Delete failed', variant: 'destructive' }); }
  };

  return (
    <>
      <RecordSectionCard
        title="Vehicle Licenses"
        icon={ShieldCheck}
        accent="#0ea5e9"
        count={licenses.length}
        loading={loading}
        collapsible
        defaultOpen={defaultOpen}
        emptyIcon={ShieldCheck}
        emptyLabel="No licenses recorded"
        onNew={() => { setEditItem(null); setFormOpen(true); }}
        newLabel="Add License"
        columns={[]}
      >
        <div className="space-y-2">
          {licenses.map((lic) => (
            <div key={lic.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: hexToRgba('#0ea5e9', 0.06), border: `1px solid ${hexToRgba('#0ea5e9', 0.16)}` }}>
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-sky-400" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {lic.category || 'License'}{lic.ownerEnglish ? ` · ${lic.ownerEnglish}` : ''}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {lic.trafficPlateNo || '—'}{lic.expDate ? ` · Exp ${formatDate(lic.expDate)}` : ''}{lic.insurer ? ` · ${lic.insurer}` : ''}
                </p>
              </div>
              <button onClick={() => { setEditItem(lic); setFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => setDeleteItem(lic)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </RecordSectionCard>

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen} icon={ShieldCheck} title={`${editItem ? 'Edit' : 'Add'} Vehicle License`} subtitle="Scan or enter manually">
        <VehicleLicenseForm editItem={editItem} onSave={handleSave} onCancel={() => { setFormOpen(false); setEditItem(null); }} />
      </EntityFormDialog>

      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete license?</AlertDialogTitle><AlertDialogDescription>This record will be permanently removed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}