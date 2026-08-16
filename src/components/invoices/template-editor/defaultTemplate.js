export const DEFAULT_TEMPLATE = {
  header: {
    logoPosition: 'left',
    logoSize: 'medium',
    companyInfoPlacement: 'right',
    titleFontSize: 'large',
    titleWeight: 'bold',
    titleFontFamily: 'sans',
    showInvoiceNumber: true,
    showIssueDate: true,
    showDueDate: true,
    showStatusBadge: false,
    accentColor: '#1a1a1a',
    headerBgColor: '',
    showBillTo: true,
  },
  table: {
    columns: [
      { key: 'description', label: 'Description', width: 35, align: 'left', visible: true },
      { key: 'date', label: 'Date', width: 12, align: 'center', visible: true },
      { key: 'quantity', label: 'Qty', width: 10, align: 'center', visible: true },
      { key: 'unit_price', label: 'Unit Price', width: 15, align: 'right', visible: true },
      { key: 'discount', label: 'Discount', width: 10, align: 'right', visible: false },
      { key: 'amount', label: 'Amount', width: 18, align: 'right', visible: true },
    ],
    zebraStriping: true,
    borderStyle: 'horizontal',
    rowHeight: 'comfortable',
    headerRowBg: true,
    headerRowBold: true,
    headerRowUppercase: true,
    fontSize: 'small',
    headerTextColor: '#000000',
    bodyTextColor: '#000000',
  },
  content: {
    notesPosition: 'below',
    showNotes: true,
    showSubtotal: true,
    showTax: true,
    showDiscount: false,
    showTotal: true,
    showBalanceDue: true,
    totalEmphasis: true,
    totalsBgColor: '',
    totalsFontSize: 'small',
  },
  footer: {
    showPaymentInstructions: true,
    showBankDetails: true,
    showSignatureLine: true,
    showThankYouNote: true,
    showPageNumbers: false,
    alignment: 'center',
    showDivider: true,
    bgColor: '',
    fontSize: 'small',
  },
  layout: {
    pageSize: 'A4',
    margin: 'normal',
    mobilePreview: false,
    bodyFontFamily: 'sans',
    bodyFontSize: 'small',
  },
};

export const PRESET_TEMPLATES = [
  {
    id: 'standard',
    name: 'Standard',
    description: 'Clean professional layout',
    config: JSON.parse(JSON.stringify(DEFAULT_TEMPLATE)),
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, no frills',
    config: {
      ...JSON.parse(JSON.stringify(DEFAULT_TEMPLATE)),
      header: { ...DEFAULT_TEMPLATE.header, logoSize: 'small', titleFontSize: 'medium', showStatusBadge: false, accentColor: '#333333', headerBgColor: '' },
      table: { ...DEFAULT_TEMPLATE.table, zebraStriping: false, headerRowBg: false, borderStyle: 'horizontal', rowHeight: 'compact' },
      content: { ...DEFAULT_TEMPLATE.content, totalEmphasis: false },
      footer: { ...DEFAULT_TEMPLATE.footer, showDivider: false, showPageNumbers: false, showPaymentInstructions: false },
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Blue accent, bold',
    config: {
      ...JSON.parse(JSON.stringify(DEFAULT_TEMPLATE)),
      header: { ...DEFAULT_TEMPLATE.header, logoSize: 'large', titleFontSize: 'large', titleWeight: 'bold', accentColor: '#2563eb', headerBgColor: '#eff6ff' },
      table: { ...DEFAULT_TEMPLATE.table, zebraStriping: false, borderStyle: 'horizontal', headerRowBg: true, headerRowUppercase: true },
      content: { ...DEFAULT_TEMPLATE.content, totalEmphasis: true },
      layout: { ...DEFAULT_TEMPLATE.layout, bodyFontFamily: 'sans' },
    },
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Serif, formal, full grid',
    config: {
      ...JSON.parse(JSON.stringify(DEFAULT_TEMPLATE)),
      header: { ...DEFAULT_TEMPLATE.header, titleFontFamily: 'serif', accentColor: '#1a1a1a', headerBgColor: '#f5f5f5' },
      table: { ...DEFAULT_TEMPLATE.table, borderStyle: 'full', zebraStriping: true, headerRowBg: true, headerRowUppercase: true },
      content: { ...DEFAULT_TEMPLATE.content, totalEmphasis: true },
      footer: { ...DEFAULT_TEMPLATE.footer, showDivider: true, alignment: 'center' },
      layout: { ...DEFAULT_TEMPLATE.layout, bodyFontFamily: 'serif' },
    },
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Red accent, large, emphasis',
    config: {
      ...JSON.parse(JSON.stringify(DEFAULT_TEMPLATE)),
      header: { ...DEFAULT_TEMPLATE.header, logoSize: 'large', titleFontSize: 'large', titleWeight: 'bold', accentColor: '#dc2626', headerBgColor: '#fef2f2' },
      table: { ...DEFAULT_TEMPLATE.table, zebraStriping: true, borderStyle: 'horizontal', headerRowBg: true, headerRowBold: true, rowHeight: 'comfortable' },
      content: { ...DEFAULT_TEMPLATE.content, totalEmphasis: true },
      layout: { ...DEFAULT_TEMPLATE.layout, bodyFontSize: 'medium' },
    },
  },
];

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function mergeTemplate(saved) {
  if (!saved) return deepClone(DEFAULT_TEMPLATE);
  const s = saved;
  return {
    header: { ...DEFAULT_TEMPLATE.header, ...(s.header || {}) },
    table: {
      ...DEFAULT_TEMPLATE.table,
      ...(s.table || {}),
      columns: (s.table?.columns || DEFAULT_TEMPLATE.table.columns).map((c, i) => ({
        ...DEFAULT_TEMPLATE.table.columns[i],
        ...c,
      })),
    },
    content: { ...DEFAULT_TEMPLATE.content, ...(s.content || {}) },
    footer: { ...DEFAULT_TEMPLATE.footer, ...(s.footer || {}) },
    layout: { ...DEFAULT_TEMPLATE.layout, ...(s.layout || {}) },
  };
}