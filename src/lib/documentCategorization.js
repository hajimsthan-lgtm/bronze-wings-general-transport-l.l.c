/**
 * Shared document categorization — maps document type strings to
 * distinct icons, accent colors, and category groups.
 * Used by CompanyDocuments page, DocumentsSection, and alertEngine.
 */

import {
  Car, IdCard, Briefcase, Receipt, ShieldCheck, FileText,
  Stamp, Building2, Flame, Truck, Award, FileCheck2,
} from 'lucide-react';

/**
 * Per-type icon + accent color.
 * Matches the colored-icon-chip design language used elsewhere.
 */
const TYPE_VISUALS = {
  // Vehicle documents
  'Vehicle Registration': { icon: Car, color: '#3b82f6' },
  'Vehicle Insurance': { icon: ShieldCheck, color: '#ef4444' },
  // Driver documents
  'Driving License': { icon: IdCard, color: '#a855f7' },
  'Visa': { icon: Stamp, color: '#f59e0b' },
  'Emirates ID': { icon: IdCard, color: '#10b981' },
  // Company compliance
  'Trade License (DED)': { icon: Briefcase, color: '#3b82f6' },
  'Establishment / Immigration Card': { icon: IdCard, color: '#a855f7' },
  'Chamber of Commerce Certificate': { icon: Award, color: '#f59e0b' },
  'VAT Registration Certificate (TRN)': { icon: Receipt, color: '#10b981' },
  'Transport Permit (DTC / ITC)': { icon: Truck, color: '#06b6d4' },
  'Fleet / Vehicle Master Insurance Policy': { icon: ShieldCheck, color: '#ef4444' },
  'Public Liability Insurance': { icon: ShieldCheck, color: '#f97316' },
  'Office Tenancy Contract (Tawtheeq)': { icon: Building2, color: '#14b8a6' },
  'Civil Defense / Fire Safety Certificate': { icon: Flame, color: '#ef4444' },
  'Customs Code Certificate': { icon: FileCheck2, color: '#3b82f6' },
};

const FALLBACK = { icon: FileText, color: '#6b7280' };

/**
 * Get icon component + accent color for a document type string.
 * Falls back to a generic document icon.
 */
export function getDocVisuals(typeStr) {
  if (!typeStr) return FALLBACK;
  // Try exact match first
  if (TYPE_VISUALS[typeStr]) return TYPE_VISUALS[typeStr];
  // Fuzzy: case-insensitive includes
  const lower = typeStr.toLowerCase();
  for (const key of Object.keys(TYPE_VISUALS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return TYPE_VISUALS[key];
    }
  }
  // Keyword-based fallbacks
  if (lower.includes('license') || lower.includes('licence')) return { icon: IdCard, color: '#a855f7' };
  if (lower.includes('registration') || lower.includes('mulkiya')) return { icon: Car, color: '#3b82f6' };
  if (lower.includes('insurance')) return { icon: ShieldCheck, color: '#ef4444' };
  if (lower.includes('vat') || lower.includes('tax') || lower.includes('trn')) return { icon: Receipt, color: '#10b981' };
  if (lower.includes('visa')) return { icon: Stamp, color: '#f59e0b' };
  if (lower.includes('trade')) return { icon: Briefcase, color: '#3b82f6' };
  if (lower.includes('permit')) return { icon: Truck, color: '#06b6d4' };
  return FALLBACK;
}

/**
 * Category groups for filter tabs on the CompanyDocuments page.
 * Each category maps to a set of document types.
 */
export const DOC_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'licenses', label: 'Licenses & Permits' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'tax', label: 'Tax & VAT' },
  { key: 'facilities', label: 'Facilities' },
  { key: 'other', label: 'Other' },
];

const CATEGORY_MAP = {
  'Trade License (DED)': 'licenses',
  'Establishment / Immigration Card': 'licenses',
  'Chamber of Commerce Certificate': 'licenses',
  'Transport Permit (DTC / ITC)': 'licenses',
  'Customs Code Certificate': 'licenses',
  'Fleet / Vehicle Master Insurance Policy': 'insurance',
  'Public Liability Insurance': 'insurance',
  'VAT Registration Certificate (TRN)': 'tax',
  'Office Tenancy Contract (Tawtheeq)': 'facilities',
  'Civil Defense / Fire Safety Certificate': 'facilities',
  'Other': 'other',
};

/**
 * Get the category key for a document type.
 * Falls back to 'other' for unknown types.
 */
export function getDocCategory(typeStr) {
  if (!typeStr) return 'other';
  if (CATEGORY_MAP[typeStr]) return CATEGORY_MAP[typeStr];
  const lower = typeStr.toLowerCase();
  if (lower.includes('insurance')) return 'insurance';
  if (lower.includes('vat') || lower.includes('tax') || lower.includes('trn')) return 'tax';
  if (lower.includes('license') || lower.includes('licence') || lower.includes('permit')) return 'licenses';
  if (lower.includes('tenancy') || lower.includes('civil') || lower.includes('fire')) return 'facilities';
  return 'other';
}

/**
 * Build a specific, human-distinguishable document title.
 * Pattern: {Document Type} — {Owning Entity Identifier}
 *
 * @param {string} docType — the document type string
 * @param {string} [ownerLabel] — the owning entity identifier (plate, name, company, etc.)
 * @returns {string}
 */
export function buildDocTitle(docType, ownerLabel) {
  const type = docType || 'Document';
  if (ownerLabel && ownerLabel.trim()) return `${type} — ${ownerLabel.trim()}`;
  return type;
}