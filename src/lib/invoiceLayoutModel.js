/**
 * Invoice Layout Model — block-based layout definitions for the modular
 * invoice layout system. Each invoice section is an independent, repositionable
 * block with configurable style, spacing, borders, background, and (for the
 * table) column widths.
 */

// ═══════════════════════════════════════════════════════════
// BLOCK TYPES
// ═══════════════════════════════════════════════════════════
export const BLOCK_TYPES = ['header', 'billTo', 'table', 'totals', 'terms', 'signature', 'footer'];

export const BLOCK_META = {
  header:    { label: 'Header',             icon: 'Building2',  color: '#6366f1', canDisable: true,  canReorder: true,  desc: 'Logo, company name, contact info, TAX INVOICE title, TRN' },
  billTo:    { label: 'Bill To',            icon: 'User',       color: '#8b5cf6', canDisable: true,  canReorder: true,  desc: 'Client name, attention, address, TRN, invoice #/date/LPO ref' },
  table:     { label: 'Line Items Table',   icon: 'Table2',     color: '#3b82f6', canDisable: true,  canReorder: true,  desc: 'SL No, Trip Date, Description, Qty, Unit Price, Amount, VAT, Total' },
  totals:    { label: 'Totals',             icon: 'Calculator', color: '#10b981', canDisable: true,  canReorder: true,  desc: 'Amount in Words, Subtotal, VAT, Total Amount' },
  terms:     { label: 'Terms & Conditions',  icon: 'FileText',  color: '#f59e0b', canDisable: true,  canReorder: true,  desc: 'Payment terms text' },
  signature: { label: 'Signature',          icon: 'PenLine',    color: '#ec4899', canDisable: true,  canReorder: true,  desc: 'Bank details, Authorized By / Received By, signature lines' },
  footer:    { label: 'Footer',             icon: 'PanelBottom',color: '#64748b', canDisable: true,  canReorder: true,  desc: 'Tagline banner, page number' },
};

// ═══════════════════════════════════════════════════════════
// STYLE OPTIONS
// ═══════════════════════════════════════════════════════════
export const FONT_FAMILIES = [
  { value: 'times', label: 'Times New Roman' },
  { value: 'helvetica', label: 'Helvetica / Arial' },
  { value: 'courier', label: 'Courier' },
];

export const FONT_WEIGHTS = [
  { value: 'normal', label: 'Regular' },
  { value: 'bold', label: 'Bold' },
  { value: 'italic', label: 'Italic' },
  { value: 'bolditalic', label: 'Bold Italic' },
];

export const ALIGNMENTS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

// ═══════════════════════════════════════════════════════════
// BILL TO FIELD DEFINITIONS (per-field styling)
// ═══════════════════════════════════════════════════════════
export const BILLTO_FIELDS = [
  { key: 'clientName',    label: 'Client Name',    defaultWeight: 'bold',   defaultSize: 1.1, side: 'left' },
  { key: 'contactPerson', label: 'Attention',      defaultWeight: 'normal', defaultSize: 1,   side: 'left' },
  { key: 'address',       label: 'Address',        defaultWeight: 'normal', defaultSize: 1,   side: 'left' },
  { key: 'trn',           label: 'TRN',            defaultWeight: 'normal', defaultSize: 1,   side: 'left' },
  { key: 'sub',           label: 'Subject',       defaultWeight: 'normal', defaultSize: 1,   side: 'left' },
  { key: 'regNo',         label: 'Reg No',         defaultWeight: 'normal', defaultSize: 1,   side: 'left' },
  { key: 'invoiceNo',     label: 'Invoice #',      defaultWeight: 'normal', defaultSize: 1,   side: 'right' },
  { key: 'invoiceDate',   label: 'Invoice Date',   defaultWeight: 'normal', defaultSize: 1,   side: 'right' },
  { key: 'lpoRef',        label: 'LPO Ref #',      defaultWeight: 'normal', defaultSize: 1,   side: 'right' },
];

