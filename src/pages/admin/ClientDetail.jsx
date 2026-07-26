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
import { Inbox, FileText, Repeat, Plus, Pencil, Trash2, Download, X, Filter, ChevronDown, Receipt, Building2 } from 'lucide-react';
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
import ClientProfileCard from '@/components/admin/ClientProfileCard';

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
  const [invDateFrom, setInvDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [invDateTo, setInvDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [payDateFrom, setPayDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [payDateTo, setPayDateTo] = useState(new Date().toISOString().split('T')[0]);
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
  const displayTrips = contactFilter ? trips.filter(tr => tr.contact_person === contactFilter) : trips;
  const displayInvoices = contactFilter ? invoices.filter(inv => inv.contact_person === contactFilter) : invoices;
  const filteredInvoices = displayInvoices.filter(inv => !inv.issue_date || (inv.issue_date >= invDateFrom && inv.issue_date <= invDateTo));
  const outstandingInvoices = displayInvoices
    .filter(inv => !['paid', 'cancelled'].includes(inv.status) && (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0) > 0.001)
    .sort((a, b) => (a.issue_date || '').localeCompare(b.issue_date || ''));
  const filteredPayments = payments.filter(p => !p.payment_date || (p.payment_date >= payDateFrom && p.payment_date <= payDateTo));
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

      <ClientProfileCard client={client} stats={{ trips: displayTrips.length, invoices: displayInvoices.length, outstanding: outstandingInvoices.length, paid: filteredPayments.length }} />
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
        <TabsList>
          <TabsTrigger value="trips">{t('trips')} ({displayTrips.length})</TabsTrigger>
          <TabsTrigger value="invoices">{t('invoices')} ({displayInvoices.length})</TabsTrigger>
          <TabsTrigger value="payments">{t('payments')} ({payments.length})</TabsTrigger>
          <TabsTrigger value="charges">{t('fixed_charges')} ({fixedCharges.length})</TabsTrigger>
          <TabsTrigger value="documents">{t('documents')}</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : displayTrips.length === 0 ? <EmptyState icon={Inbox} title={t('no_data')} /> : (
            <div className="space-y-2">
              {displayTrips.map(trip => {
                const inv = getTripInvoice(trip.id);
                const isSent = inv?.status === 'sent';
                return (
                  <div key={trip.id} className="row-card flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{trip.from_location} → {trip.to_location}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(trip.trip_date)} · {trip.vehicle_plate} · {trip.driver_name}{trip.contact_person ? ` · ${trip.contact_person}` : ''}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(trip.revenue)}</span>
                    <StatusBadge status={trip.status} />
                    {trip.status === 'completed' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors whitespace-nowrap ${isSent ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                            {isSent ? 'Sent' : 'Not Sent'}
                            <ChevronDown className="w-2.5 h-2.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => !isSent && toggleTripInvoiceSent(trip, true)} className="text-xs cursor-pointer">
                            Mark Sent
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => isSent && toggleTripInvoiceSent(trip, false)} className="text-xs cursor-pointer">
                            Revert to Not Sent
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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

        <TabsContent value="payments" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div className="flex-1 max-w-md">
                  <DateRangeFilter
                    fromValue={payDateFrom}
                    onFromChange={setPayDateFrom}
                    toValue={payDateTo}
                    onToChange={setPayDateTo}
                    onToday={() => { setPayDateFrom(new Date().toISOString().split('T')[0]); setPayDateTo(new Date().toISOString().split('T')[0]); }}
                  />
                </div>
                <Button onClick={() => { setEditPayment(null); setPaymentFormOpen(true); }} size="sm" className="bg-primary hover:bg-primary/90 h-8">
                  <Plus className="w-3.5 h-3.5 mr-1" /> {t('payments')}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Outstanding</span>
                  <ExportButtons data={outstandingExportData} filename={`${client.name}-outstanding`} columns={outstandingExportCols} title={`${client.name} — Outstanding Payments`} options={{ dateRange: `${payDateFrom} to ${payDateTo}` }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Paid</span>
                  <ExportButtons data={paidExportData} filename={`${client.name}-payments`} columns={paidExportCols} title={`${client.name} — Paid Payments`} options={{ dateRange: `${payDateFrom} to ${payDateTo}` }} />
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