export const DEFAULT_TEMPLATE = {
  header: {
    logoPosition: 'left',
    logoSize: 'medium',
    companyInfoPlacement: 'right',
    titleFontSize: 'large',
    titleWeight: 'bold',
    showInvoiceNumber: true,
    showIssueDate: true,
    showDueDate: true,
    showStatusBadge: false,
    accentColor: '#1a1a1a',
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
  },
  footer: {
    showPaymentInstructions: true,
    showBankDetails: true,
    showSignatureLine: true,
    showThankYouNote: true,
    showPageNumbers: false,
    alignment: 'center',
    showDivider: true,
  },
  layout: {
    pageSize: 'A4',
    margin: 'normal',
    mobilePreview: false,
  },
};

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