// ═══════════════════════════════════════════════════════════
// SIGNATURE FIELD DEFINITIONS (per-field styling)
// ═══════════════════════════════════════════════════════════
export const SIGNATURE_FIELDS = [
  { key: 'bankLabel',       label: 'Bank Details Label', defaultWeight: 'bold',   defaultSize: 1 },
  { key: 'bankName',        label: 'Bank Name',          defaultWeight: 'normal', defaultSize: 1 },
  { key: 'bankAccountTitle',label: 'Account Title',      defaultWeight: 'normal', defaultSize: 1 },
  { key: 'bankAccountNo',   label: 'Account No',         defaultWeight: 'normal', defaultSize: 1 },
  { key: 'bankIban',        label: 'IBAN',               defaultWeight: 'normal', defaultSize: 1 },
  { key: 'bankBranch',      label: 'Branch',             defaultWeight: 'normal', defaultSize: 1 },
  { key: 'authLabel',       label: 'Authorized By',      defaultWeight: 'bold',   defaultSize: 1 },
  { key: 'authCaption',     label: 'Auth Signature Text',defaultWeight: 'normal', defaultSize: 1 },
  { key: 'authCompany',     label: 'Company Name',      defaultWeight: 'bold',   defaultSize: 1 },
  { key: 'recvLabel',       label: 'Received By',        defaultWeight: 'bold',   defaultSize: 1 },
  { key: 'recvCaption',     label: 'Client Signature Text',defaultWeight: 'normal', defaultSize: 1 },
  { key: 'recvClient',      label: 'Client Name',        defaultWeight: 'bold',   defaultSize: 1 },
];

// Default signature internal spacing (mm)
export const DEFAULT_SIG_SPACING = { sigGap: 2, sigTopGap: 12, lineCaptionGap: 3.5, captionNameGap: 7 };

// Default signature element checklist — unchecked items collapse entirely
export const DEFAULT_SIG_ELEMENTS = {
  authorizedBy: true,
  receivedBy: true,
  companyStamp: false,
  dateField: false,
  termsAccepted: false,
};

// Default table pagination — auto-balance fills each page to the footer
// pageOverrides: { [pageNum]: rowCount } — manual per-page row count override
// sigOnEveryPage: when true, signature block repeats on every page (not just last)
export const DEFAULT_TABLE_PAGINATION = { mode: 'auto', rowsPerPage: 20, pageOverrides: {}, sigOnEveryPage: false };

// Build default field config for a block type
function defaultFieldsFor(type) {
  const defs = type === 'billTo' ? BILLTO_FIELDS : type === 'signature' ? SIGNATURE_FIELDS : [];
  return defs.reduce((acc, f) => ({
    ...acc,
    [f.key]: { visible: true, fontWeight: f.defaultWeight, fontSize: f.defaultSize, color: null },
  }), {});
}

// ═══════════════════════════════════════════════════════════
// READY-MADE PRESETS (3 per block type)
// ═══════════════════════════════════════════════════════════
export const BILLTO_PRESETS = [
  {
    name: 'Classic',
    style: { fontFamily: 'times', fontSize: 10, fontWeight: 'normal', color: '#000000', lineHeight: 1.3 },
    fields: {
      clientName: { visible: true, fontWeight: 'bold', fontSize: 1.1, color: null },
      contactPerson: { visible: true, fontWeight: 'normal', fontSize: 1, color: null },
      address: { visible: true, fontWeight: 'normal', fontSize: 1, color: null },
      trn: { visible: true, fontWeight: 'normal', fontSize: 1, color: null },
    },
  },
  {
    name: 'Modern',
    style: { fontFamily: 'helvetica', fontSize: 10, fontWeight: 'normal', color: '#1f2937', lineHeight: 1.4 },
    fields: {
      clientName: { visible: true, fontWeight: 'bold', fontSize: 1.3, color: '#1e40af' },
      contactPerson: { visible: true, fontWeight: 'normal', fontSize: 1, color: null },
      address: { visible: true, fontWeight: 'normal', fontSize: 0.95, color: '#6b7280' },
      trn: { visible: true, fontWeight: 'bold', fontSize: 1.1, color: '#1e40af' },
    },
  },
  {
    name: 'Minimal',
    style: { fontFamily: 'helvetica', fontSize: 9, fontWeight: 'normal', color: '#4b5563', lineHeight: 1.5 },
    fields: {
      clientName: { visible: true, fontWeight: 'bold', fontSize: 1, color: '#111827' },
      contactPerson: { visible: true, fontWeight: 'normal', fontSize: 0.9, color: null },
      address: { visible: true, fontWeight: 'normal', fontSize: 0.9, color: null },
      trn: { visible: true, fontWeight: 'normal', fontSize: 0.9, color: null },
    },
  },
];

