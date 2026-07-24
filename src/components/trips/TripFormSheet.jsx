import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { useTripCreate, useTripUpdate } from '@/hooks/useEntityQueries';
import ModeToggle from './ModeToggle';
import TripModeFields from './TripModeFields';
import TripCalcPanel from './TripCalcPanel';
import ContractModeFields from './contract/ContractModeFields';
import ContractProfitPanel from './contract/ContractProfitPanel';
import TripMapPanel from './TripMapPanel';
import { CONTRACT_CATS } from './contract/contractCats';

const DEFAULT_FORM = {
  from_location: '', to_location: '', vehicle_plate: '', driver_name: '',
  client_name: '', trip_type: 'one_way', delivery_note_number: '', delivery_note_url: '',
  hours: '', return_trip_number: '', payment_status: 'corporate_credit',
  trip_date: new Date().toISOString().split('T')[0],
  load_datetime: '', offload_datetime: '', trip_number: '',
  status: 'scheduled', revenue: '', distance_km: '', notes: '', contact_person: '',
  duration_unit: 'hours', calculated_duration: '', base_fare: '', max_allowed_duration: '', overtime_rate: '',
};

const DEFAULT_CONTRACT = {
  company_name: '', start_date: '', end_date: '', auto_renewal: false,
  monthly_rate: '', status: 'active', vehicle_plate: '', driver_name: '', notes: '',
};

const todayStr = () => new Date().toISOString().split('T')[0];

