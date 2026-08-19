import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/formatters';
import { Plus, Trash2, Check, Loader2, CreditCard, User, FileText, Sparkles, FileDown, ChevronDown, X } from 'lucide-react';
import { useInvoiceCreate, useInvoiceUpdate, useClientPaymentCreate } from '@/hooks/useEntityQueries';
import { generateInvoiceNumber, getCompanySettings } from '@/lib/companySettings';
import { downloadInvoicePDF, downloadPerTripInvoicePDF, downloadMonthlyInvoicePDF } from '@/lib/invoiceHtml';
import { useToast } from '@/components/ui/use-toast';
import InvoicePreview from '@/components/invoices/InvoicePreview';
import { cn } from '@/lib/utils';

const emptyItem = { description: '', quantity: 1, unit_price: 0, amount: 0, vat_excluded: false };

const STATUS_STYLES = {
  paid: 'bg-emerald-500/20 text-emerald-400',
  partially_paid: 'bg-orange-500/20 text-orange-400',
  draft: 'bg-amber-500/20 text-amber-400',
  sent: 'bg-blue-500/20 text-blue-400',
  overdue: 'bg-red-500/20 text-red-400',
  cancelled: 'bg-white/10 text-white/50',
};

function StatusPill({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${cls}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function InvoiceFormSheet({ open, onOpenChange, editInvoice, onSaved, defaultClientName, customTemplateId = null }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const createInvoice = useInvoiceCreate();
  const updateInvoice = useInvoiceUpdate();
  const createPayment = useClientPaymentCreate();
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [settings, setSettings] = useState({});
  const [clients, setClients] = useState([]);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [monthlyContracts, setMonthlyContracts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tripsOpen, setTripsOpen] = useState(false);
  const [contractsOpen, setContractsOpen] = useState(false);
  const [invoiceMode, setInvoiceMode] = useState('trip'); // 'trip' | 'monthly'
  const [mobileView, setMobileView] = useState('form'); // 'form' | 'preview' — mobile only
  const [receivePayment, setReceivePayment] = useState(false);
  const [payment, setPayment] = useState({ amount: '', mode: 'cash', date: new Date().toISOString().split('T')[0], reference: '', notes: '' });
  const [form, setForm] = useState({
    client_name: '', client_email: '', client_phone: '', client_address: '', client_trn: '', contact_person: '',
    invoice_number: '', issue_date: new Date().toISOString().split('T')[0],
    due_date: '', status: 'draft', vat_rate: 5, notes: '', payment_terms: 'Net 30',
    trip_id: '', lpo_ref: '', line_items: [],
    });
    const isEdit = !!editInvoice;

  useEffect(() => { getCompanySettings().then(setSettings).catch(() => {}); }, []);

  useEffect(() => {
    if (editInvoice) {
      setForm({
        ...form, ...editInvoice,
        line_items: editInvoice.line_items?.length ? editInvoice.line_items : [{ ...emptyItem }],
        vat_rate: editInvoice.vat_rate ?? 5,
      });
      setReceivePayment(false);
      setPayment({ amount: '', mode: 'cash', date: new Date().toISOString().split('T')[0], reference: '', notes: '' });
    } else {
      setForm({
        client_name: defaultClientName || '', client_email: '', client_phone: '', client_address: '', client_trn: '', contact_person: '',
        invoice_number: '', issue_date: new Date().toISOString().split('T')[0],
        due_date: '', status: 'draft', vat_rate: 5, notes: '', payment_terms: 'Net 30',
        trip_id: '', lpo_ref: '', line_items: [],
      });
      setReceivePayment(false);
      Promise.all([generateInvoiceNumber(), getCompanySettings()]).then(([num, s]) => {
        setForm(prev => ({ ...prev, invoice_number: num, vat_rate: s.default_vat_rate ?? 5 }));
      });
    }
  }, [editInvoice, open, defaultClientName]);

  useEffect(() => {
    if (open) {
      base44.entities.Client.list('-created_date', 200).catch(() => []).then((cl) => {
        setClients(cl || []);
        if (defaultClientName && !editInvoice) {
          const c = (cl || []).find((x) => x.name === defaultClientName);
          if (c) {
            setForm((prev) => ({
              ...prev,
              client_name: c.name,
              client_email: c.email || '',
              client_phone: c.phone || '',
              client_address: c.address || '',
              client_trn: c.trn || '',
              contact_person: c.contact_person || '',
            }));
          }
        }
      });
      base44.entities.Trip.list('-created_date', 200).catch(() => []).then(setTrips);
      base44.entities.Invoice.list('-created_date', 500).catch(() => []).then(setInvoices);
      base44.entities.MonthlyContract.list('-created_date', 200).catch(() => []).then(setMonthlyContracts);
      base44.entities.Vehicle.list('-created_date', 500).catch(() => []).then(setVehicles);
    }
  }, [open, defaultClientName, editInvoice]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updatePayment = (field, value) => setPayment(prev => ({ ...prev, [field]: value }));

  const handleClientChange = (value) => {
    const client = clients.find(c => c.name === value);
    setForm(prev => {
      const base = { ...prev, client_name: value, line_items: prev.line_items.filter(i => !i._trip_number) };
      if (client) {
        base.client_email = client.email || '';
        base.client_phone = client.phone || '';
        base.client_address = client.address || '';
        base.client_trn = client.trn || '';
        base.contact_person = client.contact_person || '';
      }
      return base;
    });
    setTripsOpen(false);
    setContractsOpen(false);
  };

  const invoicedTripNumbers = useMemo(() => {
    const set = new Set();
    (invoices || []).forEach(inv => {
      if (inv.trip_id) String(inv.trip_id).split(',').forEach(t => { const v = t.trim(); if (v) set.add(v); });
    });
    return set;
  }, [invoices]);

  const selectedClient = clients.find(c => c.name === form.client_name);
  const availableContacts = useMemo(() => {
    if (!selectedClient) return [];
    const contacts = [];
    if (selectedClient.contact_persons?.length) {
      selectedClient.contact_persons.forEach(cp => {
        if (cp.name && !contacts.find(c => c.name === cp.name)) contacts.push(cp);
      });
    }
    if (selectedClient.contact_person && !contacts.find(c => c.name === selectedClient.contact_person)) {
      contacts.push({ name: selectedClient.contact_person });
    }
    return contacts;
  }, [selectedClient]);

  const clientCompletedTrips = (trips || []).filter(tr => {
    if (tr.client_name !== form.client_name || tr.status !== 'completed' || invoicedTripNumbers.has(tr.trip_number)) return false;
    if (form.contact_person && availableContacts.length > 1) return tr.contact_person === form.contact_person;
    return true;
  });
  const selectedTripNumbers = form.line_items.map(i => i._trip_number).filter(Boolean);

  const toggleTrip = (trip) => {
    setForm(prev => {
      const items = [...prev.line_items];
      const idx = items.findIndex(i => i._trip_number === trip.trip_number);
      if (idx >= 0) {
        items.splice(idx, 1);
      } else {
        const route = [trip.from_location, trip.to_location].filter(Boolean).join(' To ');
        items.push({
          _trip_number: trip.trip_number,
          description: route || trip.trip_number,
          date: trip.trip_date,
          quantity: 1,
          unit_price: Number(trip.revenue || trip.base_fare || 0),
          amount: Number(trip.revenue || trip.base_fare || 0),
          service: 'TRIP',
          uom: 'TRIP',
          vat_excluded: false,
        });
      }
      return { ...prev, line_items: items };
    });
  };

  // Monthly contracts not yet invoiced for the issue-date month
  const invoicedContractKeys = useMemo(() => {
    const set = new Set();
    const issue = form.issue_date ? new Date(form.issue_date) : null;
    if (!issue) return set;
    (invoices || []).forEach(inv => {
      if (!inv.client_name || !inv.issue_date) return;
      const d = new Date(inv.issue_date);
      if (d.getFullYear() === issue.getFullYear() && d.getMonth() === issue.getMonth()) {
        set.add(inv.client_name);
      }
    });
    return set;
  }, [invoices, form.issue_date]);

  const availableContracts = (monthlyContracts || []).filter(c =>
    c.status === 'active' &&
    (!form.client_name || c.company_name === form.client_name) &&
    !invoicedContractKeys.has(c.company_name)
  );
  const selectedContractIds = form.line_items.map(i => i._contract_id).filter(Boolean);

  const toggleContract = (contract) => {
    const vType = vehicles.find(v => v.plate_number === contract.vehicle_plate)?.type;
    const vTypeLabel = vType && vType !== 'other' ? vType.charAt(0).toUpperCase() + vType.slice(1) : 'Vehicle';
    const driver = (contract.driver_name || '').trim();
    const plate = contract.vehicle_plate || contract.company_name;
    const desc = `${vTypeLabel} Rental${driver ? ` — ${driver}` : ''} — ${plate}`;
    setForm(prev => {
      const items = [...prev.line_items];
      const idx = items.findIndex(i => i._contract_id === contract.id);
      if (idx >= 0) {
        items.splice(idx, 1);
      } else {
        items.push({
          _contract_id: contract.id,
          description: desc,
          date: contract.start_date || prev.issue_date,
          quantity: 1,
          unit_price: Number(contract.monthly_rate || 0),
          amount: Number(contract.monthly_rate || 0),
          vat_excluded: false,
        });
      }
      return { ...prev, line_items: items };
    });
  };

  const updateItem = (index, field, value) => {
    const items = [...form.line_items];
    items[index] = { ...items[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      items[index].amount = Number(items[index].quantity) * Number(items[index].unit_price);
    }
    setForm(prev => ({ ...prev, line_items: items }));
  };

  const addItem = () => setForm(prev => ({ ...prev, line_items: [...prev.line_items, { ...emptyItem }] }));
  const removeItem = (i) => setForm(prev => ({ ...prev, line_items: prev.line_items.filter((_, idx) => idx !== i) }));
  // Only send non-empty items to the preview so the live view starts clean
  const previewItems = form.line_items.filter(i => i.description?.trim() || Number(i.unit_price) > 0 || Number(i.amount) > 0 || i._trip_number || i._contract_id);

  const subtotal = form.line_items.reduce((s, item) => s + (Number(item.amount) || 0), 0);
  const vatAmount = form.line_items.reduce((s, item) => s + (item.vat_excluded ? 0 : (Number(item.amount) || 0) * (Number(form.vat_rate) / 100)), 0);
  const total = subtotal + vatAmount;
  const payAmount = receivePayment ? Number(payment.amount) || 0 : 0;
  const balanceDue = Math.max(0, total - payAmount);
  const resultingStatus = payAmount <= 0 ? form.status : (payAmount >= total ? 'paid' : 'partially_paid');
  const inputCls = "bg-background/50 border-border backdrop-blur-sm";

  const handleSave = async () => {
    if (!form.client_name?.trim()) {
      toast({ variant: 'destructive', title: 'Client name is required' });
      return;
    }
    setSaving(true);
    try {
      const tripNumbers = form.line_items.map(i => i._trip_number).filter(Boolean);
      const data = {
        ...form,
        line_items: form.line_items.map(({ _trip_number, _contract_id, ...rest }) => rest),
        trip_id: tripNumbers.length > 0 ? tripNumbers.join(',') : form.trip_id,
        subtotal, vat_amount: vatAmount, total_amount: total,
        vat_rate: Number(form.vat_rate),
        status: resultingStatus,
        paid_amount: payAmount,
        ...(customTemplateId ? { custom_template_id: customTemplateId } : {}),
      };
      let invoiceId = editInvoice?.id;
      let invoiceNumber = form.invoice_number;
      if (editInvoice) {
        await updateInvoice.mutateAsync({ id: editInvoice.id, data });
      } else {
        const created = await createInvoice.mutateAsync(data);
        invoiceId = created?.id;
        invoiceNumber = created?.invoice_number || form.invoice_number;
      }

      if (receivePayment && payAmount > 0 && invoiceId) {
        const d = new Date();
        const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        let reference = payment.reference;
        if (!reference) {
          const existing = await base44.entities.ClientPayment.list('-created_date', 200).catch(() => []);
          const prefix = `PAY-${ymd}-`;
          let maxSeq = 0;
          (existing || []).forEach(p => {
            if (p.reference_number?.startsWith(prefix)) {
              const seq = parseInt(p.reference_number.slice(prefix.length), 10);
              if (seq > maxSeq) maxSeq = seq;
            }
          });
          reference = `${prefix}${String(maxSeq + 1).padStart(4, '0')}`;
        }
        await createPayment.mutateAsync({
          reference_number: reference,
          client_name: form.client_name,
          amount: payAmount,
          payment_date: payment.date,
          payment_mode: payment.mode,
          allocated_invoices: [{
            invoice_id: invoiceId,
            invoice_number: invoiceNumber,
            invoice_total: total,
            allocated_amount: payAmount,
            is_selected: true,
          }],
          unapplied_balance: 0,
          status: 'completed',
          notes: payment.notes,
        });
      }

      toast({ title: isEdit ? 'Invoice updated' : 'Invoice created' });
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally { setSaving(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const s = await getCompanySettings();
      const payload = { ...form, line_items: form.line_items.map(({ _trip_number, _contract_id, ...rest }) => rest), subtotal, vat_amount: vatAmount, total_amount: total, status: resultingStatus, paid_amount: payAmount };
      if (invoiceMode === 'monthly') {
        await downloadMonthlyInvoicePDF(payload, form.client_name, s, undefined, true);
      } else {
        await downloadPerTripInvoicePDF(payload, form.client_name, s, undefined, true);
      }
      toast({ title: 'Draft PDF downloaded' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'PDF error', description: e.message });
    } finally { setDownloading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="w-full max-w-6xl h-[90vh] overflow-hidden bg-background p-0 flex flex-col gap-0 rounded-xl">
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0 space-y-1 flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <DialogTitle>{isEdit ? 'Edit Invoice' : 'New Invoice'}</DialogTitle>
            <DialogDescription>Left: fill in details · Right: live PDF preview</DialogDescription>
          </div>
          <DialogClose
            aria-label="Close"
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/60 hover:bg-primary/15 border border-border/60 hover:border-primary/40 text-muted-foreground hover:text-primary transition-all flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </DialogClose>
        </DialogHeader>

        {/* Mobile tab toggle — switch between form and live preview on small screens */}
        <div className="sm:hidden flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/30 flex-shrink-0">
          <button type="button" onClick={() => setMobileView('form')} className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors', mobileView === 'form' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>Edit Form</button>
          <button type="button" onClick={() => setMobileView('preview')} className={cn('flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors', mobileView === 'preview' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>Live Preview</button>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* LEFT: Form */}
          <div className={cn('w-full sm:w-1/2 overflow-y-auto px-5 py-5 space-y-4 sm:border-r border-border', mobileView === 'form' ? 'flex flex-col' : 'hidden sm:flex flex-col')}>
            {/* Invoice Mode Toggle */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/40 border border-border">
              <button
                type="button"
                onClick={() => setInvoiceMode('trip')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all',
                  invoiceMode === 'trip'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                Per-Trip Invoice
              </button>
              <button
                type="button"
                onClick={() => setInvoiceMode('monthly')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all',
                  invoiceMode === 'monthly'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Monthly Contract
              </button>
            </div>

            {/* Client */}
            <Section title="Client" icon={User}>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">{t('client')}</Label>
                <Input list="invoice-clients" value={form.client_name} onChange={e => handleClientChange(e.target.value)} className={inputCls} placeholder="Select or type client name" />
                <datalist id="invoice-clients">{clients.map(c => <option key={c.id} value={c.name} />)}</datalist>
              </div>
              {form.client_name && invoiceMode === 'trip' && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Completed Trips — multi-select (auto-fills items)</Label>
                  <div className="relative">
                    <button type="button" onClick={() => setTripsOpen(v => !v)} className="flex items-center justify-between w-full h-10 px-3 rounded-lg border border-border bg-background/50 backdrop-blur-sm hover:border-primary/40 transition-colors">
                      <span className="text-sm font-medium truncate">{selectedTripNumbers.length} trip(s) selected — click to {tripsOpen ? 'close' : 'select'}</span>
                      <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', tripsOpen && 'rotate-180')} />
                    </button>
                    {tripsOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setTripsOpen(false)} />
                        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto thin-scroll glass-card p-1.5 shadow-2xl">
                          {clientCompletedTrips.length === 0 ? (
                            <p className="px-3 py-4 text-xs text-muted-foreground text-center">No uninvoiced completed trips for this client.</p>
                          ) : clientCompletedTrips.map(tr => {
                            const checked = selectedTripNumbers.includes(tr.trip_number);
                            const route = [tr.from_location, tr.to_location].filter(Boolean).join(' To ');
                            return (
                              <button key={tr.id} type="button" onClick={() => toggleTrip(tr)} className={cn('w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors', checked ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]')}>
                                <span className={cn('mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0', checked ? 'bg-primary border-primary' : 'border-border')}>
                                  {checked && <Check className="w-3 h-3 text-primary-foreground" />}
                                </span>
                                <span className="flex-1 min-w-0">
                                  <span className="block text-sm font-medium truncate">{tr.trip_number} · {route || 'Trip'}</span>
                                  <span className="block text-[11px] text-muted-foreground">{tr.trip_date ? new Date(tr.trip_date).toLocaleDateString() : '—'} · AED {Number(tr.revenue || tr.base_fare || 0).toFixed(2)}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {form.client_name && invoiceMode === 'monthly' && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Monthly Contracts — non-invoiced (auto-fills items)</Label>
                  <div className="relative">
                    <button type="button" onClick={() => setContractsOpen(v => !v)} className="flex items-center justify-between w-full h-10 px-3 rounded-lg border border-border bg-background/50 backdrop-blur-sm hover:border-primary/40 transition-colors">
                      <span className="text-sm font-medium truncate">{selectedContractIds.length} contract(s) selected — click to {contractsOpen ? 'close' : 'select'}</span>
                      <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', contractsOpen && 'rotate-180')} />
                    </button>
                    {contractsOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setContractsOpen(false)} />
                        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto thin-scroll glass-card p-1.5 shadow-2xl">
                          {availableContracts.length === 0 ? (
                            <p className="px-3 py-4 text-xs text-muted-foreground text-center">No uninvoiced active monthly contracts for this client.</p>
                          ) : availableContracts.map(c => {
                            const checked = selectedContractIds.includes(c.id);
                            return (
                              <button key={c.id} type="button" onClick={() => toggleContract(c)} className={cn('w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors', checked ? 'bg-primary/15 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]')}>
                                <span className={cn('mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0', checked ? 'bg-primary border-primary' : 'border-border')}>
                                  {checked && <Check className="w-3 h-3 text-primary-foreground" />}
                                </span>
                                <span className="flex-1 min-w-0">
                                  <span className="block text-sm font-medium truncate">{c.company_name}{c.vehicle_plate ? ` · ${c.vehicle_plate}` : ''}</span>
                                  <span className="block text-[11px] text-muted-foreground">{c.start_date ? new Date(c.start_date).toLocaleDateString() : '—'} → {c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'} · AED {Number(c.monthly_rate || 0).toFixed(2)}/mo</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Contact Person</Label>
                <Input list="invoice-contacts" value={form.contact_person} onChange={e => update('contact_person', e.target.value)} className={inputCls} placeholder="Select or type contact name" />
                <datalist id="invoice-contacts">
                  {availableContacts.map((cp, i) => <option key={i} value={cp.name} />)}
                </datalist>
                {availableContacts.length > 1 && (
                  <p className="text-[10px] text-muted-foreground mt-1">Trips are filtered by the selected contact person.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Email</Label>
                  <Input type="email" value={form.client_email} onChange={e => update('client_email', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Phone</Label>
                  <Input value={form.client_phone} onChange={e => update('client_phone', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Address</Label>
                  <Input value={form.client_address} onChange={e => update('client_address', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">TRN</Label>
                  <Input value={form.client_trn} onChange={e => update('client_trn', e.target.value)} className={inputCls} />
                </div>
              </div>
            </Section>

            {/* Invoice Details */}
            <Section title="Invoice Details" icon={FileText}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Invoice #</Label>
                  <Input value={form.invoice_number} readOnly className={`${inputCls} font-mono text-xs opacity-60 cursor-not-allowed`} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label>
                  <Select value={form.status} onValueChange={v => update('status', v)} disabled={payAmount > 0}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['draft', 'sent', 'paid', 'overdue', 'cancelled'].map(s => (
                        <SelectItem key={s} value={s}>{t(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">{t('issue_date')}</Label>
                  <Input type="date" value={form.issue_date} onChange={e => update('issue_date', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">{t('due_date')}</Label>
                  <Input type="date" value={form.due_date} onChange={e => update('due_date', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">VAT %</Label>
                  <Input type="number" value={form.vat_rate} onChange={e => update('vat_rate', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">Payment Terms</Label>
                  <Input value={form.payment_terms} onChange={e => update('payment_terms', e.target.value)} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground mb-1.5">LPO Ref #</Label>
                  <Input value={form.lpo_ref} onChange={e => update('lpo_ref', e.target.value)} placeholder="Enter LPO reference number" className={inputCls} />
                </div>
              </div>
            </Section>

            {/* Line Items */}
            <Section title="Line Items" icon={Sparkles}>
              <div className="space-y-2.5">
                {form.line_items.map((item, i) => (
                  <div key={i} className="glass-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">Item {i + 1}</span>
                      {form.line_items.length > 1 && (
                        <button onClick={() => removeItem(i)} className="text-rose-400 hover:text-rose-300 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <Input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder={t('description')} className={`${inputCls} text-sm`} />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">{t('quantity')}</Label>
                        <Input type="number" value={item.quantity || ''} onChange={e => updateItem(i, 'quantity', e.target.value)} onWheel={e => e.target.blur()} className={`${inputCls} text-sm`} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">{t('unit_price')}</Label>
                        <Input type="number" value={item.unit_price || ''} onChange={e => updateItem(i, 'unit_price', e.target.value)} onWheel={e => e.target.blur()} className={`${inputCls} text-sm`} />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">{t('amount')}</Label>
                        <Input value={formatCurrency(item.amount)} readOnly className={`${inputCls} opacity-60 text-sm`} />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                      <Checkbox checked={!!item.vat_excluded} onCheckedChange={(v) => updateItem(i, 'vat_excluded', !!v)} />
                      <span className="text-[11px] text-muted-foreground">VAT Excluded</span>
                    </label>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={addItem} className="w-full border-dashed border-border">
                <Plus className="w-4 h-4 mr-1.5" /> {t('add_item')}
              </Button>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-52 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('subtotal')}</span><span className="font-mono tabular-nums">{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('vat')} ({form.vat_rate}%)</span><span className="font-mono tabular-nums">{formatCurrency(vatAmount)}</span></div>
                  <div className="flex justify-between font-bold border-t border-border pt-1"><span>{t('total')}</span><span className="font-mono tabular-nums text-primary">{formatCurrency(total)}</span></div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">{t('notes')}</Label>
                <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} className={inputCls} />
              </div>
            </Section>

            {/* Payment */}
            <Section title="Payment" icon={CreditCard}>
              <div className="glass-card p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Receive payment now</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Capture a client payment and link it to this invoice. Status syncs automatically.</p>
                </div>
                <Switch checked={receivePayment} onCheckedChange={setReceivePayment} />
              </div>
              {receivePayment && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <StatusPill status={resultingStatus} />
                    <span className="text-xs text-muted-foreground">Balance: <span className={`font-bold tabular-nums ${balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{formatCurrency(balanceDue)}</span></span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Amount Received</Label>
                      <Input type="number" value={payment.amount} onChange={e => updatePayment('amount', e.target.value)} className={inputCls} placeholder="0.00" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Payment Mode</Label>
                      <Select value={payment.mode} onValueChange={v => updatePayment('mode', v)}>
                        <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Payment Date</Label>
                      <Input type="date" value={payment.date} onChange={e => updatePayment('date', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5">Reference (optional)</Label>
                      <Input value={payment.reference} onChange={e => updatePayment('reference', e.target.value)} className={inputCls} placeholder="Auto-generated" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5">Payment Notes</Label>
                    <Textarea value={payment.notes} onChange={e => updatePayment('notes', e.target.value)} rows={2} className={inputCls} placeholder="Notes for this payment..." />
                  </div>
                </div>
              )}
            </Section>

            {/* Actions */}
            <div className="flex gap-2 pt-1 pb-6">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                {saving ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
              </Button>
              <Button onClick={handleDownload} disabled={downloading} variant="outline">
                {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
                Draft PDF
              </Button>
            </div>
          </div>

          {/* RIGHT: Live Preview */}
          <div className={cn('w-full sm:w-1/2 overflow-hidden bg-muted/10', mobileView === 'preview' ? 'flex flex-col' : 'hidden sm:flex flex-col')}>
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Preview
              </div>
            </div>
            <div className="h-[calc(100%-36px)]">
              <InvoicePreview form={{ ...form, line_items: previewItems, subtotal, vat_amount: vatAmount, total_amount: total, status: resultingStatus, paid_amount: payAmount }} settings={settings} mode={invoiceMode} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="border-t border-white/[0.04] pt-4 first:border-t-0 first:pt-0">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-primary/80" />}
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}