export const SIGNATURE_PRESETS = [
  {
    name: 'Classic',
    sigSpacing: { ...DEFAULT_SIG_SPACING },
    fields: {},
  },
  {
    name: 'Compact',
    sigSpacing: { sigGap: 1, sigTopGap: 8, lineCaptionGap: 2.5, captionNameGap: 5 },
    fields: {
      authLabel: { visible: true, fontWeight: 'bold', fontSize: 0.95, color: null },
      recvLabel: { visible: true, fontWeight: 'bold', fontSize: 0.95, color: null },
    },
  },
  {
    name: 'Spacious',
    sigSpacing: { sigGap: 4, sigTopGap: 18, lineCaptionGap: 5, captionNameGap: 10 },
    fields: {
      authLabel: { visible: true, fontWeight: 'bold', fontSize: 1.1, color: '#1e40af' },
      recvLabel: { visible: true, fontWeight: 'bold', fontSize: 1.1, color: '#1e40af' },
      authCompany: { visible: true, fontWeight: 'bold', fontSize: 1.05, color: null },
      recvClient: { visible: true, fontWeight: 'bold', fontSize: 1.05, color: null },
    },
  },
];

// 5 Smart Signature Styles — one-click professional layouts
export const SIGNATURE_SMART_STYLES = [
  {
    name: 'Executive',
    desc: 'Bold labels, accent navy names',
    sigSpacing: { sigGap: 3, sigTopGap: 14, lineCaptionGap: 4, captionNameGap: 8 },
    fields: {
      bankLabel: { visible: true, fontWeight: 'bold', fontSize: 1.1, color: '#1e3a5f' },
      authLabel: { visible: true, fontWeight: 'bold', fontSize: 1.15, color: '#1e3a5f' },
      recvLabel: { visible: true, fontWeight: 'bold', fontSize: 1.15, color: '#1e3a5f' },
      authCompany: { visible: true, fontWeight: 'bold', fontSize: 1.1, color: '#1e3a5f' },
      recvClient: { visible: true, fontWeight: 'bold', fontSize: 1.1, color: '#1e3a5f' },
      authCaption: { visible: true, fontWeight: 'italic', fontSize: 0.9, color: null },
      recvCaption: { visible: true, fontWeight: 'italic', fontSize: 0.9, color: null },
    },
  },
  {
    name: 'Minimal',
    desc: 'Clean, light, lots of whitespace',
    sigSpacing: { sigGap: 2, sigTopGap: 16, lineCaptionGap: 3, captionNameGap: 6 },
    fields: {
      bankLabel: { visible: true, fontWeight: 'normal', fontSize: 0.95, color: '#666666' },
      authLabel: { visible: true, fontWeight: 'normal', fontSize: 1, color: '#333333' },
      recvLabel: { visible: true, fontWeight: 'normal', fontSize: 1, color: '#333333' },
      authCompany: { visible: true, fontWeight: 'normal', fontSize: 1, color: '#333333' },
      recvClient: { visible: true, fontWeight: 'normal', fontSize: 1, color: '#333333' },
      authCaption: { visible: true, fontWeight: 'normal', fontSize: 0.85, color: '#999999' },
      recvCaption: { visible: true, fontWeight: 'normal', fontSize: 0.85, color: '#999999' },
    },
  },
  {
    name: 'Corporate',
    desc: 'Professional bold hierarchy',
    sigSpacing: { sigGap: 2, sigTopGap: 12, lineCaptionGap: 3.5, captionNameGap: 7 },
    fields: {
      bankLabel: { visible: true, fontWeight: 'bold', fontSize: 1.05, color: '#000000' },
      authLabel: { visible: true, fontWeight: 'bold', fontSize: 1.1, color: '#000000' },
      recvLabel: { visible: true, fontWeight: 'bold', fontSize: 1.1, color: '#000000' },
      authCompany: { visible: true, fontWeight: 'bold', fontSize: 1.05, color: '#000000' },
      recvClient: { visible: true, fontWeight: 'bold', fontSize: 1.05, color: '#000000' },
      authCaption: { visible: true, fontWeight: 'normal', fontSize: 0.9, color: '#555555' },
      recvCaption: { visible: true, fontWeight: 'normal', fontSize: 0.9, color: '#555555' },
    },
  },
  {
    name: 'Elegant',
    desc: 'Italic captions, refined spacing',
    sigSpacing: { sigGap: 3, sigTopGap: 15, lineCaptionGap: 4, captionNameGap: 9 },
    fields: {
      bankLabel: { visible: true, fontWeight: 'bold', fontSize: 1, color: '#4a4a4a' },
      authLabel: { visible: true, fontWeight: 'bold', fontSize: 1.05, color: '#4a4a4a' },
      recvLabel: { visible: true, fontWeight: 'bold', fontSize: 1.05, color: '#4a4a4a' },
      authCompany: { visible: true, fontWeight: 'bold', fontSize: 1, color: '#2a2a2a' },
      recvClient: { visible: true, fontWeight: 'bold', fontSize: 1, color: '#2a2a2a' },
      authCaption: { visible: true, fontWeight: 'italic', fontSize: 0.9, color: '#888888' },
      recvCaption: { visible: true, fontWeight: 'italic', fontSize: 0.9, color: '#888888' },
    },
  },
  {
    name: 'Bold',
    desc: 'Heavy emphasis, tight spacing',
    sigSpacing: { sigGap: 1, sigTopGap: 10, lineCaptionGap: 3, captionNameGap: 6 },
    fields: {
      bankLabel: { visible: true, fontWeight: 'bold', fontSize: 1.15, color: '#000000' },
      authLabel: { visible: true, fontWeight: 'bold', fontSize: 1.2, color: '#000000' },
      recvLabel: { visible: true, fontWeight: 'bold', fontSize: 1.2, color: '#000000' },
      authCompany: { visible: true, fontWeight: 'bold', fontSize: 1.15, color: '#000000' },
      recvClient: { visible: true, fontWeight: 'bold', fontSize: 1.15, color: '#000000' },
      authCaption: { visible: true, fontWeight: 'bold', fontSize: 0.9, color: '#444444' },
      recvCaption: { visible: true, fontWeight: 'bold', fontSize: 0.9, color: '#444444' },
    },
  },
];

