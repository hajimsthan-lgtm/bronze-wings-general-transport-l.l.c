import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityDetailHeader from '@/components/admin/EntityDetailHeader';
import EntityDocumentsTab from '@/components/admin/EntityDocumentsTab';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DetailSkeleton from '@/components/detail/DetailMotion';
import EmptyState from '@/components/common/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Inbox, FileText, Repeat, Plus, Pencil, Trash2, Download, ChevronDown, Receipt, Building2, Calendar as CalendarIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import FixedChargeFormSheet from '@/components/admin/FixedChargeFormSheet';
import InvoiceFormSheet from '@/components/invoices/InvoiceFormSheet';
import PaymentFormSheet from '@/components/payments/PaymentFormSheet';
import ExportButtons from '@/components/common/ExportButtons';
import { downloadInvoicePDF } from '@/lib/invoiceHtml';
import { getCompanySettings } from '@/lib/companySettings';
import { setTripInvoiceSent } from '@/lib/tripInvoice';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ContactPersonEditSheet from '@/components/admin/ContactPersonEditSheet';
import ContactPersonSmartSelector from '@/components/admin/ContactPersonSmartSelector';
import ClientProfileCard from '@/components/admin/ClientProfileCard';
import ClientTripsList from '@/components/clients/ClientTripsList';
import InvoiceGeneratorTab from '@/components/invoices/InvoiceGeneratorTab';

