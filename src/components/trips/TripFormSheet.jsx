import { useState, useEffect, useRef, useCallback } from 'react';
import { Truck, FileText, X, Check, Loader2, Save, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { useTripCreate, useTripUpdate } from '@/hooks/useEntityQueries';
import { useToast } from '@/components/ui/use-toast';
import { getCompanySettings } from '@/lib/companySettings';
import ModeToggle from './ModeToggle';
import TripModeFields from './TripModeFields';
import TripCalcPanel from './TripCalcPanel';
import TripCalcMobileBar from './TripCalcMobileBar';
import ContractModeFields from './contract/ContractModeFields';
import ContractProfitPanel from './contract/ContractProfitPanel';
import TripMapPanel from './TripMapPanel';
import TripFinancialFields from './TripFinancialFields';
import VendorPaymentFields from './VendorPaymentFields';
import TripAddOnsSection from './TripAddOnsSection';

const DEFAULT_FORM = {
  from_location: '', to_location: '', vehicle_plate: '', driver_name: '', driver_phone: '', vendor_name: '',
  client_name: '', trip_type: 'one_way', delivery_note_number: '', delivery_note_url: '',
  hours: '', return_trip_number: '', payment_status: 'corporate_credit',
  trip_date: new Date().toISOString().split('T')[0],
  load_datetime: '', offload_datetime: '', trip_number: '',
  status: 'scheduled', status_source: 'automatic', revenue: '', distance_km: '', notes: '', contact_person: '',
  permit_required: false, permit_name: '',
  duration_unit: 'hours', calculated_duration: '', base_fare: '', max_allowed_duration: 6, overtime_rate: 50,
  assignment_mode: 'company',
  vendor_agreed_rate: '', vendor_payment_status: 'unpaid', vendor_due_date: '', vendor_payment_notes: '',
  add_ons: []
};

const DEFAULT_CONTRACT = {
  company_name: '', start_date: '', end_date: '', auto_renewal: false,
  monthly_rate: '', status: 'active', vehicle_plate: '', driver_name: '', notes: '',
  usage_date: '', usage_hours: '', usage_days: '', per_hour_rate: '', per_day_rate: ''
};

const todayStr = () => new Date().toISOString().split('T')[0];

export default function TripFormSheet({ open, onOpenChange, editTrip, editContract, onSaved, initialMode, prefill }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const createTrip = useTripCreate();
  const updateTrip = useTripUpdate();
  const [mode, setMode] = useState('trip');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tripsList, setTripsList] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [clients, setClients] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [fixedCharges, setFixedCharges] = useState([]);
  const [autoFilled, setAutoFilled] = useState(false);
  const [createdFlags, setCreatedFlags] = useState({ client: false, vehicle: false, driver: false });
  const [cCreatedFlags, setCCreatedFlags] = useState({ company: false, vehicle: false, driver: false });
  const [creating, setCreating] = useState(null);
  const [cCreating, setCCreating] = useState(null);
  const [revenueOverride, setRevenueOverride] = useState(false);
  const [vendorRateOverride, setVendorRateOverride] = useState(false);
  const [companySettings, setCompanySettings] = useState({ vendor_rate_percentage: 80 });
  const [mapCollapsed, setMapCollapsed] = useState(true);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [addOns, setAddOns] = useState([]);

  // Contract state
  const [contract, setContract] = useState({ ...DEFAULT_CONTRACT });
  const [contractAddOns, setContractAddOns] = useState([]);

  useEffect(() => {
    if (open) {
      getCompanySettings().then(setCompanySettings).catch(() => {});
      Promise.all([
      base44.entities.Trip.list('-created_date', 200).catch(() => []),
      base44.entities.Vehicle.list('-created_date', 200).catch(() => []),
      base44.entities.Driver.list('-created_date', 200).catch(() => []),
      base44.entities.Client.list('-created_date', 200).catch(() => []),
      base44.entities.Vendor.list('-created_date', 200).catch(() => [])]
      ).then(([trips, vehs, drvs, clnts, vnds]) => {
        setTripsList(trips || []);
        setVehicles(vehs || []);
        setDrivers(drvs || []);
        setClients(clnts || []);
        setVendors((vnds || []).filter((v) => !v.provider_type || ['vehicle_supplier', 'driver_supplier', 'both'].includes(v.provider_type)));
      });
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setMapCollapsed(true);
      setRevenueOverride(false);
      if (editContract) {
        setMode('contract');
        setContract({
          ...DEFAULT_CONTRACT,
          company_name: editContract.company_name || '',
          start_date: editContract.start_date || '',
          end_date: editContract.end_date || '',
          auto_renewal: !!editContract.auto_renewal,
          monthly_rate: editContract.monthly_rate || '',
          status: editContract.status || 'active',
          vehicle_plate: editContract.vehicle_plate || '',
          driver_name: editContract.driver_name || '',
          notes: editContract.notes || '',
          usage_date: editContract.usage_date || '',
          usage_hours: editContract.usage_hours || '',
          usage_days: editContract.usage_days || '',
          per_hour_rate: editContract.per_hour_rate || '',
          per_day_rate: editContract.per_day_rate || ''
        });
        setCCreatedFlags({ company: false, vehicle: false, driver: false });
        setContractAddOns(Array.isArray(editContract.add_ons) ? editContract.add_ons : []);
      } else if (editTrip) {
        setMode('trip');
        setForm({
          ...DEFAULT_FORM,
          ...editTrip,
          hours: editTrip.hours || '',
          revenue: editTrip.revenue || '',
          distance_km: editTrip.distance_km || '',
          load_datetime: editTrip.load_datetime || '',
          offload_datetime: editTrip.offload_datetime || '',
          base_fare: editTrip.base_fare || editTrip.revenue || '',
          max_allowed_duration: editTrip.max_allowed_duration || '',
          overtime_rate: editTrip.overtime_rate || '',
          duration_unit: editTrip.duration_unit || 'hours',
          calculated_duration: editTrip.calculated_duration || '',
          assignment_mode: editTrip.vendor_name ? 'vendor' : 'company',
          vendor_agreed_rate: editTrip.vendor_agreed_rate || '',
          vendor_payment_status: editTrip.vendor_payment_status || 'unpaid',
          vendor_due_date: editTrip.vendor_due_date || '',
          vendor_payment_notes: editTrip.vendor_payment_notes || '',
          permit_required: !!editTrip.permit_required,
          permit_name: editTrip.permit_name || ''
        });
        setAddOns(Array.isArray(editTrip.add_ons) ? editTrip.add_ons : []);
      } else {
        setMode(initialMode || 'trip');
        setForm({ ...DEFAULT_FORM, trip_date: todayStr(), ...(prefill || {}) });
        setAddOns([]);
        setContract({ ...DEFAULT_CONTRACT });
        setContractAddOns([]);
        setCreatedFlags({ client: false, vehicle: false, driver: false });
        setCCreatedFlags({ company: false, vehicle: false, driver: false });
      }
    }
  }, [editTrip, editContract, open]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => {const n = { ...prev };delete n[field];return n;});
    if (field === 'client_name') setCreatedFlags((prev) => ({ ...prev, client: false }));
    if (field === 'vehicle_plate') setCreatedFlags((prev) => ({ ...prev, vehicle: false }));
    if (field === 'driver_name') {
      setCreatedFlags((prev) => ({ ...prev, driver: false }));
      // Auto-fill driver phone from known drivers
      const matched = drivers.find((d) => d.name?.toLowerCase() === value?.toLowerCase());
      if (matched && matched.phone) {
        setForm((prev) => ({ ...prev, driver_phone: matched.phone }));
      }
    }
  };

  const updateContract = (field, value) => {
    setContract((prev) => ({ ...prev, [field]: value }));
    if (field === 'company_name') setCCreatedFlags((prev) => ({ ...prev, company: false }));
    if (field === 'vehicle_plate') setCCreatedFlags((prev) => ({ ...prev, vehicle: false }));
    if (field === 'driver_name') setCCreatedFlags((prev) => ({ ...prev, driver: false }));
  };

  // Auto-calculate monthly rate from usage-based pricing (hours × per-hour + days × per-day)
  useEffect(() => {
    const hours = Number(contract.usage_hours) || 0;
    const days = Number(contract.usage_days) || 0;
    const perHour = Number(contract.per_hour_rate) || 0;
    const perDay = Number(contract.per_day_rate) || 0;
    const calc = hours * perHour + days * perDay;
    if (calc > 0) setContract((prev) => ({ ...prev, monthly_rate: calc }));
  }, [contract.usage_hours, contract.usage_days, contract.per_hour_rate, contract.per_day_rate]);

  useEffect(() => {
    if (form.client_name) {
      base44.entities.FixedCharge.filter({ client_name: form.client_name, status: 'active' }).
      then((charges) => setFixedCharges(charges || [])).
      catch(() => setFixedCharges([]));
    } else {setFixedCharges([]);}
  }, [form.client_name]);

  useEffect(() => {
    if (form.client_name && form.from_location && form.to_location && fixedCharges.length > 0) {
      const routeDesc = `${form.from_location} → ${form.to_location}`;
      const match = fixedCharges.find((c) => c.description === routeDesc);
      if (match) {update('base_fare', match.amount);setAutoFilled(true);} else
      {setAutoFilled(false);}
    } else {setAutoFilled(false);}
  }, [form.from_location, form.to_location, fixedCharges]);

  useEffect(() => {
    let calculatedDuration = '';
    if (form.load_datetime && form.offload_datetime) {
      const load = new Date(form.load_datetime).getTime();
      const offload = new Date(form.offload_datetime).getTime();
      const diffMs = offload - load;
      if (diffMs > 0) {
        const duration = form.duration_unit === 'days' ? diffMs / 86400000 : diffMs / 3600000;
        calculatedDuration = Math.round(duration * 100) / 100;
      }
    }
    setForm((prev) => ({ ...prev, calculated_duration: calculatedDuration }));
  }, [form.load_datetime, form.offload_datetime, form.duration_unit]);

  const autoRevenue = (() => {
    const baseFare = Number(form.base_fare) || 0;
    if (form.trip_type === 'contract') return baseFare;
    let total = baseFare;
    if (form.load_datetime && form.offload_datetime) {
      const load = new Date(form.load_datetime).getTime();
      const offload = new Date(form.offload_datetime).getTime();
      const diffMs = offload - load;
      if (diffMs > 0) {
        const duration = form.duration_unit === 'days' ? diffMs / 86400000 : diffMs / 3600000;
        const calc = Math.round(duration * 100) / 100;
        const maxAllowed = Number(form.max_allowed_duration) || 0;
        const otRate = Number(form.overtime_rate) || 0;
        const overtime = Math.max(0, calc - maxAllowed);
        total = baseFare + overtime * otRate;
      }
    }
    return total;
  })();

  useEffect(() => {
    if (!revenueOverride) setForm((prev) => ({ ...prev, revenue: autoRevenue || '' }));
  }, [autoRevenue, revenueOverride]);

  // Auto-calculate vendor agreed rate from trip revenue (configurable percentage)
  const autoVendorRate = (() => {
    const revenue = Number(form.revenue) || 0;
    const pct = Number(companySettings.vendor_rate_percentage) || 80;
    return Math.round(revenue * pct / 100 * 100) / 100;
  })();

  useEffect(() => {
    if (form.assignment_mode === 'vendor' && !vendorRateOverride) {
      setForm((prev) => ({ ...prev, vendor_agreed_rate: autoVendorRate || '' }));
    }
  }, [autoVendorRate, vendorRateOverride, form.assignment_mode]);

  useEffect(() => {
    if (form.assignment_mode !== 'vendor') setVendorRateOverride(false);
  }, [form.assignment_mode]);

  const handleRouteInfo = useCallback((info) => {
    if (info.distanceKm != null) {
      setForm((prev) => ({ ...prev, distance_km: info.distanceKm }));
    }
  }, []);

  const handleSelectFrom = useCallback((v) => setForm((prev) => ({ ...prev, from_location: v })), []);
  const handleSelectTo = useCallback((v) => setForm((prev) => ({ ...prev, to_location: v })), []);
  const handleToggleMapCollapse = useCallback(() => setMapCollapsed((prev) => !prev), []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('delivery_note_url', file_url);
    } catch (err) {} finally {setUploading(false);}
  };

  const generateTripNumber = () => {
    const dateSource = form.load_datetime || form.trip_date + 'T00:00';
    const date = new Date(dateSource);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `TR-${dd}${mm}-`;
    let maxSeq = 0;
    tripsList.forEach((tr) => {
      if (tr.trip_number?.startsWith(prefix)) {
        const seq = parseInt(tr.trip_number.slice(prefix.length), 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    });
    return `${prefix}${String(maxSeq + 1).padStart(2, '0')}`;
  };

  const autoTripNumber = editTrip ? editTrip.trip_number || '' : generateTripNumber();

  const buildData = (isDraft = false) => {
    const { assignment_mode, ...rest } = form;
    return {
      ...rest,
      permit_required: !!form.permit_required,
      permit_name: form.permit_required ? form.permit_name || '' : '',
      driver_phone: form.driver_phone || '',
      is_draft: isDraft,
      trip_number: isDraft ? '' : form.trip_number || autoTripNumber || generateTripNumber(),
      trip_date: form.load_datetime ?
      form.load_datetime.split('T')[0] :
      form.offload_datetime ? form.offload_datetime.split('T')[0] : todayStr(),
      hours: form.trip_type === 'hourly' ? Number(form.hours) || 0 : 0,
      revenue: Number(form.revenue) || 0,
      distance_km: Number(form.distance_km) || 0,
      base_fare: Number(form.base_fare) || 0,
      max_allowed_duration: form.trip_type === 'contract' ? 0 : Number(form.max_allowed_duration) || 0,
      overtime_rate: form.trip_type === 'contract' ? 0 : Number(form.overtime_rate) || 0,
      calculated_duration: form.trip_type === 'contract' ? 0 : Number(form.calculated_duration) || 0,
      vendor_name: form.assignment_mode === 'vendor' ? form.vendor_name : '',
      vendor_agreed_rate: Number(form.vendor_agreed_rate) || 0,
      vendor_payment_status: form.vendor_payment_status || 'unpaid',
      vendor_due_date: form.vendor_due_date || null,
      vendor_payment_notes: form.vendor_payment_notes || '',
      add_ons: addOns || []
    };
  };

  const createEntity = async (type, payload, flagKey, isContract = false) => {
    const setter = isContract ? setCCreating : setCreating;
    const flagSetter = isContract ? setCCreatedFlags : setCreatedFlags;
    setter(flagKey);
    try {
      await base44.entities[type].create(payload);
      const updated = await base44.entities[type].list('-created_date', 200);
      if (type === 'Client') setClients(updated || []);
      if (type === 'Vehicle') setVehicles(updated || []);
      if (type === 'Driver') setDrivers(updated || []);
      flagSetter((prev) => ({ ...prev, [flagKey]: true }));
    } catch (e) {} finally {setter(null);}
  };

  const monthlyRate = Number(contract.monthly_rate) || 0;

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      if (mode === 'trip') {
        const data = buildData(true);
        data.trip_number = '';
        data.is_draft = true;
        if (editTrip) {
          await updateTrip.mutateAsync({ id: editTrip.id, data });
        } else {
          await createTrip.mutateAsync(data);
        }
        onOpenChange(false);
        onSaved?.();
      }
    } finally {setSaving(false);}
  };

  const validateTrip = () => {
    const e = {};
    const hasAlphaNum = (s) => /[a-zA-Z0-9\u0600-\u06FF]/.test(s || '');
    if (!form.client_name?.trim()) e.client_name = 'Client is required';
    if (!form.from_location?.trim()) e.from_location = 'From location is required';else
    if (!hasAlphaNum(form.from_location)) e.from_location = 'Enter a valid location name';
    if (!form.to_location?.trim()) e.to_location = 'To location is required';else
    if (!hasAlphaNum(form.to_location)) e.to_location = 'Enter a valid location name';
    if (!form.vehicle_plate?.trim()) e.vehicle_plate = 'Vehicle is required';
    if (!form.driver_name?.trim()) e.driver_name = 'Driver is required';
    if (!form.trip_date) e.trip_date = 'Trip date is required';
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast({ title: 'Missing required fields', description: Object.values(e).join(' · '), variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (mode === 'trip' && !editTrip && !validateTrip()) return;
    setSaving(true);
    try {
      if (mode === 'trip') {
        const data = buildData(false);
        data.is_draft = false;
        if (!data.trip_number) {
          data.trip_number = generateTripNumber();
        }
        let savedTrip;
        if (editTrip) {savedTrip = await updateTrip.mutateAsync({ id: editTrip.id, data });} else
        {savedTrip = await createTrip.mutateAsync(data);}
        const tripId = savedTrip?.id || editTrip?.id;
        // Auto-create/update linked vendor transaction
        if (form.assignment_mode === 'vendor' && form.vendor_name && tripId) {
          const vtData = {
            vendor_name: form.vendor_name,
            trip_id: tripId,
            trip_number: data.trip_number,
            description: `Trip ${data.trip_number} — ${data.from_location} → ${data.to_location}`,
            amount: Number(form.vendor_agreed_rate) || 0,
            paid_amount: 0,
            payment_status: form.vendor_payment_status || 'unpaid',
            date: data.trip_date || todayStr(),
            due_date: form.vendor_due_date || null,
            notes: form.vendor_payment_notes || '',
            source: 'trip'
          };
          const existing = await base44.entities.VendorTransaction.filter({ trip_id: tripId }).catch(() => []);
          if (existing && existing.length > 0) {
            await base44.entities.VendorTransaction.update(existing[0].id, vtData).catch(() => {});
          } else {
            await base44.entities.VendorTransaction.create(vtData).catch(() => {});
          }
        } else if (editTrip && form.assignment_mode !== 'vendor' && editTrip.vendor_name) {
          await base44.entities.VendorTransaction.deleteMany({ trip_id: editTrip.id }).catch(() => {});
        }
        if (form.client_name && form.from_location && form.to_location && (Number(form.revenue) || 0) > 0) {
          const routeDesc = `${form.from_location} → ${form.to_location}`;
          if (!fixedCharges.find((c) => c.description === routeDesc)) {
            await base44.entities.FixedCharge.create({ client_name: form.client_name, description: routeDesc, amount: Number(form.revenue) || 0, frequency: 'one_time', status: 'active' }).catch(() => {});
          }
        }
      } else {
        const payload = {
          company_name: contract.company_name,
          start_date: contract.start_date,
          end_date: contract.end_date,
          auto_renewal: !!contract.auto_renewal,
          monthly_rate: Number(contract.monthly_rate) || 0,
          status: contract.status,
          vehicle_plate: contract.vehicle_plate,
          driver_name: contract.driver_name,
          notes: contract.notes,
          usage_date: contract.usage_date || null,
          usage_hours: Number(contract.usage_hours) || 0,
          usage_days: Number(contract.usage_days) || 0,
          per_hour_rate: Number(contract.per_hour_rate) || 0,
          per_day_rate: Number(contract.per_day_rate) || 0,
          add_ons: contractAddOns || []
        };
        let recordId;
        if (editContract) {
          await base44.entities.MonthlyContract.update(editContract.id, payload);
          recordId = editContract.id;
        } else {
          const created = await base44.entities.MonthlyContract.create(payload);
          recordId = created.id;
        }
      }
      onOpenChange(false);
      onSaved?.();
    } finally {setSaving(false);}
  };

  const fromSuggestions = [...new Set(tripsList.map((tr) => tr.from_location).filter(Boolean))];
  const toSuggestions = [...new Set(tripsList.map((tr) => tr.to_location).filter(Boolean))];
  const companyVehicles = vehicles.filter((v) => !v.vendor_name);
  const companyDrivers = drivers.filter((d) => !d.vendor_name);
  const vendorVehicles = form.vendor_name ? vehicles.filter((v) => v.vendor_name === form.vendor_name) : [];
  const vendorDrivers = form.vendor_name ? drivers.filter((d) => d.vendor_name === form.vendor_name) : [];
  const vehicleSuggestions = (form.assignment_mode === 'vendor' ? vendorVehicles : companyVehicles).map((v) => v.plate_number).filter(Boolean);
  const driverSuggestions = (form.assignment_mode === 'vendor' ? vendorDrivers : companyDrivers).map((d) => d.name).filter(Boolean);
  const clientSuggestions = clients.map((c) => c.name).filter(Boolean);
  const selectedClientData = clients.find((c) => c.name?.toLowerCase() === form.client_name?.toLowerCase());
  const availableContacts = selectedClientData ?
  selectedClientData.contact_persons?.length ?
  selectedClientData.contact_persons :
  selectedClientData.contact_person ? [{ name: selectedClientData.contact_person }] : [] :
  [];

  const isNewClient = form.client_name && !clientSuggestions.some((c) => c.toLowerCase() === form.client_name.toLowerCase());
  const isNewVehicle = form.vehicle_plate && !vehicleSuggestions.some((v) => v.toLowerCase() === form.vehicle_plate.toLowerCase());
  const isNewDriver = form.driver_name && !driverSuggestions.some((d) => d.toLowerCase() === form.driver_name.toLowerCase());

  const cIsNewClient = contract.company_name && !clientSuggestions.some((c) => c.toLowerCase() === contract.company_name.toLowerCase());
  const cIsNewVehicle = contract.vehicle_plate && !vehicleSuggestions.some((v) => v.toLowerCase() === contract.vehicle_plate.toLowerCase());
  const cIsNewDriver = contract.driver_name && !driverSuggestions.some((d) => d.toLowerCase() === contract.driver_name.toLowerCase());

  const calculatedDurationNum = Number(form.calculated_duration) || 0;
  const maxAllowedNum = Number(form.max_allowed_duration) || 0;
  const overtimeMetric = Math.max(0, calculatedDurationNum - maxAllowedNum);
  const extraCharges = overtimeMetric * (Number(form.overtime_rate) || 0);
  const isOvertime = overtimeMetric > 0 && form.load_datetime && form.offload_datetime;
  const inputCls = 'bg-white/[0.04] border-white/15 backdrop-blur-sm';

  const tripNumberOverridden = !!form.trip_number && form.trip_number !== autoTripNumber;
  const revenueOverridden = revenueOverride && Number(form.revenue) !== autoRevenue;

  const title = mode === 'trip' ?
  editTrip ? t('edit') : t('new_trip') :
  editContract ? t('edit_contract') : t('new_contract');

  const tripCtx = {
    form, update, setRevenueOverride, t, inputCls, errors,
    fromSuggestions, toSuggestions, vehicleSuggestions, driverSuggestions, clientSuggestions,
    serviceProviderVendors: vendors,
    allVehicles: vehicles, allDrivers: drivers, allClients: clients,
    isNewClient, isNewVehicle, isNewDriver,
    createdFlags, creating, createEntity: (type, payload, flagKey) => createEntity(type, payload, flagKey, false),
    fixedCharges, autoFilled,
    availableContacts,
    autoTripNumber, tripNumberOverridden,
    fileInputRef, handleFileUpload, uploading,
    isOvertime, overtimeMetric, extraCharges,
    revenueOverridden, autoRevenue,
    autoVendorRate, vendorRateOverridden: vendorRateOverride, setVendorRateOverride
  };

  const contractCtx = {
    contract, updateContract, t, inputCls,
    vehicleSuggestions, driverSuggestions, clientSuggestions,
    isNewClient: cIsNewClient, isNewVehicle: cIsNewVehicle, isNewDriver: cIsNewDriver,
    cCreatedFlags, cCreating, createContractEntity: (type, payload, flagKey) => createEntity(type, payload, flagKey, true),
    addOns: contractAddOns, setAddOns: setContractAddOns,
    allVehicles: vehicles, allDrivers: drivers, allClients: clients
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="bg-card/90 backdrop-blur-2xl border border-primary/25 w-[96vw] sm:w-[92vw] sm:max-w-4xl max-h-[88vh] sm:max-h-[82vh] overflow-hidden rounded-2xl shadow-2xl !top-[50%] !translate-y-[-50%] !left-[50%] !translate-x-[-50%] flex flex-col p-0 gap-0">
        <DialogHeader className="px-3 sm:px-5 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b border-border/50 flex-shrink-0 sticky top-0 z-20 bg-card/90 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="hud-icon-tile w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
                {mode === 'trip' ? <Truck className="w-4 h-4 sm:w-5 sm:h-5" /> : <FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
              </div>
              <div className="min-w-0">
                <DialogTitle className="font-display text-foreground text-base sm:text-lg leading-tight truncate">{title}</DialogTitle>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 hidden sm:block">
                  {mode === 'trip' ? 'Fill in trip details · Live calculation on the right' : 'Set up monthly contract terms'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <ModeToggle mode={mode} onChange={setMode} t={t} />
              <DialogClose
                  aria-label="Close"
                  className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-muted/60 hover:bg-primary/15 border border-border/60 hover:border-primary/40 text-muted-foreground hover:text-primary transition-all">
                  
                <X className="w-4 h-4" />
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Mobile calc bar — trip mode only, non-scrolling */}
        {mode === 'trip' &&
          <TripCalcMobileBar form={form} isOvertime={isOvertime} overtimeMetric={overtimeMetric} extraCharges={extraCharges} revenueOverridden={revenueOverridden} addOns={addOns} />
          }

        {/* Body: scrollable form with standalone floating calc panel in right column */}
        <div className="flex-1 overflow-y-auto premium-scroll">
        <div className="px-3 py-3 sm:px-5 sm:py-4 grid lg:grid-cols-[1fr_260px] gap-3 sm:gap-4 items-start">
          <div className="space-y-5">
            {mode === 'trip' ?
                <>
            <TripModeFields p={tripCtx} />
            <TripAddOnsSection addOns={addOns} setAddOns={setAddOns} />
            </> :

                <ContractModeFields p={contractCtx} />}
          </div>

          {/* Right column — frozen/sticky: Live Calculation + collapsible Location Picker */}
          <div className={cn("flex flex-col gap-5 lg:sticky lg:top-4", !mapCollapsed && "lg:max-h-[calc(82vh-170px)] lg:overflow-y-auto premium-scroll")}>
            {mode === 'trip' &&
                <div className="flex-shrink-0">
                <TripCalcPanel form={form} isOvertime={isOvertime} overtimeMetric={overtimeMetric} extraCharges={extraCharges} revenueOverridden={revenueOverridden} addOns={addOns} />
              </div>
                }
            {mode === 'trip' &&
                <div className="flex-shrink-0">
                <TripMapPanel
                    from={form.from_location}
                    to={form.to_location}
                    onSelectFrom={handleSelectFrom}
                    onSelectTo={handleSelectTo}
                    onRouteInfo={handleRouteInfo}
                    tripType={form.trip_type}
                    collapsed={mapCollapsed}
                    onToggleCollapse={handleToggleMapCollapse} />
                  
              </div>
                }
            {mode === 'contract' &&
                <ContractProfitPanel monthlyRate={monthlyRate} addOns={contractAddOns} endDate={contract.end_date} t={t} />
                }
            {mode === 'trip' && !mapCollapsed &&
                <div className="text-center text-[9px] opacity-20 select-none" aria-hidden>🚚</div>
                }
          </div>
        </div>

        {/* Contract mode mobile condensed bar */}
        {mode === 'contract' &&
            <div className="lg:hidden glass-card p-3 mb-4 grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="eyebrow mb-1">{t('monthly_rental')}</p>
              <p className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(monthlyRate)}</p>
            </div>
            <div>
              <p className="eyebrow mb-1">{t('total')}</p>
              <p className="text-sm font-bold tabular-nums text-emerald-400">{formatCurrency(monthlyRate)}</p>
            </div>
          </div>
            }
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 border-t border-border flex-shrink-0 sticky bottom-0 z-20 bg-card/90 backdrop-blur-2xl">
          <DialogClose className="inline-flex items-center justify-center gap-2 h-9 rounded-md px-4 py-2 text-sm font-medium border border-input bg-transparent hover:bg-accent hover:text-accent-foreground transition-colors">
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">{t('cancel')}</span>
          </DialogClose>
          <div className="flex-1" />
          {mode === 'trip' &&
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving} className="border-primary/30 text-primary hover:bg-primary/10 gap-2 h-9">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">Save Draft</span>
              <span className="sm:hidden">Draft</span>
            </Button>
            }
          <Button onClick={handleSubmit} disabled={saving} className="bg-primary hover:bg-primary/90 gap-2 h-9 min-w-[100px] sm:min-w-[120px]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            <span className="hidden sm:inline text-[hsl(var(--background))]">{saving ? t('loading') : t('submit')}</span>
            <span className="sm:hidden">{saving ? '...' : 'Submit'}</span>
          </Button>
        </div>
      </DialogContent>
      </Dialog>
      </>);


}