// Default text style per block type
export const BLOCK_DEFAULT_STYLES = {
  header:    { fontFamily: 'times', fontSize: 10, fontWeight: 'bold',   color: '#000000', align: 'left',   lineHeight: 1.2 },
  billTo:    { fontFamily: 'times', fontSize: 10, fontWeight: 'normal', color: '#000000', align: 'left',   lineHeight: 1.3 },
  table:     { fontFamily: 'times', fontSize: 9,  fontWeight: 'normal', color: '#000000', align: 'left',   lineHeight: 1.2 },
  totals:    { fontFamily: 'times', fontSize: 10, fontWeight: 'normal', color: '#000000', align: 'right',  lineHeight: 1.3 },
  terms:     { fontFamily: 'times', fontSize: 9,  fontWeight: 'normal', color: '#333333', align: 'center', lineHeight: 1.3 },
  signature: { fontFamily: 'times', fontSize: 10, fontWeight: 'normal', color: '#000000', align: 'left',   lineHeight: 1.3 },
  footer:    { fontFamily: 'times', fontSize: 8,  fontWeight: 'normal', color: '#666666', align: 'center', lineHeight: 1.2 },
};

// Per-column text style defaults: alignment + weight + relative size multiplier.
// `fontSize` is a multiplier of the block's base font size (1 = same as block).
const COL_STYLE = {
  sl:     { align: 'center', fontWeight: 'normal', fontSize: 1 },
  date:   { align: 'center', fontWeight: 'normal', fontSize: 1 },
  desc:   { align: 'left',   fontWeight: 'bold',   fontSize: 1 },
  qty:    { align: 'center', fontWeight: 'normal', fontSize: 1 },
  price:  { align: 'right',  fontWeight: 'bold',   fontSize: 1 },
  amount: { align: 'right',  fontWeight: 'bold',   fontSize: 1 },
  vat:    { align: 'right',  fontWeight: 'bold',   fontSize: 1 },
  total:  { align: 'right',  fontWeight: 'bold',   fontSize: 1 },
};

