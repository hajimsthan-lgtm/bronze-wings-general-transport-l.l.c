import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityDetailHeader from '@/components/admin/EntityDetailHeader';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Inbox, FileText, Repeat, Plus, Pencil, Trash2, Download, X, Filter, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import FixedChargeFormSheet from '@/components/admin/FixedChargeFormSheet';
import ExportButtons from '@/components/common/ExportButtons';
import { downloadInvoicePDF } from '@/lib/invoiceHtml';
import { getCompanySettings } from '@/lib/companySettings';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ContactPersonEditSheet from '@/components/admin/ContactPersonEditSheet';

export default function ClientDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [fixedCharges, setFixedCharges] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [chargeFormOpen, setChargeFormOpen] = useState(false);
  const [editCharge, setEditCharge] = useState(null);
  const [invDateFrom, setInvDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [invDateTo, setInvDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [contactFilter, setContactFilter] = useState(null);
  const [editContactIndex, setEditContactIndex] = useState(null);
  const [editContactOpen, setEditContactOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities.Client.get(id).then(async (c) => {
      if (cancelled) return;
      setClient(c);
      setLoading(false);
      setDataLoading(true);
      try {
        const [tR, iR, fR] = await Promise.all([
          base44.entities.Trip.filter({ client_name: c.name }).catch(() => []),
          base44.entities.Invoice.filter({ client_name: c.name }).catch(() => []),
          base44.entities.FixedCharge.filter({ client_name: c.name }).catch(() => []),
        ]);
        if (cancelled) return;
        setTrips(tR || []);
        setInvoices(iR || []);
        setFixedCharges(fR || []);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!client) return <EmptyState title="Client not found" />;

  const reloadCharges = () => base44.entities.FixedCharge.filter({ client_name: client.name }).then(setFixedCharges).catch(() => {});
  const deleteCharge = async (charge) => { await base44.entities.FixedCharge.delete(charge.id); reloadCharges(); };
  const displayTrips = contactFilter ? trips.filter(tr => tr.contact_person === contactFilter) : trips;
  const displayInvoices = contactFilter ? invoices.filter(inv => inv.contact_person === contactFilter) : invoices;
  const filteredInvoices = displayInvoices.filter(inv => !inv.issue_date || (inv.issue_date >= invDateFrom && inv.issue_date <= invDateTo));
  const editingContact = editContactIndex != null ? client.contact_persons?.[editContactIndex] : null;

  const openEditContact = (index) => { setEditContactIndex(index); setEditContactOpen(true); };
  const saveContact = async (updatedContact) => {
    const newPersons = [...(client.contact_persons || [])];
    if (editContactIndex != null) newPersons[editContactIndex] = updatedContact;
    else newPersons.push(updatedContact);
    await base44.entities.Client.update(client.id, { contact_persons: newPersons });
    setClient(prev => ({ ...prev, contact_persons: newPersons }));
    setEditContactOpen(false);
  };
  const deleteContact = async () => {
    if (editContactIndex == null) return;
    const deletedName = client.contact_persons?.[editContactIndex]?.name;
    const newPersons = (client.contact_persons || []).filter((_, i) => i !== editContactIndex);
    await base44.entities.Client.update(client.id, { contact_persons: newPersons });
    setClient(prev => ({ ...prev, contact_persons: newPersons }));
    setEditContactOpen(false);
    if (contactFilter === deletedName) setContactFilter(null);
  };
  const tripInvoiced = (tripId) => invoices.some(inv => inv.trip_id === tripId);

  const generateInvoiceForTrip = async (trip) => {
    const allInvs = await base44.entities.Invoice.list('-created_date', 500).catch(() => []);
    const year = new Date().getFullYear();
    const yearPrefix = `BW-${year}-`;
    let maxSeq = 0;
    (allInvs || []).forEach(inv => {
      if (inv.invoice_number?.startsWith(yearPrefix)) {
        const seq = parseInt(inv.invoice_number.slice(yearPrefix.length), 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    });
    const invoiceNumber = `${yearPrefix}${String(maxSeq + 1).padStart(4, '0')}`;
    const settings = await getCompanySettings();
    const vatRate = settings.default_vat_rate || 5;
    const revenue = Number(trip.revenue) || 0;
    const vatAmount = Math.round(revenue * vatRate) / 100;
    await base44.entities.Invoice.create({
      invoice_number: invoiceNumber,
      client_name: trip.client_name,
      contact_person: trip.contact_person || '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      line_items: [{ description: `${trip.from_location} → ${trip.to_location} (${trip.trip_number || ''})`, quantity: 1, unit_price: revenue, amount: revenue }],
      subtotal: revenue,
      vat_rate: vatRate,
      vat_amount: vatAmount,
      total_amount: revenue + vatAmount,
      status: 'draft',
      trip_id: trip.id,
    });
    const refreshed = await base44.entities.Invoice.filter({ client_name: client.name }).catch(() => []);
    setInvoices(refreshed || []);
  };

  const unlinkTripInvoice = async (trip) => {
    const linked = invoices.find(inv => inv.trip_id === trip.id);
    if (linked) {
      await base44.entities.Invoice.delete(linked.id);
      const refreshed = await base44.entities.Invoice.filter({ client_name: client.name }).catch(() => []);
      setInvoices(refreshed || []);
    }
  };

  const invExportCols = [
    { label: 'Invoice #', key: 'invoice_number' }, { label: 'Issue Date', key: 'issue_date' },
    { label: 'Due Date', key: 'due_date' }, { label: 'Status', key: 'status' },
    { label: 'Subtotal', key: 'subtotal' }, { label: 'VAT', key: 'vat_amount' },
    { label: 'Total', key: 'total_amount' },
  ];

  return (
    <div>
      <EntityDetailHeader
        title={client.name}
        subtitle={client.contact_person}
        badge={<StatusBadge status={client.status} />}
        backTo="/admin/clients"
        info={[
          { label: 'Email', value: client.email },
          { label: 'Phone', value: client.phone },
          { label: 'TRN', value: client.trn },
          { label: 'Payment Terms', value: client.payment_terms },
          { label: 'Address', value: client.address },
        ]}
      />
      {client.contact_persons?.length > 0 && (
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Contact Persons</p>
            {contactFilter && (
              <button onClick={() => setContactFilter(null)} className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {client.contact_persons.map((cp, i) => {
              const isActive = contactFilter === cp.name;
              return (
                <div key={i} onClick={() => openEditContact(i)} className={`rounded-lg p-2.5 cursor-pointer transition-all ${isActive ? 'bg-primary/10 border border-primary/30' : 'bg-background/30 border border-transparent hover:border-border/50'}`}>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <p className="text-xs font-medium text-foreground truncate">{cp.name}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setContactFilter(isActive ? null : cp.name); }}
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium transition-colors flex items-center gap-0.5 whitespace-nowrap ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:text-foreground'}`}
                    >
                      <Filter className="w-2.5 h-2.5" /> {isActive ? 'On' : 'Filter'}
                    </button>
                  </div>
                  {cp.department && <p className="text-[10px] text-primary">{cp.department}</p>}
                  {cp.email && <p className="text-[10px] text-muted-foreground truncate">{cp.email}</p>}
                  {cp.phone && <p className="text-[10px] text-muted-foreground">{cp.phone}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Tabs defaultValue="trips">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="trips">{t('trips')} ({displayTrips.length})</TabsTrigger>
          <TabsTrigger value="invoices">{t('invoices')} ({displayInvoices.length})</TabsTrigger>
          <TabsTrigger value="charges">{t('fixed_charges')} ({fixedCharges.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : displayTrips.length === 0 ? <EmptyState icon={Inbox} title={t('no_data')} /> : (
            <div className="space-y-2">
              {displayTrips.map(trip => {
                const invoiced = tripInvoiced(trip.id);
                return (
                  <div key={trip.id} className="glass-card p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{trip.from_location} → {trip.to_location}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(trip.trip_date)} · {trip.vehicle_plate} · {trip.driver_name}{trip.contact_person ? ` · ${trip.contact_person}` : ''}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(trip.revenue)}</span>
                    <StatusBadge status={trip.status} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors whitespace-nowrap ${invoiced ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                          {invoiced ? 'Sent' : 'Not Sent'}
                          <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => !invoiced && generateInvoiceForTrip(trip)} className="text-xs cursor-pointer">
                          Sent
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => invoiced && unlinkTripInvoice(trip)} className="text-xs cursor-pointer">
                          Not Sent
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <DateRangeFilter
                  fromValue={invDateFrom}
                  onFromChange={setInvDateFrom}
                  toValue={invDateTo}
                  onToChange={setInvDateTo}
                  onToday={() => { const today = new Date().toISOString().split('T')[0]; setInvDateFrom(today); setInvDateTo(today); }}
                />
                <div className="flex-1" />
                <ExportButtons data={filteredInvoices} filename={`invoices-${client.name}`} title={`Invoices - ${client.name}`} columns={invExportCols} />
              </div>
              {filteredInvoices.length === 0 ? <EmptyState icon={FileText} title={t('no_data')} /> : (
                <div className="space-y-2">
                  {filteredInvoices.map(rec => (
                    <div key={rec.id} className="glass-card p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{rec.invoice_number || '—'}</p>
                        <p className="text-xs text-muted-foreground">Issued: {formatDate(rec.issue_date)} · Due: {formatDate(rec.due_date)}</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(rec.total_amount)}</span>
                      <StatusBadge status={rec.status} />
                      <button onClick={async () => { const s = await getCompanySettings(); downloadInvoicePDF(rec, client.name, s); }} className="text-muted-foreground hover:text-primary p-1.5">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="charges" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : (
            <>
              <div className="flex justify-end mb-3">
                <Button onClick={() => { setEditCharge(null); setChargeFormOpen(true); }} size="sm" className="bg-primary hover:bg-primary/90 h-8">
                  <Plus className="w-3.5 h-3.5 mr-1" /> {t('add_fixed_charge')}
                </Button>
              </div>
              {fixedCharges.length === 0 ? <EmptyState icon={Repeat} title={t('no_data')} /> : (
                <div className="space-y-2">
                  {fixedCharges.map(rec => (
                    <div key={rec.id} className="glass-card p-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0"><Repeat className="w-4 h-4 text-violet-400" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{rec.description}</p>
                        <p className="text-xs text-muted-foreground capitalize">{rec.frequency} · {formatCurrency(rec.amount)}</p>
                      </div>
                      <StatusBadge status={rec.status} />
                      <button onClick={() => { setEditCharge(rec); setChargeFormOpen(true); }} className="text-muted-foreground hover:text-primary p-1">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCharge(rec)} className="text-muted-foreground hover:text-red-400 p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <FixedChargeFormSheet open={chargeFormOpen} onOpenChange={setChargeFormOpen} editItem={editCharge} clientName={client.name} onSaved={reloadCharges} />
      <ContactPersonEditSheet open={editContactOpen} onOpenChange={(open) => { setEditContactOpen(open); if (!open) setEditContactIndex(null); }} contact={editingContact} onSave={saveContact} onDelete={deleteContact} />
    </div>
  );
}