import { useState, useEffect, useMemo, useRef } from 'react';
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
import { formatCurrency, formatDateDash } from '@/lib/formatters';
import { Plus, Trash2, Check, Loader2, CreditCard, User, FileText, Sparkles, FileDown, ChevronDown, X, AlertTriangle, Users, Receipt, ListOrdered, Wallet } from 'lucide-react';
import { useInvoiceCreate, useInvoiceUpdate, useClientPaymentCreate } from '@/hooks/useEntityQueries';
import { generateInvoiceNumber, getCompanySettings } from '@/lib/companySettings';
import { persistManualInvoiceNumber, buildInvoiceNumberSnapshot } from '@/lib/invoiceSequence';
import { downloadInvoicePDF, downloadPerTripInvoicePDF, downloadMonthlyInvoicePDF } from '@/lib/invoiceHtml';
import { useToast } from '@/components/ui/use-toast';
import InvoicePreview from '@/components/invoices/InvoicePreview';
import DatePicker from '@/components/common/DatePicker';
import ClientSelect from '@/components/common/ClientSelect';
import ContactPersonSelect from '@/components/trips/ContactPersonSelect';
import { autoCap } from '@/lib/formEnhancements';
import { cn } from '@/lib/utils';

const emptyItem = { description: '', quantity: 1, unit_price: 0, amount: 0, vat_excluded: false, show_driver: true, show_vehicle: true, show_delivery_note: true, driver_name: '', vehicle_no: '', delivery_note_no: '' };

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
  const [suggestedNumber, setSuggestedNumber] = useState('');
  const [monthlyContracts, setMonthlyContracts] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tripsOpen, setTripsOpen] = useState(false);
  const [contractsOpen, setContractsOpen] = useState(false);
  const tripsDropdownRef = useRef(null);
  const contractsDropdownRef = useRef(null);
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
        setSuggestedNumber(num);
        setForm(prev => ({ ...prev, invoice_number: num, vat_rate: s.default_vat_rate ?? 5 }));
      });
    }
  }, [editInvoice, open, defaultClientName]);

  useEffect(() => {
    if (open) {
      base44.entities.Client.list('-created_date', 500).catch(() => []).then((cl) => {
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
      base44.entities.Trip.list('-created_date', 500).catch(() => []).then(setTrips);
      base44.entities.Invoice.list('-created_date', 500).catch(() => []).then(setInvoices);
      base44.entities.MonthlyContract.list('-created_date', 200).catch(() => []).then(setMonthlyContracts);
      base44.entities.Vehicle.list('-created_date', 500).catch(() => []).then(setVehicles);
    }
  }, [open, defaultClientName, editInvoice]);

  useEffect(() => {
    if (!tripsOpen && !contractsOpen) return;
    const onDown = (e) => {
      if (tripsOpen && tripsDropdownRef.current && !tripsDropdownRef.current.contains(e.target)) setTripsOpen(false);
      if (contractsOpen && contractsDropdownRef.current && !contractsDropdownRef.current.contains(e.target)) setContractsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [tripsOpen, contractsOpen]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updatePayment = (field, value) => setPayment(prev => ({ ...prev, [field]: value }));

  const handleClientChange = (value) => {
    const client = clients.find(c => c.name === value);
    setForm(prev => {
      const base = { ...prev, client_name: value, contact_person: '', line_items: prev.line_items.filter(i => !i._trip_number) };
      if (client) {
        base.client_email = client.email || '';
        base.client_phone = client.phone || '';
        base.client_address = client.address || '';
        base.client_trn = client.trn || '';
      }
      return base;
    });
    setTripsOpen(false);
    setContractsOpen(false);
  };

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

  // Auto-select contact person when only one contact is available
  useEffect(() => {
    if (form.client_name && availableContacts.length === 1 && form.contact_person !== availableContacts[0].name) {
      setForm(prev => ({ ...prev, contact_person: availableContacts[0].name }));
    }
  }, [form.client_name, availableContacts.length]);

  const invoicedTripNumbers = useMemo(() => {
    const set = new Set();
    (invoices || []).forEach(inv => {
      if (inv.trip_id) String(inv.trip_id).split(',').forEach(t => { const v = t.trim(); if (v) set.add(v); });
    });
    return set;
  }, [invoices]);

  const clientCompletedTrips = (trips || []).filter(tr => {
    if (tr.client_name !== form.client_name || tr.status !== 'completed' || invoicedTripNumbers.has(tr.trip_number)) return false;
    if (form.contact_person) return tr.contact_person === form.contact_person;
    return true;
  });
  const selectedTripNumbers = [...new Set(form.line_items.filter(i => i._trip_number && !i._is_addon).map(i => i._trip_number))];

  const toggleTrip = (trip) => {
    setForm(prev => {
      const items = [...prev.line_items];
      const exists = items.some(i => i._trip_number === trip.trip_number && !i._is_addon);
      if (exists) {
        // remove the trip and all its add-on line items
        const filtered = items.filter(i => i._trip_number !== trip.trip_number);
        return { ...prev, line_items: filtered };
      }
      const route = [trip.from_location, trip.to_location].filter(Boolean).join(' To ');
      const newItems = [{
        _trip_number: trip.trip_number,
        description: route || trip.trip_number,
        date: trip.trip_date,
        quantity: 1,
        unit_price: Number(trip.revenue || trip.base_fare || 0),
        amount: Number(trip.revenue || trip.base_fare || 0),
        service: 'TRIP',
        uom: 'TRIP',
        vat_excluded: false,
        show_driver: true,
        show_vehicle: true,
        show_delivery_note: true,
        driver_name: trip.driver_name || '',
        vehicle_no: trip.vehicle_plate || '',
        delivery_note_no: trip.delivery_note_number || '',
      }];
      // add each add-on as a separate line item; without-tax add-ons are VAT-excluded (VAT 0, shown separately)
      (Array.isArray(trip.add_ons) ? trip.add_ons : []).forEach((a, ai) => {
        const amt = Number(a.amount) || 0;
        if (amt <= 0 && !a.description) return;
        newItems.push({
          _trip_number: trip.trip_number,
          _is_addon: true,
          description: a.description || `Add-on ${ai + 1}`,
          date: trip.trip_date,
          quantity: 1,
          unit_price: amt,
          amount: amt,
          service: 'ADDON',
          uom: 'LS',
          vat_excluded: !a.vat_included,
        });
      });
      return { ...prev, line_items: [...items, ...newItems] };
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
  const isManualOverride = isEdit
    ? (!!editInvoice?.invoice_number && form.invoice_number !== editInvoice.invoice_number && form.invoice_number !== '')
    : (suggestedNumber !== '' && form.invoice_number !== suggestedNumber);
  const isDuplicate = form.invoice_number !== '' && invoices.some(inv => inv.invoice_number === form.invoice_number && (isEdit ? inv.id !== editInvoice?.id : true));

  const handleSave = async () => {
    if (!form.client_name?.trim()) {
      toast({ variant: 'destructive', title: 'Client name is required' });
      return;
    }
    if (isDuplicate) {
      toast({ variant: 'destructive', title: 'Duplicate invoice number', description: 'This invoice number already exists. Choose a different number.' });
      return;
    }
    setSaving(true);
    try {
      const tripNumbers = form.line_items.map(i => i._trip_number).filter(Boolean);
      const data = {
        ...form,
        line_items: form.line_items.map(({ _trip_number, _contract_id, _is_addon, ...rest }) => rest),
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
        const oldNumber = editInvoice.invoice_number;
        const newNumber = form.invoice_number;
        const numberChanged = oldNumber && newNumber && oldNumber !== newNumber;
        let reallocated = [];
        let undoSnapshot = null;
        if (numberChanged) {
          try {
            undoSnapshot = await buildInvoiceNumberSnapshot();
          } catch (e) { /* non-blocking */ }
        }
        await updateInvoice.mutateAsync({ id: editInvoice.id, data });
        if (numberChanged) {
          try {
            const me = await base44.auth.me().catch(() => null);
            await persistManualInvoiceNumber(newNumber, oldNumber, me?.full_name || me?.email || 'Unknown', editInvoice.id);
            await base44.entities.InvoiceNumberChange.create({
              invoice_id: editInvoice.id,
              invoice_number: newNumber,
              from_number: oldNumber,
              to_number: newNumber,
              reason: 'Manual edit from invoice form',
              changed_by: me?.full_name || me?.email || 'Unknown',
              changed_at: new Date().toISOString(),
              action_type: 'manual_edit',
              reallocated_invoices: reallocated,
              undo_snapshot: undoSnapshot || {},
            });
            window.dispatchEvent(new CustomEvent('invoice:number-changed', {
              detail: { invoiceId: editInvoice.id, fromNumber: oldNumber, toNumber: newNumber, reallocated, undoSnapshot }
            }));
          } catch { /* non-blocking */ }
        }
      } else {
        const created = await createInvoice.mutateAsync(data);
        invoiceId = created?.id;
        invoiceNumber = created?.invoice_number || form.invoice_number;
        // Always persist the counter so the next suggestion continues from
        // this number (manual edit OR auto-accepted).  Audit entry is added
        // only when the user genuinely overrode the suggestion.
        try {
          const me = await base44.auth.me().catch(() => null);
          await persistManualInvoiceNumber(form.invoice_number, suggestedNumber, me?.full_name || me?.email || 'Unknown', created?.id);
        } catch { /* non-blocking — best-effort */ }
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
      const payload = { ...form, line_items: form.line_items.map(({ _trip_number, _contract_id, _is_addon, ...rest }) => rest), subtotal, vat_amount: vatAmount, total_amount: total, status: resultingStatus, paid_amount: payAmount };
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
        className="w-full sm:max-w-5xl sm:h-[88vh] sm:max-h-[88vh] h-[100vh] overflow-hidden bg-background p-0 flex flex-col gap-0 rounded-xl">
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

        <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
          {/* LEFT: Form */}
          <div className={cn('w-full sm:w-1/2 min-h-0 flex flex-col sm:border-r border-border', mobileView === 'form' ? 'flex' : 'hidden sm:flex')}>
          <div className="flex-1 overflow-y-auto thin-scroll px-5 py-5 space-y-4">
            {/* Invoice Mode Toggle */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted/50 border border-border">
              <button type="button" onClick={() => setInvoiceMode('trip')} className={cn('flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors', invoiceMode === 'trip' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>Per-Trip Invoice</button>
              <button type="button" onClick={() => setInvoiceMode('monthly')} className={cn('flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors', invoiceMode === 'monthly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>Monthly Contract</button>
            </div>

            {/* Client Section */}
            <Section title="Client" icon={Users} accent="34, 197, 94">
              <div className="space-y-3">
                <div>
                  <Label className="text-xs mb-1.5 block">Client *</Label>
                  <ClientSelect value={form.client_name} onChange={handleClientChange} clients={clients} placeholder="Select client" />
                </div>
                {availableContacts.length > 0 && (
                  <div>
                    <Label className="text-xs mb-1.5 block">Contact Person</Label>
                    <ContactPersonSelect value={form.contact_person} onChange={(v) => update('contact_person', v)} contacts={availableContacts} placeholder="Select contact" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">Email</Label>
                    <Input value={form.client_email || ''} onChange={(e) => update('client_email', e.target.value)} className={inputCls} placeholder="client@email.com" />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Phone</Label>
                    <Input value={form.client_phone || ''} onChange={(e) => update('client_phone', e.target.value)} className={inputCls} placeholder="+971..." />
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Address</Label>
                  <Input value={form.client_address || ''} onChange={(e) => update('client_address', e.target.value)} className={inputCls} placeholder="Street, city" />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">TRN</Label>
                  <Input value={form.client_trn || ''} onChange={(e) => update('client_trn', e.target.value)} className={inputCls} placeholder="Tax registration number" />
                </div>
              </div>
            </Section>

            {/* Invoice Details */}
            <Section title="Invoice Details" icon={FileText} accent="59, 130, 246">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">Invoice #</Label>
                    <Input value={form.invoice_number || ''} onChange={(e) => update('invoice_number', e.target.value)} className={cn(inputCls, isDuplicate && 'border-destructive', isManualOverride && 'border-amber-500')} placeholder="2026-0001" />
                    {isDuplicate && <p className="text-[11px] text-destructive mt-1">Duplicate number</p>}
                    {isManualOverride && !isDuplicate && <p className="text-[11px] text-amber-500 mt-1">Manual override</p>}
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Status</Label>
                    <Select value={form.status} onValueChange={(v) => update('status', v)}>
                      <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['draft', 'unsigned', 'signed', 'sent', 'partially_paid', 'paid', 'cancelled', 'overdue'].map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">Issue Date</Label>
                    <DatePicker value={form.issue_date} onChange={(v) => update('issue_date', v)} />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Due Date</Label>
                    <DatePicker value={form.due_date} onChange={(v) => update('due_date', v)} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">LPO Ref</Label>
                  <Input value={form.lpo_ref || ''} onChange={(e) => update('lpo_ref', e.target.value)} className={inputCls} placeholder="Purchase order reference" />
                </div>
              </div>
            </Section>

            {/* Line Items — Trip Picker or Contract Picker or Manual */}
            {invoiceMode === 'trip' && form.client_name && (
              <Section title="Trips" icon={Receipt} accent="168, 85, 247">
                <div className="relative" ref={tripsDropdownRef}>
                  <button type="button" onClick={() => setTripsOpen(o => !o)} className={cn('w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-background/50 text-sm transition-colors hover:border-primary/40', tripsOpen && 'border-primary/40')}>
                    <span className="text-muted-foreground">{selectedTripNumbers.length} trip{selectedTripNumbers.length !== 1 ? 's' : ''} selected</span>
                    <ChevronDown className={cn('w-4 h-4 transition-transform', tripsOpen && 'rotate-180')} />
                  </button>
                  {tripsOpen && (
                    <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-xl">
                      {clientCompletedTrips.length === 0 ? (
                        <p className="px-3 py-4 text-xs text-muted-foreground text-center">No uninvoiced completed trips for this client.</p>
                      ) : (
                        clientCompletedTrips.map(tr => (
                          <button key={tr.id} type="button" onClick={() => toggleTrip(tr)} className={cn('w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-primary/10 border-b border-border/50', selectedTripNumbers.includes(tr.trip_number) && 'bg-primary/5')}>
                            <Checkbox checked={selectedTripNumbers.includes(tr.trip_number)} className="pointer-events-none" />
                            <span className="font-mono">{tr.trip_number}</span>
                            <span className="text-muted-foreground truncate">{[tr.from_location, tr.to_location].filter(Boolean).join(' → ')}</span>
                            <span className="ml-auto font-semibold">{formatCurrency(tr.revenue || tr.base_fare || 0)}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {invoiceMode === 'monthly' && form.client_name && (
              <Section title="Monthly Contracts" icon={Receipt} accent="168, 85, 247">
                <div className="relative" ref={contractsDropdownRef}>
                  <button type="button" onClick={() => setContractsOpen(o => !o)} className={cn('w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-background/50 text-sm transition-colors hover:border-primary/40', contractsOpen && 'border-primary/40')}>
                    <span className="text-muted-foreground">{selectedContractIds.length} contract{selectedContractIds.length !== 1 ? 's' : ''} selected</span>
                    <ChevronDown className={cn('w-4 h-4 transition-transform', contractsOpen && 'rotate-180')} />
                  </button>
                  {contractsOpen && (
                    <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-border bg-popover shadow-xl">
                      {availableContracts.length === 0 ? (
                        <p className="px-3 py-4 text-xs text-muted-foreground text-center">No active contracts available for this client.</p>
                      ) : (
                        availableContracts.map(c => (
                          <button key={c.id} type="button" onClick={() => toggleContract(c)} className={cn('w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-primary/10 border-b border-border/50', selectedContractIds.includes(c.id) && 'bg-primary/5')}>
                            <Checkbox checked={selectedContractIds.includes(c.id)} className="pointer-events-none" />
                            <span className="font-medium">{c.vehicle_plate || c.company_name}</span>
                            <span className="text-muted-foreground">{c.driver_name || ''}</span>
                            <span className="ml-auto font-semibold">{formatCurrency(c.monthly_rate || 0)}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Line Items */}
            <Section title="Line Items" icon={ListOrdered} accent="245, 158, 11">
              <div className="space-y-2">
                {form.line_items.length === 0 && <p className="text-xs text-muted-foreground py-2">No line items yet. Select trips/contracts above or add manually.</p>}
                {form.line_items.map((item, i) => (
                  <div key={i} className="rounded-lg border border-border bg-background/30 p-2.5 space-y-2">
                    <div className="flex items-start gap-2">
                      <Input value={item.description || ''} onChange={(e) => updateItem(i, 'description', e.target.value)} className={cn(inputCls, 'flex-1')} placeholder="Description" />
                      <button type="button" onClick={() => removeItem(i)} className="mt-1.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <Label className="text-[10px] mb-1 block">Qty</Label>
                        <Input type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} className={inputCls} />
                      </div>
                      <div>
                        <Label className="text-[10px] mb-1 block">Unit Price</Label>
                        <Input type="number" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', Number(e.target.value))} className={inputCls} />
                      </div>
                      <div>
                        <Label className="text-[10px] mb-1 block">Amount</Label>
                        <Input value={(Number(item.amount) || 0).toFixed(2)} readOnly className={cn(inputCls, 'opacity-70')} />
                      </div>
                      <div className="flex items-end gap-2 pb-0.5">
                        <label className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                          <Checkbox checked={item.vat_excluded || false} onCheckedChange={(v) => updateItem(i, 'vat_excluded', v)} />
                          VAT Excl
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addItem} className="w-full py-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors flex items-center justify-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Line Item
                </button>
              </div>
            </Section>

            {/* Totals & Payment */}
            <Section title="Totals & Payment" icon={Wallet} accent="34, 197, 94">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1.5 block">VAT Rate (%)</Label>
                    <Input type="number" value={form.vat_rate} onChange={(e) => update('vat_rate', Number(e.target.value))} className={inputCls} />
                  </div>
                  <div>
                    <Label className="text-xs mb-1.5 block">Payment Terms</Label>
                    <Input value={form.payment_terms || ''} onChange={(e) => update('payment_terms', e.target.value)} className={inputCls} placeholder="Net 30" />
                  </div>
                </div>
                <div className="rounded-lg bg-muted/30 p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">VAT ({form.vat_rate}%)</span><span className="font-medium">{formatCurrency(vatAmount)}</span></div>
                  <div className="flex justify-between text-base font-bold pt-1.5 border-t border-border"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={receivePayment} onCheckedChange={setReceivePayment} />
                  <Label className="text-xs cursor-pointer" onClick={() => setReceivePayment(!receivePayment)}>Receive payment now</Label>
                </div>
                {receivePayment && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px] mb-1 block">Amount</Label>
                      <Input type="number" value={payment.amount} onChange={(e) => updatePayment('amount', e.target.value)} className={inputCls} placeholder={String(total)} />
                    </div>
                    <div>
                      <Label className="text-[10px] mb-1 block">Mode</Label>
                      <Select value={payment.mode} onValueChange={(v) => updatePayment('mode', v)}>
                        <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['cash', 'bank_transfer', 'cheque', 'card'].map(m => <SelectItem key={m} value={m}>{m.replace(/_/g, ' ')}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] mb-1 block">Date</Label>
                      <DatePicker value={payment.date} onChange={(v) => updatePayment('date', v)} />
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Notes */}
            <Section title="Notes" icon={FileText} accent="148, 163, 184">
              <Textarea value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} className={inputCls} rows={2} placeholder="Optional notes for the client" />
            </Section>
          </div>
          {/* Footer Actions — always visible at bottom */}
          <div className="flex gap-2 pt-3 pb-4 px-5 bg-background/95 backdrop-blur-sm border-t border-border flex-shrink-0">
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
          <div className={cn('w-full sm:w-1/2 min-h-0 overflow-hidden bg-muted/10', mobileView === 'preview' ? 'flex flex-col' : 'hidden sm:flex flex-col')}>
            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Preview
              </div>
            </div>
            <div className="h-[calc(100%-36px)]" style={{ zoom: 0.8 }}>
              <InvoicePreview form={{ ...form, line_items: previewItems, subtotal, vat_amount: vatAmount, total_amount: total, status: resultingStatus, paid_amount: payAmount }} settings={settings} mode={invoiceMode} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, icon: Icon, accent = '99, 102, 241', children }) {
  return (
    <div
      className="trip-section"
      style={{ '--section-accent': accent }}
    >
      <p className="text-[11px] uppercase tracking-wider font-semibold mb-3 flex items-center gap-2" style={{ color: `rgb(${accent})` }}>
        {Icon && (
          <span className="trip-section-icon" style={{ '--section-accent': accent }}>
            <Icon className="w-3.5 h-3.5" />
          </span>
        )}
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}