function withColStyle(cols) {
  return cols.map(c => ({ ...c, ...(COL_STYLE[c.key] || { align: 'center', fontWeight: 'normal', fontSize: 1 }) }));
}

// Default table columns — Per Trip (percentage of table width)
export const DEFAULT_COLUMNS = withColStyle([
  { key: 'sl',     label: 'SL No',      width: 7,  visible: true, locked: true },
  { key: 'date',   label: 'Trip Date',  width: 12, visible: true },
  { key: 'desc',   label: 'Description',width: 28, visible: true },
  { key: 'qty',    label: 'Qty',        width: 7,  visible: true },
  { key: 'price',  label: 'Unit Price', width: 11, visible: true },
  { key: 'amount', label: 'Amount',     width: 11, visible: true },
  { key: 'vat',    label: 'VAT',        width: 10, visible: true },
  { key: 'total',  label: 'Total',      width: 14, visible: true, locked: true },
]);

// Default table columns — Monthly
export const DEFAULT_COLUMNS_MONTHLY = withColStyle([
  { key: 'sl',     label: 'SL No',      width: 7,  visible: true, locked: true },
  { key: 'date',   label: 'Month',      width: 12, visible: true },
  { key: 'desc',   label: 'Description',width: 28, visible: true },
  { key: 'qty',    label: 'Qty',        width: 7,  visible: true },
  { key: 'price',  label: 'Unit Price', width: 11, visible: true },
  { key: 'amount', label: 'Amount',     width: 11, visible: true },
  { key: 'vat',    label: 'VAT',        width: 10, visible: true },
  { key: 'total',  label: 'Total',      width: 14, visible: true, locked: true },
]);

// Get default columns for a given invoice type
export function getDefaultColumns(invoiceType) {
  return (invoiceType === 'monthly' ? DEFAULT_COLUMNS_MONTHLY : DEFAULT_COLUMNS).map(c => ({ ...c }));
}

// Block height estimates (mm) — for pagination + background rendering
export const BLOCK_HEIGHTS = {
  header: 34,
  billTo: 21,
  totals: 17,
  terms: 11,
  signature: 28,
  footer: 0,
  table: 8,
};

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function makeBlock(id, type) {
  const block = {
    id,
    type,
    enabled: true,
    style: { ...BLOCK_DEFAULT_STYLES[type] },
    spacing: { paddingTop: 0, paddingBottom: 0 },
    border: { top: false, bottom: false },
    background: { enabled: false, color: '#f5f5f5' },
  };
  if (type === 'table') {
    block.columns = DEFAULT_COLUMNS.map(c => ({ ...c }));
    block.pagination = { ...DEFAULT_TABLE_PAGINATION };
  }
  if (type === 'billTo' || type === 'signature') {
    block.fields = defaultFieldsFor(type);
  }
  if (type === 'signature') {
    block.sigSpacing = { ...DEFAULT_SIG_SPACING };
    block.sigElements = { ...DEFAULT_SIG_ELEMENTS };
  }
  return block;
}