export default function ClientDetail({ id: propId, inline = false }) {
  const params = useParams();
  const id = propId || params.id;
  const { t } = useI18n();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [fixedCharges, setFixedCharges] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [chargeFormOpen, setChargeFormOpen] = useState(false);
  const [editCharge, setEditCharge] = useState(null);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [contactFilter, setContactFilter] = useState(null);
  const [editContactIndex, setEditContactIndex] = useState(null);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [editPayment, setEditPayment] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities.Client.get(id).then(async (c) => {
      if (cancelled) return;
      setClient(c);
      setLoading(false);
      setDataLoading(true);
      try {
        const [tR, iR, fR, pR] = await Promise.all([
          base44.entities.Trip.filter({ client_name: c.name }).catch(() => []),
          base44.entities.Invoice.filter({ client_name: c.name }).catch(() => []),
          base44.entities.FixedCharge.filter({ client_name: c.name }).catch(() => []),
          base44.entities.ClientPayment.filter({ client_name: c.name }).catch(() => []),
        ]);
        if (cancelled) return;
        setTrips(tR || []);
        setInvoices(iR || []);
        setFixedCharges(fR || []);
        setPayments(pR || []);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  // Auto-open the new-invoice form when arriving via ?new_invoice=1 (Dashboard quick action)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('new_invoice') === '1') { setEditInvoice(null); setInvoiceFormOpen(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <DetailSkeleton />;
  if (!client) return <EmptyState title="Client not found" />;

  const reloadCharges = () => base44.entities.FixedCharge.filter({ client_name: client.name }).then(setFixedCharges).catch(() => {});
  const reloadInvoices = () => base44.entities.Invoice.filter({ client_name: client.name }).then(setInvoices).catch(() => {});
  const reloadPayments = () => base44.entities.ClientPayment.filter({ client_name: client.name }).then(setPayments).catch(() => {});
  const deleteCharge = async (charge) => { await base44.entities.FixedCharge.delete(charge.id); reloadCharges(); };
  const inDateRange = (d) => !d || (d >= dateFrom && d <= dateTo);
  const displayTrips = (contactFilter ? trips.filter(tr => tr.contact_person === contactFilter) : trips).filter(tr => inDateRange(tr.trip_date));
  const displayInvoices = (contactFilter ? invoices.filter(inv => inv.contact_person === contactFilter) : invoices).filter(inv => inDateRange(inv.issue_date));
  const filteredInvoices = displayInvoices;
  const outstandingInvoices = displayInvoices
    .filter(inv => !['paid', 'cancelled'].includes(inv.status) && (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0) > 0.001)
    .sort((a, b) => (a.issue_date || '').localeCompare(b.issue_date || ''));
  const filteredPayments = payments.filter(p => inDateRange(p.payment_date));
  const outstandingExportData = outstandingInvoices.map(inv => ({
    invoice_number: inv.invoice_number || '',
    issue_date: inv.issue_date || '',
    total_amount: Number(inv.total_amount) || 0,
    paid_amount: Number(inv.paid_amount) || 0,
    balance: (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0),
  }));
  const paidExportData = filteredPayments.map(p => ({
    reference_number: p.reference_number || '',
    payment_date: p.payment_date || '',
    payment_mode: p.payment_mode || '',
    amount: Number(p.amount) || 0,
    status: p.status || '',
    allocated: (p.allocated_invoices || []).filter(a => a.allocated_amount > 0).map(a => `${a.invoice_number}: ${a.allocated_amount}`).join('; '),
  }));
  const clientInvoiceSeq = (() => {
    const sorted = [...invoices].sort((a, b) => (a.issue_date || '').localeCompare(b.issue_date || '') || String(a.created_date || '').localeCompare(String(b.created_date || '')));
    const map = {};
    sorted.forEach((inv, i) => { map[inv.id] = i + 1; });
    return map;
  })();
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
  const getTripInvoice = (tripId) => invoices.find(inv => inv.trip_id === tripId);

  const toggleTripInvoiceSent = async (trip, sent) => {
    await setTripInvoiceSent(trip, sent);
    const refreshed = await base44.entities.Invoice.filter({ client_name: client.name }).catch(() => []);
    setInvoices(refreshed || []);
  };
  const reloadTrips = () => base44.entities.Trip.filter({ client_name: client.name }).then(setTrips).catch(() => {});
  const bulkComplete = async (selTrips) => {
    const toUpdate = selTrips.filter((t) => t.status !== 'completed');
    if (toUpdate.length === 0) return;
    await Promise.all(toUpdate.map((t) => base44.entities.Trip.update(t.id, { status: 'completed' })));
    await reloadTrips();
  };
  const bulkInvoice = async (selTrips, sent) => {
    const eligible = selTrips.filter((t) => t.status === 'completed');
    if (eligible.length === 0) return;
    await Promise.all(eligible.map((t) => setTripInvoiceSent(t, sent)));
    const refreshed = await base44.entities.Invoice.filter({ client_name: client.name }).catch(() => []);
    setInvoices(refreshed || []);
  };

  const invExportCols = [
    { label: 'Invoice #', key: 'invoice_number' }, { label: 'Issue Date', key: 'issue_date' },
    { label: 'Due Date', key: 'due_date' }, { label: 'Status', key: 'status' },
    { label: 'Subtotal', key: 'subtotal' }, { label: 'VAT', key: 'vat_amount' },
    { label: 'Total', key: 'total_amount' },
  ];
  const outstandingExportCols = [
    { label: 'Invoice #', key: 'invoice_number' },
    { label: 'Issue Date', key: 'issue_date' },
    { label: 'Total', key: 'total_amount', numeric: true },
    { label: 'Paid', key: 'paid_amount', numeric: true },
    { label: 'Balance', key: 'balance', numeric: true },
  ];
  const paidExportCols = [
    { label: 'Reference', key: 'reference_number' },
    { label: 'Date', key: 'payment_date' },
    { label: 'Mode', key: 'payment_mode' },
    { label: 'Amount', key: 'amount', numeric: true },
    { label: 'Status', key: 'status' },
    { label: 'Allocated Invoices', key: 'allocated' },
  ];

  return (
    <div className="detail-page">
      {inline ? (
        <div className="detail-header-card p-4 mb-4 flex items-center gap-3 animate-fade-in-up">
          <div className="w-11 h-11 rounded-xl entity-avatar flex items-center justify-center flex-shrink-0"><Building2 className="w-5 h-5" /></div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">{client.name}</h2>
            <p className="text-xs text-muted-foreground truncate">{client.contact_person || client.email || ''}</p>
          </div>
          <StatusBadge status={client.status} />
        </div>
      ) : (
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
      )}

      <div data-tour data-tour-title="Client Profile" data-tour-en="Client Profile — A snapshot of this client: contact details, TRN, payment terms, and quick counts of trips, invoices, outstanding balances, and payments. Use it to assess the relationship at a glance before diving into any tab." data-tour-ur="کلائنٹ پروفائل — اس کلائنٹ کا خلاصہ: رابطہ تفصیلات، TRN، ادائیگی کی شرائط، اور ٹرپس، انوائسز، باقی بقایاجات، اور ادائیگیوں کے فوری حسابات۔ کسی بھی ٹیب میں جانے سے پہلے تعلق کا جائزہ لینے کے لیے استعمال کریں۔" data-tour-ml="ക്ലയന്റ് പ്രൊഫൈൽ — ഈ ക്ലയന്റിന്റെ ചുരുക്കം: കോൺടാക്റ്റ് വിവരങ്ങൾ, TRN, പേയ്മെന്റ് നിബന്ധനകൾ, യാത്രകൾ, ഇൻവോയ്സുകൾ, ബാക്കികൾ, പേയ്മെന്റുകൾ എന്നിവയുടെ എണ്ണം. ഒരു ടാബിലേക്ക് പ്രവേശിക്കുന്നതിന് മുമ്പ് ബന്ധം ഒറ്റനോട്ടത്തിൽ മനസ്സിലാക്കാൻ ഉപയോഗിക്കുക.">
        <ClientProfileCard client={client} stats={{ trips: displayTrips.length, invoices: displayInvoices.length, outstanding: outstandingInvoices.length, paid: filteredPayments.length }} />
      </div>
      <ContactPersonSmartSelector
        contactPersons={client.contact_persons || []}
        activeFilter={contactFilter}
        onFilter={setContactFilter}
        onAdd={() => { setEditContactIndex(null); setEditContactOpen(true); }}
        onEdit={openEditContact}
      />
      <div className="glass-card p-3 mb-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-primary" />
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Page date filter</span>
        </div>
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground hidden sm:inline">Filters trips · invoices · payments</span>
      </div>
      <Tabs defaultValue="trips">
        <TabsList>
          <TabsTrigger value="trips">{t('trips')} ({displayTrips.length})</TabsTrigger>
          <TabsTrigger value="invoices">{t('invoices')} ({displayInvoices.length})</TabsTrigger>
          <TabsTrigger value="generator">Invoice Generator</TabsTrigger>
          <TabsTrigger value="payments">{t('payments')} ({payments.length})</TabsTrigger>
          <TabsTrigger value="charges">{t('fixed_charges')} ({fixedCharges.length})</TabsTrigger>
          <TabsTrigger value="documents">{t('documents')}</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : (
            <ClientTripsList
              trips={displayTrips}
              getTripInvoice={getTripInvoice}
              onToggleInvoiceSent={toggleTripInvoiceSent}
              onBulkComplete={bulkComplete}
              onBulkInvoice={bulkInvoice}
            />
          )}
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : (
            <>
              <div className="flex items-center justify-end gap-3 mb-3">
                <Button onClick={() => { setEditInvoice(null); setInvoiceFormOpen(true); }} size="sm" className="bg-primary hover:bg-primary/90 h-8">
                  <Plus className="w-3.5 h-3.5 mr-1" /> {t('new_invoice')}
                </Button>
                <ExportButtons data={filteredInvoices} filename={`invoices-${client.name}`} title={`Invoices - ${client.name}`} columns={invExportCols} />
              </div>
              {filteredInvoices.length === 0 ? <EmptyState icon={FileText} title={t('no_data')} /> : (
                <div className="space-y-2">
                  {filteredInvoices.map(rec => (
                    <div key={rec.id} onClick={() => { setEditInvoice(rec); setInvoiceFormOpen(true); }} className="row-card flex items-center gap-3 cursor-pointer hover:border-primary/30 transition-colors">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-primary" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{rec.invoice_number || '—'}</p>
                        <p className="text-xs text-muted-foreground">Issued: {formatDate(rec.issue_date)} · Due: {formatDate(rec.due_date)}</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(rec.total_amount)}</span>
                      <StatusBadge status={rec.status} />
                      <button onClick={async (e) => { e.stopPropagation(); const s = await getCompanySettings(); downloadInvoicePDF(rec, client.name, s, clientInvoiceSeq[rec.id]); }} className="text-muted-foreground hover:text-primary p-1.5">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="generator" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : (
            <InvoiceGeneratorTab client={client} trips={trips} invoices={invoices} onInvoicesChanged={reloadInvoices} />
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : (
            <>
              <div className="flex items-center justify-end gap-3 mb-3">
                <Button onClick={() => { setEditPayment(null); setPaymentFormOpen(true); }} size="sm" className="bg-primary hover:bg-primary/90 h-8">
                  <Plus className="w-3.5 h-3.5 mr-1" /> {t('payments')}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Outstanding</span>
                  <ExportButtons data={outstandingExportData} filename={`${client.name}-outstanding`} columns={outstandingExportCols} title={`${client.name} — Outstanding Payments`} options={{ dateRange: `${dateFrom} to ${dateTo}` }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Paid</span>
                  <ExportButtons data={paidExportData} filename={`${client.name}-payments`} columns={paidExportCols} title={`${client.name} — Paid Payments`} options={{ dateRange: `${dateFrom} to ${dateTo}` }} />
                </div>
              </div>

              {outstandingInvoices.length > 0 && (
                <div className="row-card mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">Outstanding Invoices</p>
                    <span className="text-[10px] text-muted-foreground">{outstandingInvoices.length} unpaid</span>
                  </div>
                  <div className="space-y-1.5">
                    {outstandingInvoices.map(inv => {
                      const balance = (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0);
                      const isPartial = (Number(inv.paid_amount) || 0) > 0;
                      return (
                        <div key={inv.id} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-foreground flex-1 min-w-0 truncate">{inv.invoice_number}</span>
                          {isPartial && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 whitespace-nowrap">Partial</span>}
                          <span className="text-[10px] text-muted-foreground">{formatDate(inv.issue_date)}</span>
                          <span className="text-xs font-semibold text-foreground tabular-nums">{formatCurrency(balance)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredPayments.length === 0 ? <EmptyState icon={Receipt} title={t('no_data')} /> : (
                <div className="space-y-2">
                  {filteredPayments.map(p => {
                    const allocs = (p.allocated_invoices || []).filter(a => a.allocated_amount > 0);
                    const isPartial = allocs.some(a => (Number(a.allocated_amount) || 0) < (Number(a.invoice_total) || 0) - 0.01);
                    return (
                      <div key={p.id} onClick={() => { setEditPayment(p); setPaymentFormOpen(true); }} className="row-card cursor-pointer hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Receipt className="w-4 h-4 text-primary" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{p.reference_number || '—'}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(p.payment_date)} · {p.payment_mode}{p.notes ? ` · ${p.notes}` : ''}</p>
                          </div>
                          {isPartial && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 whitespace-nowrap">Partial</span>}
                          <span className="text-sm font-semibold text-foreground">{formatCurrency(p.amount)}</span>
                          <StatusBadge status={p.status} />
                        </div>
                        {allocs.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border flex flex-wrap gap-1.5">
                            {allocs.map(a => (
                              <span key={a.invoice_id} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 whitespace-nowrap">
                                {a.invoice_number}: {formatCurrency(a.allocated_amount)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                    <div key={rec.id} className="row-card flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Repeat className="w-4 h-4 text-primary" /></div>
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

        <TabsContent value="documents" className="mt-4">
          <EntityDocumentsTab entityType="client" entityId={client.id} />
        </TabsContent>
      </Tabs>

      <FixedChargeFormSheet open={chargeFormOpen} onOpenChange={setChargeFormOpen} editItem={editCharge} clientName={client.name} onSaved={reloadCharges} />
      <InvoiceFormSheet open={invoiceFormOpen} onOpenChange={setInvoiceFormOpen} editInvoice={editInvoice} defaultClientName={client.name} onSaved={reloadInvoices} />
      <PaymentFormSheet open={paymentFormOpen} onOpenChange={setPaymentFormOpen} editItem={editPayment} lockedClientName={client.name} onSaved={() => { reloadPayments(); reloadInvoices(); }} />
      <ContactPersonEditSheet open={editContactOpen} onOpenChange={(open) => { setEditContactOpen(open); if (!open) setEditContactIndex(null); }} contact={editingContact} onSave={saveContact} onDelete={deleteContact} />
    </div>
  );
}