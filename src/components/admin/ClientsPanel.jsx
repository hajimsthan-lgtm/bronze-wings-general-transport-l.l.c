import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ClientsAnalytics from '@/components/admin/ClientsAnalytics';
import ClientForm from '@/components/admin/ClientForm';

export default function ClientsPanel() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Client.list('-created_date', 200).catch(() => []),
      base44.entities.Trip.list('-trip_date', 500).catch(() => []),
      base44.entities.Invoice.list('-created_date', 300).catch(() => []),
    ]).then(([c, tr, i]) => { setItems(c || []); setTrips(tr || []); setInvoices(i || []); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      <ClientsAnalytics clients={items} trips={trips} invoices={invoices} loading={loading} onAdd={() => { setEditItem(null); setFormOpen(true); }} />

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Client</SheetTitle></SheetHeader>
          <ClientForm editItem={editItem} onSave={async (data, existingId) => { if (existingId) await base44.entities.Client.update(existingId, data); else if (editItem) await base44.entities.Client.update(editItem.id, data); else await base44.entities.Client.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}