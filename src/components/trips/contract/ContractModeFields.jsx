import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Upload } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import CreateNewCard from '../CreateNewCard';
import Section from '../Section';
import { CONTRACT_CATS } from './contractCats';

const DOC_PLACEHOLDERS = [
  { key: 'doc_contract_agreement' },
  { key: 'doc_mulkiya' },
  { key: 'doc_insurance_policy' },
  { key: 'doc_vehicle_photos' },
];

export default function ContractModeFields({ p }) {
  const {
    contract, updateContract, t, inputCls,
    vehicleSuggestions, driverSuggestions, clientSuggestions,
    isNewClient, isNewVehicle, isNewDriver,
    cCreatedFlags, cCreating, createContractEntity,
    expenses, expenseForm, setExpenseForm, addExpense, removeExpense,
    activeCat, setActiveCat, catTotals,
  } = p;

  const activeMeta = CONTRACT_CATS.find((c) => c.key === activeCat) || CONTRACT_CATS[0];

  return (
    <>
      {/* Contract Details */}
      <Section title={t('contract_period')}>
        <div>
          <Label className="text-xs text-white/60 mb-1.5">{t('contract_company')}</Label>
          <Input list="contract-company-suggestions" value={contract.company_name} onChange={(e) => updateContract('company_name', e.target.value)} className={inputCls} />
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

      {/* Usage & Pricing */}
      <Section title={t('usage_pricing') || 'Usage & Pricing'}>
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

      {/* Assignment */}
      <Section title="Assignment">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('chiller_van')}</Label>
            <Input list="contract-vehicle-suggestions" value={contract.vehicle_plate} onChange={(e) => updateContract('vehicle_plate', e.target.value)} placeholder="A 12345" className={inputCls} />
            <datalist id="contract-vehicle-suggestions">{vehicleSuggestions.map((v) => <option key={v} value={v} />)}</datalist>
            {isNewVehicle && (
              <CreateNewCard label="vehicle" value={contract.vehicle_plate} created={cCreatedFlags.vehicle} loading={cCreating === 'vehicle'}
                onCreate={() => createContractEntity('Vehicle', { plate_number: contract.vehicle_plate, make: '—', model: '—' }, 'vehicle')} />
            )}
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('assigned_driver')}</Label>
            <Input list="contract-driver-suggestions" value={contract.driver_name} onChange={(e) => updateContract('driver_name', e.target.value)} placeholder="Ahmed" className={inputCls} />
            <datalist id="contract-driver-suggestions">{driverSuggestions.map((d) => <option key={d} value={d} />)}</datalist>
            {isNewDriver && (
              <CreateNewCard label="driver" value={contract.driver_name} created={cCreatedFlags.driver} loading={cCreating === 'driver'}
                onCreate={() => createContractEntity('Driver', { name: contract.driver_name, phone: '—' }, 'driver')} />
            )}
          </div>
        </div>
      </Section>

      {/* Expense Tracker */}
      <Section title={t('expense_tracker')}>
        <div className="flex flex-wrap gap-1.5">
          {CONTRACT_CATS.map((c) => {
            const total = catTotals.find((ct) => ct.key === c.key)?.amount || 0;
            const isActive = activeCat === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveCat(c.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${isActive ? 'text-white' : 'text-white/40 hover:text-white/60 bg-white/[0.03] border-white/[0.06]'}`}
                style={isActive
                  ? { background: `${c.color}22`, borderColor: `${c.color}55`, boxShadow: `0 0 10px ${c.color}22` }
                  : undefined
                }>
                <c.icon className="w-3.5 h-3.5" style={{ color: c.color }} />
                {t(c.labelKey)}
                {total > 0 && <span className="opacity-70">{formatCurrency(total)}</span>}
              </button>
            );
          })}
        </div>

        <div className="glass-card p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-white/60 mb-1.5">{t('date')}</Label>
              <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))} className={`${inputCls} date-input-clean`} />
            </div>
            <div>
              <Label className="text-xs text-white/60 mb-1.5">{t('amount')} (AED)</Label>
              <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))} className={inputCls} />
            </div>
          </div>
          {activeCat === 'fuel' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-white/60 mb-1.5">{t('liters')}</Label>
                <Input type="number" value={expenseForm.liters} onChange={(e) => setExpenseForm((f) => ({ ...f, liters: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <Label className="text-xs text-white/60 mb-1.5">{t('price_per_liter')}</Label>
                <Input type="number" value={expenseForm.price_per_liter} onChange={(e) => setExpenseForm((f) => ({ ...f, price_per_liter: e.target.value }))} className={inputCls} />
              </div>
            </div>
          )}
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('description')}</Label>
            <Input value={expenseForm.description} onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} className={inputCls} />
          </div>
          <Button type="button" variant="outline" onClick={addExpense} className="w-full border-border border-dashed">
            <Plus className="w-4 h-4 mr-1.5" /> {activeMeta.labelKey ? `${t(activeMeta.labelKey)} — ${t('add_expense')}` : t('add_expense')}
          </Button>
        </div>

        {expenses.length > 0 && (
          <div className="space-y-2">
            {expenses.map((e) => {
              const meta = CONTRACT_CATS.find((c) => c.key === e.category) || CONTRACT_CATS[0];
              return (
                <div key={e.id} className="group flex items-center gap-3 glass-card p-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}1a`, border: `1px solid ${meta.color}33` }}>
                    <meta.icon className="w-4 h-4" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{e.description || t(meta.labelKey)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {t(meta.labelKey)} · {e.date}
                      {e.category === 'fuel' && (Number(e.liters) > 0 || Number(e.price_per_liter) > 0) && (
                        <span className="opacity-70"> · {e.liters}L × {formatCurrency(Number(e.price_per_liter) || 0)}</span>
                      )}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground flex-shrink-0">{formatCurrency(Number(e.amount) || 0)}</span>
                  <button type="button" onClick={() => removeExpense(e.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Document Vault */}
      <Section title={t('document_vault')}>
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