export default function TripFormSheet({ open, onOpenChange, editTrip, editContract, onSaved, initialMode }) {
  const { t } = useI18n();
  const createTrip = useTripCreate();
  const updateTrip = useTripUpdate();
  const [mode, setMode] = useState('trip');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tripsList, setTripsList] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [clients, setClients] = useState([]);
  const [fixedCharges, setFixedCharges] = useState([]);
  const [autoFilled, setAutoFilled] = useState(false);
  const [createdFlags, setCreatedFlags] = useState({ client: false, vehicle: false, driver: false });
  const [cCreatedFlags, setCCreatedFlags] = useState({ company: false, vehicle: false, driver: false });
  const [creating, setCreating] = useState(null);
  const [cCreating, setCCreating] = useState(null);
  const [revenueOverride, setRevenueOverride] = useState(false);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });

  // Contract state
  const [contract, setContract] = useState({ ...DEFAULT_CONTRACT });
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({ date: todayStr(), amount: '', description: '', liters: '', price_per_liter: '' });
  const [activeCat, setActiveCat] = useState('fuel');

  useEffect(() => {
    if (open) {
      Promise.all([
        base44.entities.Trip.list('-created_date', 200).catch(() => []),
        base44.entities.Vehicle.list('-created_date', 200).catch(() => []),
        base44.entities.Driver.list('-created_date', 200).catch(() => []),
        base44.entities.Client.list('-created_date', 200).catch(() => []),
      ]).then(([trips, vehs, drvs, clnts]) => {
        setTripsList(trips || []);
        setVehicles(vehs || []);
        setDrivers(drvs || []);
        setClients(clnts || []);
      });
    }
  }, [open]);

  useEffect(() => {
    if (open) {
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
        });
        setCCreatedFlags({ company: false, vehicle: false, driver: false });
        base44.entities.ContractExpense.filter({ contract_id: editContract.id })
          .then((rows) => setExpenses((rows || []).map((r) => ({ ...r, id: r.id }))))
          .catch(() => setExpenses([]));
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
        });
      } else {
        setMode(initialMode || 'trip');
        setForm({ ...DEFAULT_FORM, trip_date: todayStr() });
        setContract({ ...DEFAULT_CONTRACT });
        setExpenses([]);
        setExpenseForm({ date: todayStr(), amount: '', description: '', liters: '', price_per_liter: '' });
        setActiveCat('fuel');
        setCreatedFlags({ client: false, vehicle: false, driver: false });
        setCCreatedFlags({ company: false, vehicle: false, driver: false });
      }
    }
  }, [editTrip, editContract, open]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'client_name') setCreatedFlags((prev) => ({ ...prev, client: false }));
    if (field === 'vehicle_plate') setCreatedFlags((prev) => ({ ...prev, vehicle: false }));
    if (field === 'driver_name') setCreatedFlags((prev) => ({ ...prev, driver: false }));
  };

  const updateContract = (field, value) => {
    setContract((prev) => ({ ...prev, [field]: value }));
    if (field === 'company_name') setCCreatedFlags((prev) => ({ ...prev, company: false }));
    if (field === 'vehicle_plate') setCCreatedFlags((prev) => ({ ...prev, vehicle: false }));
    if (field === 'driver_name') setCCreatedFlags((prev) => ({ ...prev, driver: false }));
  };

  useEffect(() => {
    if (form.client_name) {
      base44.entities.FixedCharge.filter({ client_name: form.client_name, status: 'active' })
        .then((charges) => setFixedCharges(charges || []))
        .catch(() => setFixedCharges([]));
    } else { setFixedCharges([]); }
  }, [form.client_name]);

  useEffect(() => {
    if (form.client_name && form.from_location && form.to_location && fixedCharges.length > 0) {
      const routeDesc = `${form.from_location} → ${form.to_location}`;
      const match = fixedCharges.find((c) => c.description === routeDesc);
      if (match) { update('base_fare', match.amount); setAutoFilled(true); }
      else { setAutoFilled(false); }
    } else { setAutoFilled(false); }
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('delivery_note_url', file_url);
    } catch (err) {} finally { setUploading(false); }
  };

  const generateTripNumber = () => {
    const dateSource = form.load_datetime || (form.trip_date + 'T00:00');
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

  const autoTripNumber = editTrip ? (editTrip.trip_number || '') : generateTripNumber();

  const buildData = (isDraft = false) => ({
    ...form,
    is_draft: isDraft,
    trip_number: form.trip_number || autoTripNumber,
    trip_date: form.load_datetime
      ? form.load_datetime.split('T')[0]
      : (form.offload_datetime ? form.offload_datetime.split('T')[0] : todayStr()),
    hours: form.trip_type === 'hourly' ? (Number(form.hours) || 0) : 0,
    revenue: Number(form.revenue) || 0,
    distance_km: Number(form.distance_km) || 0,
    base_fare: Number(form.base_fare) || 0,
    max_allowed_duration: Number(form.max_allowed_duration) || 0,
    overtime_rate: Number(form.overtime_rate) || 0,
    calculated_duration: Number(form.calculated_duration) || 0,
  });

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
    } catch (e) {} finally { setter(null); }
  };

  // Expense tracker
  const addExpense = () => {
    const amt = Number(expenseForm.amount) || 0;
    if (!amt && !expenseForm.description) return;
    setExpenses((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        category: activeCat,
        date: expenseForm.date || todayStr(),
        amount: amt,
        description: expenseForm.description,
        liters: activeCat === 'fuel' ? (Number(expenseForm.liters) || 0) : 0,
        price_per_liter: activeCat === 'fuel' ? (Number(expenseForm.price_per_liter) || 0) : 0,
      },
    ]);
    setExpenseForm({ date: todayStr(), amount: '', description: '', liters: '', price_per_liter: '' });
  };
  const removeExpense = (id) => setExpenses((prev) => prev.filter((e) => e.id !== id));

  const catTotals = CONTRACT_CATS.map((c) => ({
    ...c,
    label: t(c.labelKey),
    amount: expenses.filter((e) => e.category === c.key).reduce((s, e) => s + (Number(e.amount) || 0), 0),
  }));
  const totalExpenses = catTotals.reduce((s, c) => s + c.amount, 0);
  const monthlyRate = Number(contract.monthly_rate) || 0;
  const netProfit = monthlyRate - totalExpenses;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      if (mode === 'trip') {
        const data = buildData(false);
        if (editTrip) await updateTrip.mutateAsync({ id: editTrip.id, data });
        else await createTrip.mutateAsync(data);
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
        };
        let recordId;
        if (editContract) {
          await base44.entities.MonthlyContract.update(editContract.id, payload);
          recordId = editContract.id;
          await base44.entities.ContractExpense.deleteMany({ contract_id: recordId }).catch(() => {});
        } else {
          const created = await base44.entities.MonthlyContract.create(payload);
          recordId = created.id;
        }
        if (expenses.length) {
          await base44.entities.ContractExpense.bulkCreate(
            expenses.map((e) => ({ category: e.category, date: e.date, amount: e.amount, description: e.description, liters: e.liters, price_per_liter: e.price_per_liter, contract_id: recordId }))
          );
        }
      }
      onOpenChange(false);
      onSaved?.();
    } finally { setSaving(false); }
  };

  const fromSuggestions = [...new Set(tripsList.map((tr) => tr.from_location).filter(Boolean))];
  const toSuggestions = [...new Set(tripsList.map((tr) => tr.to_location).filter(Boolean))];
  const vehicleSuggestions = vehicles.map((v) => v.plate_number).filter(Boolean);
  const driverSuggestions = drivers.map((d) => d.name).filter(Boolean);
  const clientSuggestions = clients.map((c) => c.name).filter(Boolean);
  const selectedClientData = clients.find((c) => c.name?.toLowerCase() === form.client_name?.toLowerCase());
  const availableContacts = selectedClientData
    ? (selectedClientData.contact_persons?.length
        ? selectedClientData.contact_persons
        : (selectedClientData.contact_person ? [{ name: selectedClientData.contact_person }] : []))
    : [];

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

  const title = mode === 'trip'
    ? (editTrip ? t('edit') : t('new_trip'))
    : (editContract ? t('edit_contract') : t('new_contract'));

  const tripCtx = {
    form, update, setRevenueOverride, t, inputCls,
    fromSuggestions, toSuggestions, vehicleSuggestions, driverSuggestions, clientSuggestions,
    isNewClient, isNewVehicle, isNewDriver,
    createdFlags, creating, createEntity: (type, payload, flagKey) => createEntity(type, payload, flagKey, false),
    fixedCharges, autoFilled,
    availableContacts,
    autoTripNumber, tripNumberOverridden,
    fileInputRef, handleFileUpload, uploading,
    isOvertime, overtimeMetric, extraCharges,
    revenueOverridden, autoRevenue,
  };

  const contractCtx = {
    contract, updateContract, t, inputCls,
    vehicleSuggestions, driverSuggestions, clientSuggestions,
    isNewClient: cIsNewClient, isNewVehicle: cIsNewVehicle, isNewDriver: cIsNewDriver,
    cCreatedFlags, cCreating, createContractEntity: (type, payload, flagKey) => createEntity(type, payload, flagKey, true),
    expenses, expenseForm, setExpenseForm, addExpense, removeExpense,
    activeCat, setActiveCat, catTotals,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/80 backdrop-blur-2xl border border-white/[0.12] max-w-5xl max-h-[92vh] overflow-y-auto p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle className="font-display text-foreground text-lg">{title}</DialogTitle>
            <ModeToggle mode={mode} onChange={setMode} t={t} />
          </div>
        </DialogHeader>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="space-y-5">
            {mode === 'trip'
              ? <TripModeFields p={tripCtx} />
              : <ContractModeFields p={contractCtx} />}
          </div>

          <div className="space-y-5">
            {mode === 'trip' && (
              <TripMapPanel
                from={form.from_location}
                to={form.to_location}
                onSelectFrom={(v) => update('from_location', v)}
                onSelectTo={(v) => update('to_location', v)}
              />
            )}
            {mode === 'trip'
              ? <TripCalcPanel form={form} isOvertime={isOvertime} overtimeMetric={overtimeMetric} extraCharges={extraCharges} revenueOverridden={revenueOverridden} />
              : <ContractProfitPanel monthlyRate={monthlyRate} totalExpenses={totalExpenses} catTotals={catTotals} endDate={contract.end_date} t={t} />}
          </div>
        </div>

        {/* Mobile condensed bar */}
        {mode === 'trip' ? (
          <div className="lg:hidden glass-card p-4 space-y-2 mb-4">
            <p className="eyebrow">Live Calculation</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Fare</span>
              <span className="font-medium tabular-nums">{formatCurrency(Number(form.base_fare) || 0)}</span>
            </div>
            {isOvertime && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overtime</span>
                <span className="font-medium tabular-nums text-rose-300">+{formatCurrency(extraCharges)}</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-2 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-foreground">Revenue</span>
              <span className={`text-lg font-bold tabular-nums font-display ${revenueOverridden ? 'text-red-400' : 'text-primary'}`}>{formatCurrency(Number(form.revenue) || 0)}</span>
            </div>
          </div>
        ) : (
          <div className="lg:hidden glass-card p-3 mb-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="eyebrow mb-1">{t('monthly_rental')}</p>
              <p className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(monthlyRate)}</p>
            </div>
            <div>
              <p className="eyebrow mb-1">{t('total_expenses')}</p>
              <p className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(totalExpenses)}</p>
            </div>
            <div>
              <p className="eyebrow mb-1">{t('net_profit')}</p>
              <p className={`text-sm font-bold tabular-nums ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(netProfit)}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">{t('cancel')}</Button>
          <div className="flex-1" />
          <Button onClick={handleSubmit} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? t('loading') : t('submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}