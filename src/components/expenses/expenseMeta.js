import { Fuel, Wrench, Car, CreditCard, ShieldCheck, Building, Package } from 'lucide-react';

export const EXPENSE_CATEGORIES = ['all', 'maintenance', 'toll', 'salary', 'insurance', 'registration', 'office', 'other'];

export const categoryIcons = {
  fuel: Fuel, maintenance: Wrench, toll: Car, salary: CreditCard,
  insurance: ShieldCheck, registration: Building, office: Building, other: Package,
};

export const categoryColors = {
  fuel: '#f97316', maintenance: '#3b82f6', toll: '#a855f7', salary: '#22c55e',
  insurance: '#ec4899', registration: '#14b8a6', office: '#f59e0b', other: '#94a3b8',
};

export const hexToRgba = (hex, a) => {
  const h = (hex || '#94a3b8').replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};