// ═══════════════════════════════════════════════════════════
// DEFAULT LAYOUT
// ═══════════════════════════════════════════════════════════
export const DEFAULT_LAYOUT = {
  name: 'Default Layout',
  blocks: [
    makeBlock('header',    'header'),
    makeBlock('billTo',    'billTo'),
    makeBlock('table',     'table'),
    makeBlock('totals',    'totals'),
    makeBlock('terms',     'terms'),
    makeBlock('signature', 'signature'),
    makeBlock('footer',    'footer'),
  ],
  // Per-page spacing overrides: { [pageNum]: { [blockId]: { spacing: { paddingTop, paddingBottom } } } }
  pageOverrides: {},
};

// ═══════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════
export function validateLayout(layout) {
  const errors = [];
  const warnings = [];
  if (!layout?.blocks) return { errors: ['Invalid layout'], warnings };

  const enabled = layout.blocks.filter(b => b.enabled);
  const types = enabled.map(b => b.type);

  // Only enforce: table must appear exactly once (essential for a valid invoice)
  const tableCount = types.filter(t => t === 'table').length;
  if (tableCount === 0) errors.push('Table block is required');
  else if (tableCount > 1) errors.push('Table block must appear exactly once');

  return { errors, warnings };
}

// ═══════════════════════════════════════════════════════════
// HEIGHT ESTIMATES (include spacing)
// ═══════════════════════════════════════════════════════════
export function estimateAfterTableHeight(layout) {
  if (!layout?.blocks) return 0;
  const enabled = layout.blocks.filter(b => b.enabled);
  const tableIdx = enabled.findIndex(b => b.type === 'table');
  if (tableIdx < 0) return 0;
  let height = 0;
  for (const block of enabled.slice(tableIdx + 1)) {
    if (block.type === 'footer') continue;
    height += BLOCK_HEIGHTS[block.type] || 0;
    height += 3;
    height += (block.spacing?.paddingTop || 0) + (block.spacing?.paddingBottom || 0);
  }
  return height;
}

// Estimate the height of just the signature block (for sigOnEveryPage reservation)
export function estimateSignatureHeight(layout) {
  if (!layout?.blocks) return 0;
  const enabled = layout.blocks.filter(b => b.enabled);
  const tableIdx = enabled.findIndex(b => b.type === 'table');
  if (tableIdx < 0) return 0;
  let height = 0;
  for (const block of enabled.slice(tableIdx + 1)) {
    if (block.type === 'footer') continue;
    if (block.type === 'signature') {
      height += BLOCK_HEIGHTS.signature || 28;
      height += 3;
      height += (block.spacing?.paddingTop || 0) + (block.spacing?.paddingBottom || 0);
    }
  }
  return height;
}

export function estimateBeforeTableHeight(layout) {
  if (!layout?.blocks) return 0;
  const enabled = layout.blocks.filter(b => b.enabled);
  const tableIdx = enabled.findIndex(b => b.type === 'table');
  if (tableIdx < 0) return 0;
  let height = 0;
  for (const block of enabled.slice(0, tableIdx)) {
    height += BLOCK_HEIGHTS[block.type] || 0;
    height += 1;
    height += (block.spacing?.paddingTop || 0) + (block.spacing?.paddingBottom || 0);
  }
  return height;
}

// ═══════════════════════════════════════════════════════════
// SERIALIZATION (backward-compatible)
// ═══════════════════════════════════════════════════════════
export function serializeLayout(layout) {
  return JSON.parse(JSON.stringify(layout));
}

