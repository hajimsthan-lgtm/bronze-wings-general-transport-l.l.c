import { base44 } from '@/api/base44Client';

const DEFAULTS = {
  company_name: 'Bronze Wings General Transport L.L.C',
  tagline: 'We provide all kinds of general and refrigerated transportation services',
  address: 'M-6, Mussafah, Abu Dhabi, UAE',
  phone1: '050-8655601',
  phone2: '050-6816879',
  email: 'hire@bronzewings.ae',
  website: 'www.bronzewings.ae',
  trn: '100567890123456',
  logo_url: 'https://media.base44.com/images/public/6a4bb0cd26acd23dab1111c4/359e600d7_98ac009f-e0ee-449f-bece-907c49f2e5e0.png',
  default_vat_rate: 5,
  invoice_prefix: 'BW',
  inv_header_bg: '#f0f0f0',
  inv_header_text: '#000000',
  inv_row_text: '#000000',
  inv_row_alt_bg: '#fafbfc',
  inv_desc_align: 'left',
  inv_num_align: 'right',
  inv_logo_source: 'company',
  inv_logo_url: '',
  inv_logo_size: 16,
};

export async function getCompanySettings() {
  try {
    const list = await base44.entities.CompanySettings.list();
    if (list && list.length > 0) return { ...DEFAULTS, ...list[0] };
  } catch (e) {}
  return { ...DEFAULTS };
}

export async function saveCompanySettings(data) {
  const list = await base44.entities.CompanySettings.list();
  if (list && list.length > 0) {
    return base44.entities.CompanySettings.update(list[0].id, data);
  }
  return base44.entities.CompanySettings.create({ ...DEFAULTS, ...data });
}

export { generateNextInvoiceNumber as generateInvoiceNumber } from '@/lib/invoiceSequence';