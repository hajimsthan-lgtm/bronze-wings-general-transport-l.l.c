import { Fuel, Wrench, Receipt, ShieldCheck, FileBadge, Package } from 'lucide-react';

export const CONTRACT_CATS = [
  { key: 'fuel', labelKey: 'cat_fuel', icon: Fuel, color: '#3b82f6' },
  { key: 'maintenance', labelKey: 'cat_maintenance', icon: Wrench, color: '#f59e0b' },
  { key: 'salik_tolls', labelKey: 'cat_salik_tolls', icon: Receipt, color: '#22c55e' },
  { key: 'insurance', labelKey: 'cat_insurance', icon: ShieldCheck, color: '#ef4444' },
  { key: 'registration', labelKey: 'cat_registration', icon: FileBadge, color: '#60a5fa' },
  { key: 'other', labelKey: 'cat_other', icon: Package, color: '#888888' },
];