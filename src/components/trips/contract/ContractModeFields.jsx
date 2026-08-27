import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarClock, TrendingUp, UserCheck, FolderLock, Receipt } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import CreateNewCard from '../CreateNewCard';
import Section from '../Section';
import TripAddOnsSection from '../TripAddOnsSection';
import { Upload } from 'lucide-react';
import SearchableSelect from '@/components/common/SearchableSelect';

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
    allVehicles, allDrivers,
  } = p;

  // Company fleet only — strict separation from vendor vehicles/drivers
  const availableVehicles = (allVehicles || [])
    .filter((v) => !v.vendor_name && (v.status === 'active' || v.plate_number === contract.vehicle_plate));
  const availableDrivers = (allDrivers || [])
    .filter((d) => !d.vendor_name && (d.status === 'active' || d.name === contract.driver_name));

  return (
    <>
      {/* Contract Details — Indigo */}
      <Section title={t('contract_period')} icon={CalendarClock} accent={ACCENT.contract}>
        <div>
          <Label className="text-xs text-white/60 mb-1.5">{t('contract_company')}</Label>
          <Input list="contract-company-suggestions" value={contract.company_name} onChange={(e) => updateContract('company_name', e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.target.blur(); } }} className={inputCls} />
          <datalist id="contract-company-suggestions">{clientSuggestions.map((c) => <option key={c} value={c} />)}</datalist>
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
              items={availableVehicles.map((v) => ({
                value: v.plate_number,
                label: v.plate_number,
                search: v.make && v.model ? ` ${v.make} ${v.model}` : (v.make ? ` ${v.make}` : ''),
                content: (
                  <span className="truncate">
                    {v.plate_number}{v.make && v.model ? <span className="text-muted-foreground"> · {v.make} {v.model}</span> : ''}
                  </span>
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
              items={availableDrivers.map((d) => ({
                value: d.name,
                label: d.name,
                search: d.phone ? ` ${d.phone}` : '',
                content: (
                  <span className="truncate">
                    {d.name}{d.phone ? <span className="text-muted-foreground"> · {d.phone}</span> : ''}
                  </span>
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