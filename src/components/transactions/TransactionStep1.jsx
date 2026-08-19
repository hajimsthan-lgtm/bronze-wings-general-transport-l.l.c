import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inputClass, labelClass, selectTriggerClass, selectContentClass, selectItemClass } from './styles';
import DatePicker from '@/components/common/DatePicker';

const MODES = [
  { key: 'one_time', label: 'One-time' },
  { key: 'hourly', label: 'Hourly' },
  { key: 'recurring', label: 'Recurring' },
];

export default function TransactionStep1({ form, update, customers, services, staff }) {
  const { t } = useI18n();

  const categories = [...new Set((services || []).map(s => s.main_category).filter(Boolean))];
  const subCategories = [...new Set((services || []).filter(s => s.main_category === form.category).map(s => s.sub_category).filter(Boolean))];
  const serviceTypes = [...new Set((services || []).filter(s => s.sub_category === form.sub_category).map(s => s.service_type).filter(Boolean))];

  const handleCustomerChange = (value) => {
    update('customer_name', value);
    const c = customers?.find(c => c.name === value);
    if (c?.emirates_id) update('emirates_id', c.emirates_id);
  };

  const handleServiceTypeChange = (value) => {
    update('service_type', value);
    const svc = services?.find(s => s.service_type === value && s.sub_category === form.sub_category);
    if (svc?.price) update('amount', svc.price);
  };

  return (
    <div className="space-y-5">
      <div>
        <Label className={labelClass}>{t('customer')}</Label>
        <Input
          list="customer-list"
          value={form.customer_name}
          onChange={e => handleCustomerChange(e.target.value)}
          placeholder="Search or type customer name"
          className={inputClass}
        />
        <datalist id="customer-list">
          {(customers || []).map(c => <option key={c.id} value={c.name} />)}
        </datalist>
      </div>

      <div>
        <Label className={labelClass}>{t('emirates_id')}</Label>
        <Input value={form.emirates_id} onChange={e => update('emirates_id', e.target.value)} placeholder="784-XXXX-XXXXXXX-X" className={inputClass} />
      </div>

      <div>
        <Label className={labelClass}>{t('category')}</Label>
        <Select value={form.category} onValueChange={v => { update('category', v); update('sub_category', ''); update('service_type', ''); }}>
          <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent className={selectContentClass}>
            {categories.map(c => <SelectItem key={c} value={c} className={selectItemClass}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className={labelClass}>{t('sub_category')}</Label>
        <Select value={form.sub_category} onValueChange={v => { update('sub_category', v); update('service_type', ''); }} disabled={!form.category}>
          <SelectTrigger className={`${selectTriggerClass} ${!form.category ? 'opacity-40' : ''}`}><SelectValue placeholder="Select sub-category" /></SelectTrigger>
          <SelectContent className={selectContentClass}>
            {subCategories.map(c => <SelectItem key={c} value={c} className={selectItemClass}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className={labelClass}>{t('service_type')}</Label>
        <Select value={form.service_type} onValueChange={handleServiceTypeChange} disabled={!form.sub_category}>
          <SelectTrigger className={`${selectTriggerClass} ${!form.sub_category ? 'opacity-40' : ''}`}><SelectValue placeholder="Select service type" /></SelectTrigger>
          <SelectContent className={selectContentClass}>
            {serviceTypes.map(s => <SelectItem key={s} value={s} className={selectItemClass}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className={labelClass}>{t('staff')}</Label>
        <Select value={form.staff_name} onValueChange={v => update('staff_name', v)}>
          <SelectTrigger className={selectTriggerClass}><SelectValue placeholder="Select staff" /></SelectTrigger>
          <SelectContent className={selectContentClass}>
            {(staff || []).map(s => <SelectItem key={s.id} value={s.full_name} className={selectItemClass}>{s.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className={labelClass}>{t('date')}</Label>
        <DatePicker value={form.service_date} onChange={v => update('service_date', v)} className={inputClass} />
      </div>

      <div>
        <Label className={labelClass}>Service Mode</Label>
        <div className="flex gap-1 bg-[#111111] border border-[#27272a] rounded-lg p-1">
          {MODES.map(m => (
            <button
              key={m.key}
              onClick={() => update('service_mode', m.key)}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${form.service_mode === m.key ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}