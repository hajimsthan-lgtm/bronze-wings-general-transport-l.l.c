import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import DatePicker from '@/components/common/DatePicker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarClock, TrendingUp, UserCheck, FolderLock, Receipt, Truck, Plus, Info, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { base44 } from '@/api/base44Client';
import CreateNewCard from '../CreateNewCard';
import Section from '../Section';
import TripAddOnsSection from '../TripAddOnsSection';
import { Upload } from 'lucide-react';
import SearchableSelect from '@/components/common/SearchableSelect';
import GradientAvatar from '@/components/common/GradientAvatar';
import DailyUsageLog from './DailyUsageLog';
import ContractCalcSummary from './ContractCalcSummary';
import { useI18n } from '@/lib/i18n';

const ACCENT = {
  contract: '99, 102, 241',
  usage: '16, 185, 129',
  assignment: '139, 92, 246',
  addons: '245, 158, 11',
  docs: '100, 116, 139',
};

const DOC_PLACEHOLDERS = [
  { key: 'doc_contract_agreement' },
  { key: 'doc_mulkiya' },
  { key: 'doc_insurance_policy' },
  { key: 'doc_vehicle_photos' },
];

export default function ContractModeFields({ p }) {
  const { t } = useI18n();
  const {
    contract, updateContract, t: _t, inputCls,
    vehicleSuggestions, driverSuggestions, clientSuggestions,
    isNewClient, isNewVehicle, isNewDriver,
    cCreatedFlags, cCreating, createContractEntity,
    addOns, setAddOns,
    allVehicles, allDrivers, allClients,
    companySettings, isEditing,
  } = p;

  const [manualCompanyMode, setManualCompanyMode] = useState(false);
  const [quickMode, setQuickMode] = useState(true);
  const [copiedFrom, setCopiedFrom] = useState(null);
  const manualEdits = useRef({});
  const syncedRef = useRef(false);

  // Sync quickMode from contract data on first load
  useEffect(() => {
    if (syncedRef.current) return;
    const hasDaily = Array.isArray(contract?.daily_usage) && contract.daily_usage.length > 0;
    if (hasDaily) {
      setQuickMode(false);
      syncedRef.current = true;
    }
  }, [contract?.daily_usage?.length]);

  // Wrapper that tracks manual edits
  const setField = (field, value, isManual = false) => {
    if (isManual) manualEdits.current[field] = true;
    updateContract(field, value);
  };

  const handleQuickModeToggle = (v) => {
    setQuickMode(v);
    if (v) {
      updateContract('daily_usage', []);
    } else {
      updateContract('avg_hours_per_day', '');
    }
  };

  // ── Auto-fill allowance_hours_per_day from CompanySettings ──
  useEffect(() => {
    if (isEditing) return;
    if (manualEdits.current.allowance_hours_per_day) return;
    const defaultHours = Number(companySettings?.default_allowance_hours_per_day);
    if (defaultHours > 0 && !contract.allowance_hours_per_day) {
      updateContract('allowance_hours_per_day', defaultHours);
    }
  }, [companySettings?.default_allowance_hours_per_day, isEditing]);



  // ── Auto-suggest extra_day_rate = contract_rate / allowance_days ──
  useEffect(() => {
    if (manualEdits.current.extra_day_rate) return;
    const rate = Number(contract.contract_rate) || Number(contract.monthly_rate) || 0;
    const days = Number(contract.allowance_days) || 0;
    if (rate > 0 && days > 0) {
      const suggested = Math.round((rate / days) * 100) / 100;
      if (Number(contract.extra_day_rate) !== suggested) {
        updateContract('extra_day_rate', suggested);
      }
    }
  }, [contract.contract_rate, contract.monthly_rate, contract.allowance_days]);

  // ── Auto-suggest extra_hour_rate = extra_day_rate / allowance_hours_per_day ──
  useEffect(() => {
    if (manualEdits.current.extra_hour_rate) return;
    const dayRate = Number(contract.extra_day_rate) || 0;
    const hoursPerDay = Number(contract.allowance_hours_per_day) || 0;
    if (dayRate > 0 && hoursPerDay > 0) {
      const suggested = Math.round((dayRate / hoursPerDay) * 100) / 100;
      if (Number(contract.extra_hour_rate) !== suggested) {
        updateContract('extra_hour_rate', suggested);
      }
    }
  }, [contract.extra_day_rate, contract.allowance_hours_per_day]);

  // ── Carry-forward from previous contract for same company ──
  useEffect(() => {
    if (isEditing) return;
    if (!contract.company_name) return;
    let cancelled = false;
    base44.entities.MonthlyContract.filter({ company_name: contract.company_name, status: 'active' })
      .then((contracts) => {
        if (cancelled || !contracts || contracts.length === 0) return;
        const sorted = [...contracts].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        const prev = sorted[0];
        if (!prev) return;
        setCopiedFrom(prev);
        if (!manualEdits.current.allowance_days && prev.allowance_days) updateContract('allowance_days', prev.allowance_days);
        if (!manualEdits.current.allowance_hours_per_day && prev.allowance_hours_per_day) updateContract('allowance_hours_per_day', prev.allowance_hours_per_day);
        if (!manualEdits.current.contract_rate && (prev.contract_rate || prev.monthly_rate)) updateContract('contract_rate', prev.contract_rate || prev.monthly_rate);
        if (!manualEdits.current.extra_day_rate && prev.extra_day_rate) updateContract('extra_day_rate', prev.extra_day_rate);
        if (!manualEdits.current.extra_hour_rate && prev.extra_hour_rate) updateContract('extra_hour_rate', prev.extra_hour_rate);
        if (prev.prorate_underuse) updateContract('prorate_underuse', prev.prorate_underuse);
      })
      .catch(() => {})
      .finally(() => {});
    return () => { cancelled = true; };
  }, [contract.company_name, isEditing]);

  // Company fleet only
  const availableVehicles = (allVehicles || [])
    .filter((v) => !v.vendor_name && (v.status === 'active' || v.plate_number === contract.vehicle_plate));
  const availableDrivers = (allDrivers || [])
    .filter((d) => !d.vendor_name && (d.status === 'active' || d.name === contract.driver_name));
  const selectedVehicle = allVehicles?.find((v) => v.plate_number === contract.vehicle_plate);
  const selectedDriver = allDrivers?.find((d) => d.name === contract.driver_name);
  const selectedCompany = allClients?.find((c) => c.name === contract.company_name);

  // Suggested values for display
  const suggestedExtraDayRate = (() => {
    const rate = Number(contract.contract_rate) || Number(contract.monthly_rate) || 0;
    const days = Number(contract.allowance_days) || 0;
    return rate > 0 && days > 0 ? Math.round((rate / days) * 100) / 100 : null;
  })();
  const suggestedExtraHourRate = (() => {
    const dayRate = Number(contract.extra_day_rate) || 0;
    const hoursPerDay = Number(contract.allowance_hours_per_day) || 0;
    return dayRate > 0 && hoursPerDay > 0 ? Math.round((dayRate / hoursPerDay) * 100) / 100 : null;
  })();

  return (
    <>
      {/* Contract Rate Period — Indigo */}
      <Section title={t('contract_rate_period') || t('contract_period')} icon={CalendarClock} accent={ACCENT.contract}>
        <div>
          <Label className="text-xs text-white/60 mb-1.5">{t('contract_company')}</Label>
          {manualCompanyMode ? (
            <>
              <Input list="contract-company-suggestions" value={contract.company_name} onChange={(e) => setField('company_name', e.target.value, true)} onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.target.blur(); } }} className={inputCls} placeholder="Type company name" />
              <datalist id="contract-company-suggestions">{clientSuggestions.map((c) => <option key={c} value={c} />)}</datalist>
              <button type="button" onClick={() => setManualCompanyMode(false)} className="text-[10px] text-primary mt-1 flex items-center gap-1 hover:underline">
                ← Select from list
              </button>
            </>
          ) : (
            <>
              <SearchableSelect
                value={contract.company_name || ''}
                onChange={(v) => { setField('company_name', v, true); setCopiedFrom(null); }}
                placeholder="Select company"
                renderLabel={(it) => (
                  <span className="flex items-center gap-2 truncate">
                    {selectedCompany?.image_url ? (
                      <img src={selectedCompany.image_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <GradientAvatar name={it.label} size="xs" />
                    )}
                    <span className="truncate">{it.label}</span>
                  </span>
                )}
                items={(allClients || []).filter((c) => c.status === 'active' || c.name === contract.company_name).map((c) => ({
                  value: c.name,
                  label: c.name,
                  search: c.contact_person ? ` ${c.contact_person}` : '',
                  content: (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {c.image_url ? (
                        <img src={c.image_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <GradientAvatar name={c.name} size="md" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {c.contact_person || 'No contact'} · ID: {(c.id || '').slice(0, 8)}
                        </p>
                      </div>
                    </div>
                  ),
                }))}
              />
              <button type="button" onClick={() => { setManualCompanyMode(true); setField('company_name', '', true); }} className="text-[10px] text-primary mt-1 flex items-center gap-1 hover:underline">
                <Plus className="w-3 h-3" /> New company not in list? Type manually
              </button>
            </>
          )}
          {isNewClient && (
            <CreateNewCard label="client" value={contract.company_name} created={cCreatedFlags.company} loading={cCreating === 'company'}
              onCreate={() => createContractEntity('Client', { name: contract.company_name }, 'company')} />
          )}
        </div>

        {/* Carry-forward note */}
        {copiedFrom && !isEditing && (
          <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <p className="text-[10px] text-violet-300">
              {t('copied_from') || 'Copied from'} {copiedFrom.start_date ? new Date(copiedFrom.start_date).toLocaleDateString() : ''} → {copiedFrom.end_date ? new Date(copiedFrom.end_date).toLocaleDateString() : ''}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('start_date')}</Label>
            <DatePicker value={contract.start_date} onChange={(v) => setField('start_date', v, true)} className={`${inputCls} date-input-clean`} />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('end_date')}</Label>
            <DatePicker value={contract.end_date} onChange={(v) => setField('end_date', v, true)} className={`${inputCls} date-input-clean`} />
          </div>
        </div>
        <div className="flex items-center justify-between glass-card p-3">
          <div>
            <p className="text-sm font-medium text-foreground">{t('auto_renewal')}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t('auto_renewal_help')}</p>
          </div>
          <Switch checked={!!contract.auto_renewal} onCheckedChange={(v) => updateContract('auto_renewal', v)} />
        </div>

        {/* Allowance explainer */}
        <div className="flex items-start gap-2 rounded-lg bg-white/[0.03] border border-white/8 px-3 py-2">
          <Info className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-white/50 leading-relaxed">
            {t('allowance_explainer') || 'This is what the base price includes — usage beyond this is charged extra'}
          </p>
        </div>

        {/* Allowance fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('contract_rate') || 'Contract Rate (AED)'}</Label>
            <Input type="number" value={contract.contract_rate ?? contract.monthly_rate ?? ''} onChange={(e) => setField('contract_rate', e.target.value, true)} className={inputCls} placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('allowance_days') || 'Allowance Days'}</Label>
            <Input type="number" value={contract.allowance_days ?? ''} onChange={(e) => setField('allowance_days', e.target.value, true)} className={inputCls} placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('allowance_hours_per_day') || 'Allowance Hours / Day'}</Label>
            <Input type="number" value={contract.allowance_hours_per_day ?? ''} onChange={(e) => setField('allowance_hours_per_day', e.target.value, true)} className={inputCls} placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">
              {t('extra_day_rate') || 'Extra Day Rate (AED)'}
              {suggestedExtraDayRate != null && !manualEdits.current.extra_day_rate && (
                <span className="ml-1 text-[9px] text-indigo-400/70">≈ {suggestedExtraDayRate}</span>
              )}
            </Label>
            <Input type="number" value={contract.extra_day_rate ?? ''} onChange={(e) => setField('extra_day_rate', e.target.value, true)} className={inputCls} placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">
              {t('extra_hour_rate') || 'Extra Hour Rate (AED)'}
              {suggestedExtraHourRate != null && !manualEdits.current.extra_hour_rate && (
                <span className="ml-1 text-[9px] text-indigo-400/70">≈ {suggestedExtraHourRate}</span>
              )}
            </Label>
            <Input type="number" value={contract.extra_hour_rate ?? ''} onChange={(e) => setField('extra_hour_rate', e.target.value, true)} className={inputCls} placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('contract_status')}</Label>
            <Select value={contract.status} onValueChange={(v) => updateContract('status', v)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="expired">{t('expired')}</SelectItem>
                <SelectItem value="terminated">{t('terminated')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Prorate underuse toggle */}
        <div className="flex items-center justify-between glass-card p-3">
          <div>
            <p className="text-sm font-medium text-foreground">{t('prorate_underuse') || 'Prorate Under-usage'}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t('prorate_underuse_help') || 'Credit unused days when actual usage is below allowance'}</p>
          </div>
          <Switch checked={!!contract.prorate_underuse} onCheckedChange={(v) => updateContract('prorate_underuse', v)} />
        </div>
      </Section>

      {/* Actual Usage — Emerald */}
      <Section title={t('actual_usage') || 'Actual Usage'} icon={TrendingUp} accent={ACCENT.usage}>
        <div className="flex items-center gap-2 glass-card p-2.5 w-full">
          <Switch checked={quickMode} onCheckedChange={handleQuickModeToggle} />
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{t('quick_mode') || 'Quick Mode (Average)'}</p>
            <p className="text-[10px] text-muted-foreground truncate">{quickMode ? 'Same hours for every day' : 'Log hours per day'}</p>
          </div>
        </div>
        {quickMode ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-white/60 mb-1.5">Used Days</Label>
              <Input type="number" value={contract.actual_days_used ?? ''} onChange={(e) => setField('actual_days_used', e.target.value, true)} className={inputCls} placeholder="0" />
              <p className="text-[10px] text-white/40 mt-1">Days vehicle was used</p>
            </div>
            <div>
              <Label className="text-xs text-white/60 mb-1.5">{t('avg_hours_per_day') || 'Avg Hours / Day'}</Label>
              <Input type="number" value={contract.avg_hours_per_day ?? ''} onChange={(e) => setField('avg_hours_per_day', e.target.value, true)} className={inputCls} placeholder="0" />
              <p className="text-[10px] text-amber-400/70 mt-1 italic">{t('avg_hours_help') || 'Approximation — can\'t detect which specific days exceeded the cap'}</p>
            </div>
          </div>
        ) : (
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('daily_usage_log') || 'Daily Hour Log'}</Label>
            <DailyUsageLog
              dailyUsage={Array.isArray(contract.daily_usage) ? contract.daily_usage : []}
              onChange={(v) => updateContract('daily_usage', v)}
              inputCls={inputCls}
              startDate={contract.start_date}
              endDate={contract.end_date}
              allowanceHoursPerDay={contract.allowance_hours_per_day}
            />
          </div>
        )}
        <ContractCalcSummary contract={contract} />
      </Section>

      {/* Assignment — Violet */}
      <Section title="Assignment" icon={UserCheck} accent={ACCENT.assignment}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('assigned_driver')}</Label>
            <SearchableSelect
              value={contract.driver_name || ''}
              onChange={(v) => updateContract('driver_name', v)}
              placeholder="Select driver"
              renderLabel={(it) => (
                <span className="flex items-center gap-2 truncate">
                  {selectedDriver?.image_url ? (
                    <img src={selectedDriver.image_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <GradientAvatar name={it.label} size="xs" />
                  )}
                  <span className="truncate">{it.label}</span>
                </span>
              )}
              items={availableDrivers.map((d) => ({
                value: d.name,
                label: d.name,
                search: d.phone ? ` ${d.phone}` : '',
                content: (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {d.image_url ? (
                      <img src={d.image_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <GradientAvatar name={d.name} size="md" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {d.phone || 'No phone'} · ID: {(d.id || '').slice(0, 8)}
                      </p>
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('chiller_van')}</Label>
            <SearchableSelect
              value={contract.vehicle_plate || ''}
              onChange={(v) => updateContract('vehicle_plate', v)}
              placeholder="Select vehicle"
              renderLabel={(it) => (
                <span className="flex items-center gap-2 truncate">
                  {selectedVehicle?.image_url ? (
                    <img src={selectedVehicle.image_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-3 h-3" />
                    </span>
                  )}
                  <span className="truncate">{it.label}</span>
                </span>
              )}
              items={availableVehicles.map((v) => ({
                value: v.plate_number,
                label: v.plate_number,
                search: v.make && v.model ? ` ${v.make} ${v.model}` : (v.make ? ` ${v.make}` : ''),
                content: (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0 overflow-hidden">
                      {v.image_url ? (
                        <img src={v.image_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Truck className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{v.plate_number}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {[v.make, v.model].filter(Boolean).join(' ') || 'No model'} · ID: {(v.id || '').slice(0, 8)}
                      </p>
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
        </div>
      </Section>

      {/* Add-on Payments — Amber */}
      <Section title="Add-on Payments" icon={Receipt} accent={ACCENT.addons}>
        <TripAddOnsSection addOns={addOns} setAddOns={setAddOns} />
      </Section>

      {/* Document Vault — Slate */}
      <Section title={t('document_vault')} icon={FolderLock} accent={ACCENT.docs}>
        <div className="grid grid-cols-2 gap-3">
          {DOC_PLACEHOLDERS.map((d) => (
            <button
              key={d.key}
              type="button"
              className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl border border-dashed border-white/15 bg-white/[0.02] hover:border-primary/40 hover:bg-primary/[0.04] transition-all"
            >
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground text-center px-2 leading-tight">{t(d.key)}</span>
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}