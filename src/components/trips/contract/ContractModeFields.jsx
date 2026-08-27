import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarClock, TrendingUp, UserCheck, FolderLock, Receipt, Truck, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import CreateNewCard from '../CreateNewCard';
import Section from '../Section';
import TripAddOnsSection from '../TripAddOnsSection';
import { Upload } from 'lucide-react';
import SearchableSelect from '@/components/common/SearchableSelect';
import GradientAvatar from '@/components/common/GradientAvatar';

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
  const {
    contract, updateContract, t, inputCls,
    vehicleSuggestions, driverSuggestions, clientSuggestions,
    isNewClient, isNewVehicle, isNewDriver,
    cCreatedFlags, cCreating, createContractEntity,
    addOns, setAddOns,
    allVehicles, allDrivers, allClients,
  } = p;

  const [manualCompanyMode, setManualCompanyMode] = useState(false);

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
      {/* Contract Details — Indigo */}
      <Section title={t('contract_period')} icon={CalendarClock} accent={ACCENT.contract}>
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
            <Input type="date" value={contract.start_date} onChange={(e) => updateContract('start_date', e.target.value)} className={`${inputCls} date-input-clean`} />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('end_date')}</Label>
            <Input type="date" value={contract.end_date} onChange={(e) => updateContract('end_date', e.target.value)} className={`${inputCls} date-input-clean`} />
          </div>
        </div>
        <div className="flex items-center justify-between glass-card p-3">
          <div>
            <p className="text-sm font-medium text-foreground">{t('auto_renewal')}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{t('auto_renewal_help')}</p>
          </div>
          <Switch checked={!!contract.auto_renewal} onCheckedChange={(v) => updateContract('auto_renewal', v)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('monthly_rate')} (AED)</Label>
            <Input type="number" value={contract.monthly_rate} onChange={(e) => updateContract('monthly_rate', e.target.value)} className={inputCls} />
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
      </Section>

      {/* Usage & Pricing — Emerald */}
      <Section title={t('usage_pricing') || 'Usage & Pricing'} icon={TrendingUp} accent={ACCENT.usage}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('usage_date') || 'Usage Date'}</Label>
            <Input type="date" value={contract.usage_date || ''} onChange={(e) => updateContract('usage_date', e.target.value)} className={`${inputCls} date-input-clean`} />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('usage_hours') || 'Hours'}</Label>
            <Input type="number" value={contract.usage_hours || ''} onChange={(e) => updateContract('usage_hours', e.target.value)} className={inputCls} placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('per_hour_rate') || 'Per Hour (AED)'}</Label>
            <Input type="number" value={contract.per_hour_rate || ''} onChange={(e) => updateContract('per_hour_rate', e.target.value)} className={inputCls} placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('usage_days') || 'Days'}</Label>
            <Input type="number" value={contract.usage_days || ''} onChange={(e) => updateContract('usage_days', e.target.value)} className={inputCls} placeholder="0" />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('per_day_rate') || 'Per Day (AED)'}</Label>
            <Input type="number" value={contract.per_day_rate || ''} onChange={(e) => updateContract('per_day_rate', e.target.value)} className={inputCls} placeholder="0" />
          </div>
        </div>
        {(() => {
          const hours = Number(contract.usage_hours) || 0;
          const days = Number(contract.usage_days) || 0;
          const perHour = Number(contract.per_hour_rate) || 0;
          const perDay = Number(contract.per_day_rate) || 0;
          const hourTotal = hours * perHour;
          const dayTotal = days * perDay;
          const total = hourTotal + dayTotal;
          if (!total) return null;
          return (
            <div className="calc-total-glow flex flex-wrap items-center justify-between gap-3 mt-1">
              <div className="flex items-center gap-3 text-[11px] text-white/70">
                {hourTotal > 0 && <span className="tabular-nums">{hours}h × {formatCurrency(perHour)} = <b className="text-white">{formatCurrency(hourTotal)}</b></span>}
                {dayTotal > 0 && <span className="tabular-nums">{days}d × {formatCurrency(perDay)} = <b className="text-white">{formatCurrency(dayTotal)}</b></span>}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="live-pulse-dot" />
                <span className="text-sm font-bold text-white tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>
          );
        })()}
      </Section>

      {/* Assignment — Violet */}
      <Section title="Assignment" icon={UserCheck} accent={ACCENT.assignment}>
        <div className="grid grid-cols-2 gap-3">
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