export function deserializeLayout(config) {
  if (!config?.blocks) {
    return { ...DEFAULT_LAYOUT, blocks: DEFAULT_LAYOUT.blocks.map(b => ({
      ...b, style: { ...b.style }, columns: b.columns?.map(c => ({ ...c })),
      fields: b.fields ? { ...b.fields } : undefined,
      sigSpacing: b.sigSpacing ? { ...b.sigSpacing } : undefined,
    }))};
  }
  return {
    name: config.name || 'Custom Layout',
    blocks: config.blocks.map(b => {
      const defaultBlock = DEFAULT_LAYOUT.blocks.find(db => db.type === b.type) || makeBlock(b.id || b.type, b.type);
      return {
        ...b,
        style:     { ...defaultBlock.style,     ...(b.style     || {}) },
        spacing:   { paddingTop: 0, paddingBottom: 0, ...(b.spacing   || {}) },
        border:    { top: false, bottom: false,           ...(b.border    || {}) },
        background:{ enabled: false, color: '#f5f5f5',    ...(b.background|| {}) },
        ...((b.type === 'billTo' || b.type === 'signature') ? { fields: { ...defaultBlock.fields, ...(b.fields || {}) } } : {}),
        ...(b.type === 'signature' ? {
          sigSpacing: { ...defaultBlock.sigSpacing, ...(b.sigSpacing || {}) },
          sigElements: { ...defaultBlock.sigElements, ...(b.sigElements || {}) },
        } : {}),
        ...(b.type === 'table' ? {
          columns: (b.columns || defaultBlock.columns || []).map(c => ({ ...c })),
          pagination: {
            ...defaultBlock.pagination,
            ...(b.pagination || {}),
            pageOverrides: { ...(b.pagination?.pageOverrides || defaultBlock.pagination?.pageOverrides || {}) },
          },
        } : {}),
      };
    }),
  };
}

