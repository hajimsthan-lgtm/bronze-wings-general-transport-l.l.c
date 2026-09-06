import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import DatePicker from '@/components/common/DatePicker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarClock, TrendingUp, UserCheck, FolderLock, Receipt, Truck, Plus, Info } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import CreateNewCard from '../CreateNewCard';
import Section from '../Section';
import TripAddOnsSection from '../TripAddOnsSection';
import { Upload } from 'lucide-react';
import SearchableSelect from '@/components/common/SearchableSelect';
import GradientAvatar from '@/components/common/GradientAvatar';
import DailyUsageLog from './DailyUsageLog';
import ContractCalcSummary from './ContractCalcSummary';
import { useI18n } from '@/lib/i18n';

const initials = (name) => (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

const DOC_PLACEHOLDERS = [
  { key: 'doc_contract_agreement' },
  { key: 'doc_mulkiya' },
  { key: 'doc_insurance_policy' },
  { key: 'doc_vehicle_photos' },
];

// Light professional accent colors per section
const ACCENT = {
  contract: '99, 102, 241',    // indigo
  usage: '16, 185, 129',       // emerald
  assignment: '139, 92, 246',  // violet
  addons: '245, 158, 11',     // amber
  docs: '100, 116, 139',      // slate
};

export default function ContractModeFields({ p }) {
  const { t } = useI18n();
  const {
    contract, updateContract, t: _t, inputCls,
    vehicleSuggestions, driverSuggestions, clientSuggestions,
    isNewClient, isNewVehicle, isNewDriver,
    cCreatedFlags, cCreating, createContractEntity,
    addOns, setAddOns,
    allVehicles, allDrivers, allClients,
  } = p;

  const [manualCompanyMode, setManualCompanyMode] = useState(false);
  const [quickMode, setQuickMode] = useState(true);
  const syncedRef = useRef(false);

  // Sync quickMode from contract data on first load (when opening for edit)
  useEffect(() => {
    if (syncedRef.current) return;
    const hasDaily = Array.isArray(contract?.daily_usage) && contract.daily_usage.length > 0;
    if (hasDaily) {
      setQuickMode(false);
      syncedRef.current = true;
    }
  }, [contract?.daily_usage?.length]);

  const handleQuickModeToggle = (v) => {
    setQuickMode(v);
    if (v) {
      // Switching to quick mode — clear daily entries
      updateContract('daily_usage', []);
    } else {
      // Switching to daily log mode — clear avg
      updateContract('avg_hours_per_day', '');
    }
  };

  // Company fleet only — strict separation from vendor vehicles/drivers
  const availableVehicles = (allVehicles || [])
    .filter((v) => !v.vendor_name && (v.status === 'active' || v.plate_number === contract.vehicle_plate));
  const availableDrivers = (allDrivers || [])
    .filter((d) => !d.vendor_name && (d.status === 'active' || d.name === contract.driver_name));

  const selectedVehicle = allVehicles?.find((v) => v.plate_number === contract.vehicle_plate);
  const selectedDriver = allDrivers?.find((d) => d.name === contract.driver_name);
  const selectedCompany = allClients?.find((c) => c.name === contract.company_name);

  return (
    <>
      {/* Contract Rate Period — Indigo */}
      <Section title={t('contract_rate_period') || t('contract_period')} icon={CalendarClock} accent={ACCENT.contract}>
        <div>
          <Label className="text-xs text-white/60 mb-1.5">{t('contract_company')}</Label>
          {manualCompanyMode ? (
            <>
              <Input list="contract-company-suggestions" value={contract.company_name} onChange={(e) => updateContract('company_name', e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.target.blur(); } }} className={inputCls} placeholder="Type company name" />
              <datalist id="contract-company-suggestions">{clientSuggestions.map((c) => <option key={c} value={c} />)}</datalist>
              <button type="button" onClick={() => setManualCompanyMode(false)} className="text-[10px] text-primary mt-1 flex items-center gap-1 hover:underline">
                ← Select from list
              </button>
            </>
          ) : (
            <>
              <SearchableSelect
                value={contract.company_name || ''}
                onChange={(v) => updateContract('company_name', v)}
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
                      {c.status && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${
                          c.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'
                        }`}>
                          {c.status}
                        </span>
                      )}
                    </div>
                  ),
                }))}
              />
              <button type="button" onClick={() => { setManualCompanyMode(true); updateContract('company_name', ''); }} className="text-[10px] text-primary mt-1 flex items-center gap-1 hover:underline">
                <Plus className="w-3 h-3" /> New company not in list? Type manually
              </button>
            </>
          )}
          {isNewClient && (
            <CreateNewCard label="client" value={contract.company_name} created={cCreatedFlags.company} loading={cCreating === 'company'}
              onCreate={() => createContractEntity('Client', { name: contract.company_name }, 'company')} />
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('start_date')}</Label>
            <DatePicker value={contract.start_date} onChange={(v) => updateContract('start_date', v)} className={`${inputCls} date-input-clean`} />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('end_date')}</Label>
            <DatePicker value={contract.end_date} onChange={(v) => updateContract('end_date', v)} className={`${inputCls} date-input-clean`} />
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
            <Input type="number" value={contract.contract_rate ?? contract.monthly_rate ?? ''} onChange={(e) => updateContract('contract_rate', e.target.value)} className={inputCls} placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('allowance_days') || 'Allowance Days'}</Label>
            <Input type="number" value={contract.allowance_days ?? ''} onChange={(e) => updateContract('allowance_days', e.target.value)} className={inputCls} placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('allowance_hours_per_day') || 'Allowance Hours / Day'}</Label>
            <Input type="number" value={contract.allowance_hours_per_day ?? ''} onChange={(e) => updateContract('allowance_hours_per_day', e.target.value)} className={inputCls} placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('extra_day_rate') || 'Extra Day Rate (AED)'}</Label>
            <Input type="number" value={contract.extra_day_rate ?? ''} onChange={(e) => updateContract('extra_day_rate', e.target.value)} className={inputCls} placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('extra_hour_rate') || 'Extra Hour Rate (AED)'}</Label>
            <Input type="number" value={contract.extra_hour_rate ?? ''} onChange={(e) => updateContract('extra_hour_rate', e.target.value)} className={inputCls} placeholder="0" />
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('actual_days_used') || 'Actual Days Used'}</Label>
            <Input type="number" value={contract.actual_days_used ?? ''} onChange={(e) => updateContract('actual_days_used', e.target.value)} className={inputCls} placeholder="0" />
          </div>
          <div className="flex items-end">
            <div className="flex items-center gap-2 glass-card p-2.5 w-full h-full">
              <Switch checked={quickMode} onCheckedChange={handleQuickModeToggle} />
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{t('quick_mode') || 'Quick Mode (Average)'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{quickMode ? 'Same hours for every day' : 'Log hours per day'}</p>
              </div>
            </div>
          </div>
        </div>
        {quickMode ? (
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('avg_hours_per_day') || 'Avg Hours / Day'}</Label>
            <Input type="number" value={contract.avg_hours_per_day ?? ''} onChange={(e) => updateContract('avg_hours_per_day', e.target.value)} className={inputCls} placeholder="0" />
            <p className="text-[10px] text-amber-400/70 mt-1 italic">Approximation — can't detect which specific days exceeded the cap</p>
          </div>
        ) : (
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('daily_usage_log') || 'Daily Hour Log'}</Label>
            <DailyUsageLog
              dailyUsage={Array.isArray(contract.daily_usage) ? contract.daily_usage : []}
              onChange={(v) => updateContract('daily_usage', v)}
              inputCls={inputCls}
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
                    {d.status && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${
                        d.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'
                      }`}>
                        {d.status}
                      </span>
                    )}
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
                    {v.status && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${
                        v.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'
                      }`}>
                        {v.status}
                      </span>
                    )}
                  </div>
                ),
              }))}
            />
          </div>
        </div>
      </Section>

      {/* Add-on Payments — Amber (same as per-trip) */}
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