// ═══════════════════════════════════════════════════════════
// MOVEMENT HELPERS
// ═══════════════════════════════════════════════════════════
export function canMoveUp(layout, index) {
  if (index <= 0) return { can: false, reason: 'Already at the top' };
  const newBlocks = Array.from(layout.blocks);
  [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
  const v = validateLayout({ ...layout, blocks: newBlocks });
  if (v.errors.length > 0) return { can: false, reason: v.errors[0] };
  return { can: true, reason: '' };
}

export function canMoveDown(layout, index) {
  if (index >= layout.blocks.length - 1) return { can: false, reason: 'Already at the bottom' };
  const newBlocks = Array.from(layout.blocks);
  [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
  const v = validateLayout({ ...layout, blocks: newBlocks });
  if (v.errors.length > 0) return { can: false, reason: v.errors[0] };
  return { can: true, reason: '' };
}

export function moveBlock(layout, index, direction) {
  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= layout.blocks.length) return layout;
  const newBlocks = Array.from(layout.blocks);
  [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
  return { ...layout, blocks: newBlocks };
}

// ═══════════════════════════════════════════════════════════
// STYLE / CONFIG HELPERS
// ═══════════════════════════════════════════════════════════
export function resetBlockStyle(layout, blockId) {
  const block = layout.blocks.find(b => b.id === blockId);
  if (!block) return layout;
  return {
    ...layout,
    blocks: layout.blocks.map(b => b.id === blockId ? { ...b, style: { ...BLOCK_DEFAULT_STYLES[b.type] } } : b),
  };
}

export function applyStyleToAll(layout, style) {
  return { ...layout, blocks: layout.blocks.map(b => ({ ...b, style: { ...b.style, ...style } })) };
}

// ═══════════════════════════════════════════════════════════
// PER-FIELD STYLING HELPERS (billTo + signature)
// ═══════════════════════════════════════════════════════════

// Smart restyle: auto-emphasize key fields, de-emphasize secondary ones
export function smartRestyleFields(layout, blockId) {
  const block = layout.blocks.find(b => b.id === blockId);
  if (!block || !block.fields) return layout;
  const newFields = { ...block.fields };
  if (block.type === 'billTo') {
    // Emphasize client name + TRN, keep others regular
    newFields.clientName = { ...newFields.clientName, fontWeight: 'bold', fontSize: 1.2, color: null };
    newFields.trn = { ...newFields.trn, fontWeight: 'bold', fontSize: 1.05, color: null };
    newFields.contactPerson = { ...newFields.contactPerson, fontWeight: 'normal', fontSize: 1, color: null };
    newFields.address = { ...newFields.address, fontWeight: 'normal', fontSize: 0.95, color: null };
    if (newFields.sub) newFields.sub = { ...newFields.sub, fontWeight: 'normal', fontSize: 1, color: null };
    if (newFields.regNo) newFields.regNo = { ...newFields.regNo, fontWeight: 'normal', fontSize: 1, color: null };
    if (newFields.invoiceNo) newFields.invoiceNo = { ...newFields.invoiceNo, fontWeight: 'bold', fontSize: 1, color: null };
    if (newFields.invoiceDate) newFields.invoiceDate = { ...newFields.invoiceDate, fontWeight: 'normal', fontSize: 1, color: null };
  } else if (block.type === 'signature') {
    // Emphasize labels + company names, keep details regular
    newFields.bankLabel = { ...newFields.bankLabel, fontWeight: 'bold', fontSize: 1.05, color: null };
    newFields.authLabel = { ...newFields.authLabel, fontWeight: 'bold', fontSize: 1.1, color: null };
    newFields.recvLabel = { ...newFields.recvLabel, fontWeight: 'bold', fontSize: 1.1, color: null };
    newFields.authCompany = { ...newFields.authCompany, fontWeight: 'bold', fontSize: 1, color: null };
    newFields.recvClient = { ...newFields.recvClient, fontWeight: 'bold', fontSize: 1, color: null };
    newFields.authCaption = { ...newFields.authCaption, fontWeight: 'normal', fontSize: 0.9, color: null };
    newFields.recvCaption = { ...newFields.recvCaption, fontWeight: 'normal', fontSize: 0.9, color: null };
  }
  return { ...layout, blocks: layout.blocks.map(b => b.id === blockId ? { ...b, fields: newFields } : b) };
}

// Apply a preset to a block
export function applyPreset(layout, blockId, blockType, preset) {
  return {
    ...layout,
    blocks: layout.blocks.map(b => {
      if (b.id !== blockId) return b;
      const updated = { ...b };
      if (preset.style) updated.style = { ...b.style, ...preset.style };
      if (preset.sigSpacing) updated.sigSpacing = { ...b.sigSpacing, ...preset.sigSpacing };
      if (preset.fields) {
        const baseDefaults = defaultFieldsFor(blockType);
        updated.fields = { ...baseDefaults, ...b.fields, ...preset.fields };
      }
      return updated;
    }),
  };
}

// Reset fields to defaults
export function resetBlockFields(layout, blockId, blockType) {
  return {
    ...layout,
    blocks: layout.blocks.map(b => b.id === blockId ? { ...b, fields: defaultFieldsFor(blockType) } : b),
  };
}

// ═══════════════════════════════════════════════════════════
// COLUMN WIDTH HELPERS
// ═══════════════════════════════════════════════════════════

// Smart adjust: give wide columns (description) more room and narrow columns
// (sl, qty) just enough, based on content-type heuristics. Keeps total = 100.
export function smartAdjustColumns(columns) {
  const visible = columns.filter(c => c.visible !== false);
  if (visible.length === 0) return columns;
  // Heuristic ideal widths by column key
  const ideal = {
    sl: 6, date: 13, desc: 30, qty: 7, price: 12, amount: 12, vat: 10, total: 14,
  };
  let total = 0;
  const proposed = visible.map(c => {
    const w = ideal[c.key] || 10;
    total += w;
    return { ...c, width: w };
  });
  // Normalize to 100
  return columns.map(c => {
    if (c.visible === false) return c;
    const p = proposed.find(x => x.key === c.key);
    return p ? { ...p, width: Math.round((p.width / total) * 100) } : c;
  });
}

// Distribute visible column widths evenly
export function distributeColumnsEvenly(columns) {
  const visible = columns.filter(c => c.visible !== false);
  if (visible.length === 0) return columns;
  const each = Math.floor(100 / visible.length);
  let remainder = 100 - each * visible.length;
  return columns.map(c => {
    if (c.visible === false) return c;
    const w = each + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    return { ...c, width: w };
  });
}